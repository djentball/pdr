const https = require('https');
const fs = require('fs');
const path = require('path');

// Load our questions
const questionsPath = path.join(__dirname, '..', 'src', 'data', 'questions.json');
const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

// Filter questions that have images (need to find official IDs for these)
const questionsWithImages = questions.filter(q => q.image);

// Output file for mapping
const mappingPath = path.join(__dirname, 'image-mapping.json');

// Load existing mapping if exists
let mapping = {};
if (fs.existsSync(mappingPath)) {
  mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  console.log(`Loaded ${Object.keys(mapping).length} existing mappings`);
}

// Normalize text for comparison
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[''`ʼ]/g, "'")
    .replace(/[""«»]/g, '"')
    .replace(/[.,:;!?()]/g, '')
    .trim();
}

// Deep normalize for better matching (handles different phrasings)
function deepNormalizeText(text) {
  return normalizeText(text)
    // Common substitutions
    .replace(/\bвам\b/g, 'водієві')
    .replace(/\bви\b/g, 'водій')
    .replace(/\bваш\b/g, 'водій')
    .replace(/\bтз\b/g, 'транспортний засіб')
    .replace(/\bтранспортних засобів\b/g, 'тз')
    .replace(/\bданій ситуації\b/g, 'цій ситуації')
    .replace(/\bданій\b/g, 'цій')
    .replace(/\bданого\b/g, 'цього')
    .replace(/\bдане\b/g, 'це')
    .replace(/\bводію автомобіля\b/g, 'водієві')
    .replace(/\bводій автомобіля\b/g, 'водій')
    .replace(/\bпдр\b/g, 'правил дорожнього руху')
    .replace(/\bправила дорожнього руху\b/g, 'пдр')
    // Remove filler words
    .replace(/\bу даній ситуації\b/g, '')
    .replace(/\bу цій ситуації\b/g, '')
    .replace(/\bв даній ситуації\b/g, '')
    .replace(/\bв цій ситуації\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// Calculate similarity (0-1)
function similarity(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

// Extract key words from text
function extractKeywords(text) {
  const stopWords = ['у', 'в', 'на', 'з', 'із', 'до', 'та', 'і', 'й', 'чи', 'що', 'як', 'це', 'той', 'ця', 'ви', 'ваш', 'при', 'для', 'дана', 'даній', 'даного'];
  return normalizeText(text)
    .split(' ')
    .filter(w => w.length > 2 && !stopWords.includes(w));
}

// Calculate keyword overlap
function keywordOverlap(text1, text2) {
  const kw1 = new Set(extractKeywords(text1));
  const kw2 = new Set(extractKeywords(text2));
  const intersection = [...kw1].filter(w => kw2.has(w));
  const union = new Set([...kw1, ...kw2]);
  return intersection.length / union.size;
}

// Fetch a page and extract question text
function fetchTicket(ticketId) {
  return new Promise((resolve) => {
    const url = `https://pdr.infotech.gov.ua/novi-testy-pdr/ticket/${ticketId}`;

    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'uk-UA,uk;q=0.9'
      }
    }, (response) => {
      if (response.statusCode !== 200) {
        resolve(null);
        return;
      }

      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        // Extract question text from title
        const titleMatch = data.match(/<title>([^•]+)/i);

        // Extract image URL
        const imageMatch = data.match(/https:\/\/web\.testpdr\.com\/storage\/questions\/QNS_\d+\.jpg/);

        let questionText = '';
        if (titleMatch) {
          questionText = titleMatch[1].trim();
        }

        resolve({
          id: ticketId,
          text: questionText,
          imageUrl: imageMatch ? imageMatch[0] : null
        });
      });
    }).on('error', () => {
      resolve(null);
    });
  });
}

// Find matching official ticket for our question (improved algorithm)
function findMatchingTicket(question, officialQuestions) {
  const normalizedOurText = normalizeText(question.text);
  const deepNormalizedOur = deepNormalizeText(question.text);
  let bestMatch = null;
  let bestScore = 0;
  let bestMethod = '';

  for (const official of officialQuestions) {
    if (!official || !official.text || !official.imageUrl) continue;

    const normalizedOfficialText = normalizeText(official.text);
    const deepNormalizedOfficial = deepNormalizeText(official.text);

    // Strategy 1: Exact match on first N characters
    const compareLength = 50;
    const ourStart = normalizedOurText.substring(0, compareLength);
    const officialStart = normalizedOfficialText.substring(0, compareLength);
    if (ourStart === officialStart) {
      return { match: official, score: 1.0, method: 'exact_start' };
    }

    // Strategy 2: Deep normalized exact match
    const deepOurStart = deepNormalizedOur.substring(0, compareLength);
    const deepOfficialStart = deepNormalizedOfficial.substring(0, compareLength);
    if (deepOurStart === deepOfficialStart) {
      return { match: official, score: 0.98, method: 'deep_exact' };
    }

    // Strategy 3: One contains the other
    if (normalizedOurText.includes(normalizedOfficialText) ||
        normalizedOfficialText.includes(normalizedOurText)) {
      return { match: official, score: 0.95, method: 'contains' };
    }

    // Strategy 4: Deep normalized contains
    if (deepNormalizedOur.includes(deepNormalizedOfficial) ||
        deepNormalizedOfficial.includes(deepNormalizedOur)) {
      return { match: official, score: 0.93, method: 'deep_contains' };
    }

    // Strategy 5: Levenshtein similarity on regular normalized
    const simScore = similarity(
      normalizedOurText.substring(0, 70),
      normalizedOfficialText.substring(0, 70)
    );

    // Strategy 6: Levenshtein on deep normalized
    const deepSimScore = similarity(
      deepNormalizedOur.substring(0, 70),
      deepNormalizedOfficial.substring(0, 70)
    );

    // Strategy 7: Keyword overlap
    const kwOverlap = keywordOverlap(question.text, official.text);

    // Take best similarity score
    const bestSim = Math.max(simScore, deepSimScore);

    // Combined score (weighted)
    const combinedScore = bestSim * 0.55 + kwOverlap * 0.45;

    if (combinedScore > bestScore) {
      bestScore = combinedScore;
      bestMatch = official;
      bestMethod = deepSimScore > simScore ? 'deep_fuzzy' : 'fuzzy';
    }
  }

  // Lower threshold for accepting a match (was 0.75, now 0.65)
  if (bestScore >= 0.65) {
    return { match: bestMatch, score: bestScore, method: bestMethod };
  }

  return null;
}

// Scan official site for questions (in batches)
async function scanOfficialSite(startId, endId, batchSize = 10) {
  const results = [];

  for (let i = startId; i <= endId; i += batchSize) {
    const batch = [];
    for (let j = i; j < Math.min(i + batchSize, endId + 1); j++) {
      batch.push(fetchTicket(j));
    }

    const batchResults = await Promise.all(batch);
    results.push(...batchResults.filter(r => r && r.text));

    const progress = ((i - startId) / (endId - startId) * 100).toFixed(1);
    process.stdout.write(`\rScanning: ${progress}% (${results.length} questions found)`);

    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n');
  return results;
}

async function main() {
  console.log(`Found ${questionsWithImages.length} questions with images\n`);

  // Check which questions already have mappings
  const questionsNeedingMapping = questionsWithImages.filter(q => {
    const imageId = q.image.match(/q(\w+)\./)?.[1];
    return imageId && !mapping[imageId];
  });

  console.log(`${questionsNeedingMapping.length} questions need mapping\n`);

  if (questionsNeedingMapping.length === 0) {
    console.log('All questions already mapped!');
    return;
  }

  // Scan official site (range: 3800 to 6500 where most questions are)
  console.log('Scanning official site for questions (range 3800-6500)...');
  const officialQuestions = await scanOfficialSite(3800, 6500, 10);

  console.log(`Found ${officialQuestions.length} official questions\n`);

  // Find matches
  let matched = 0;
  let notMatched = 0;
  const unmatchedQuestions = [];

  for (const question of questionsNeedingMapping) {
    const imageId = question.image.match(/q(\w+)\./)?.[1];
    if (!imageId) continue;

    const result = findMatchingTicket(question, officialQuestions);

    if (result && result.match.imageUrl) {
      mapping[imageId] = {
        officialId: result.match.id,
        imageUrl: result.match.imageUrl,
        questionText: question.text.substring(0, 50) + '...',
        score: result.score,
        method: result.method
      };
      matched++;
      console.log(`✓ [${result.method}:${result.score.toFixed(2)}] q${imageId} -> ticket/${result.match.id}`);
    } else {
      notMatched++;
      unmatchedQuestions.push({ imageId, text: question.text });
      console.log(`✗ Not matched: q${imageId} - "${question.text.substring(0, 40)}..."`);
    }
  }

  // Save mapping
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));

  // Save unmatched for manual review
  const unmatchedPath = path.join(__dirname, 'unmatched-questions.json');
  fs.writeFileSync(unmatchedPath, JSON.stringify(unmatchedQuestions, null, 2));

  console.log(`\nDone! Matched: ${matched}, Not matched: ${notMatched}`);
  console.log(`Mapping saved to: ${mappingPath}`);
  console.log(`Unmatched saved to: ${unmatchedPath}`);
}

main().catch(console.error);
