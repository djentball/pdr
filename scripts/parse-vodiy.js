const cheerio = require('cheerio');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://vodiy.ua';
const QUESTIONS_URL = `${BASE_URL}/pdr/test/`;
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images');
const JSON_OUTPUT = path.join(__dirname, '..', 'src', 'data', 'questions.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8',
      }
    });
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

async function downloadImage(imageUrl, filename) {
  try {
    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`;
    const response = await fetch(fullUrl);
    if (!response.ok) {
      console.error(`Failed to download image: ${fullUrl}`);
      return null;
    }
    const buffer = await response.buffer();
    const outputPath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(outputPath, buffer);
    console.log(`Downloaded: ${filename}`);
    return `/images/${filename}`;
  } catch (error) {
    console.error(`Error downloading image ${imageUrl}:`, error.message);
    return null;
  }
}

async function parseQuestionsFromPage(html, theme) {
  const $ = cheerio.load(html);
  const questions = [];

  // Find all question containers
  $('li').each((index, element) => {
    const $el = $(element);

    // Get question title and number
    const titleText = $el.find('h5, .title_ticket').first().text().trim();
    const questionMatch = titleText.match(/Питання\s*[№#]?\s*(\d+)/i);
    if (!questionMatch) return;

    const questionId = parseInt(questionMatch[1]);

    // Get question text
    const questionText = $el.find('p').first().text().trim() ||
                         $el.find('.question_text').first().text().trim();
    if (!questionText || questionText.length < 5) return;

    // Get image URL
    const imgSrc = $el.find('img').first().attr('src');

    // Get answers
    const answers = [];
    $el.find('input[type="radio"], .reply_ticket li, .ticketpage_ul li').each((i, ansEl) => {
      const ansText = $(ansEl).text().trim().replace(/^\d+[\.\)]\s*/, '');
      if (ansText && ansText.length > 1) {
        answers.push({
          id: answers.length + 1,
          text: ansText
        });
      }
    });

    // Get correct answer (usually marked with class or data attribute)
    let correctAnswerId = 1;
    const correctEl = $el.find('.correct, .right, [data-correct="true"]');
    if (correctEl.length) {
      const correctText = correctEl.text().trim();
      const foundIndex = answers.findIndex(a => a.text === correctText);
      if (foundIndex >= 0) correctAnswerId = foundIndex + 1;
    }

    // Get explanation
    const explanation = $el.find('.explanation, .pdr_help, p:last-child').last().text().trim();

    if (answers.length >= 2) {
      questions.push({
        id: questionId,
        text: questionText,
        image: imgSrc || null,
        answers,
        correctAnswerId,
        explanation: explanation || null,
        category: theme
      });
    }
  });

  return questions;
}

async function scrapeTheme(themeId, themeName) {
  console.log(`\nScraping theme ${themeId}: ${themeName}`);
  const url = `${QUESTIONS_URL}?complect=6&theme=${themeId}`;
  const html = await fetchPage(url);
  if (!html) return [];

  const questions = await parseQuestionsFromPage(html, themeName);
  console.log(`Found ${questions.length} questions in theme ${themeId}`);

  return questions;
}

async function scrapeBilet(biletId) {
  console.log(`Scraping bilet ${biletId}`);
  const url = `${QUESTIONS_URL}?complect=6&bilet=${biletId}`;
  const html = await fetchPage(url);
  if (!html) return [];

  return await parseQuestionsFromPage(html, `Білет ${biletId}`);
}

// Main themes for category B
const THEMES = [
  { id: 1, name: 'Загальні положення' },
  { id: 2, name: 'Обов\'язки і права водіїв' },
  { id: 3, name: 'Рух ТЗ зі спеціальними сигналами' },
  { id: 4, name: 'Обов\'язки і права пішоходів' },
  { id: 5, name: 'Обов\'язки і права пасажирів' },
  { id: 6, name: 'Вимоги до велосипедистів' },
  { id: 7, name: 'Вимоги до гужового транспорту' },
  { id: 8, name: 'Регулювання дорожного руху' },
  { id: 9, name: 'Попереджувальні сигнали' },
  { id: 10, name: 'Початок руху та зміна напрямку' },
  { id: 11, name: 'Розташування ТЗ на дорозі' },
  { id: 12, name: 'Швидкість руху' },
  { id: 13, name: 'Дистанція, інтервал, зустрічний роз\'їзд' },
  { id: 14, name: 'Обгін' },
  { id: 15, name: 'Зупинка і стоянка' },
  { id: 16, name: 'Проїзд перехресть' },
  { id: 17, name: 'Переваги маршрутних ТЗ' },
  { id: 18, name: 'Проїзд пішохідних переходів' },
  { id: 19, name: 'Користування зовнішніми світловими приладами' },
  { id: 20, name: 'Рух через залізничні переїзди' },
  { id: 21, name: 'Перевезення пасажирів' },
  { id: 22, name: 'Перевезення вантажу' },
  { id: 23, name: 'Буксирування та експлуатація ТЗ' },
  { id: 24, name: 'Навчальна їзда' },
  { id: 25, name: 'Рух в житлових і пішохідних зонах' },
  { id: 26, name: 'Рух автомагістралями і дорогами для автомобілів' },
  { id: 27, name: 'Рух гірськими дорогами' },
  { id: 28, name: 'Міжнародний рух' },
  { id: 145, name: 'Додаткові питання категорій В1, В' }
];

async function main() {
  console.log('Starting to scrape vodiy.ua...');
  console.log(`Output: ${JSON_OUTPUT}`);
  console.log(`Images: ${OUTPUT_DIR}\n`);

  let allQuestions = [];
  const seenIds = new Set();

  // Scrape by themes
  for (const theme of THEMES) {
    await delay(1000); // Be nice to the server
    const questions = await scrapeTheme(theme.id, theme.name);

    for (const q of questions) {
      if (!seenIds.has(q.id)) {
        seenIds.add(q.id);
        allQuestions.push(q);
      }
    }
  }

  // Also try some bilets for variety
  for (let bilet = 1; bilet <= 10; bilet++) {
    await delay(1000);
    const questions = await scrapeBilet(bilet);
    for (const q of questions) {
      if (!seenIds.has(q.id)) {
        seenIds.add(q.id);
        allQuestions.push(q);
      }
    }
  }

  console.log(`\nTotal unique questions collected: ${allQuestions.length}`);

  // Download images
  console.log('\nDownloading images...');
  let imageCount = 0;
  for (const q of allQuestions) {
    if (q.image) {
      const ext = path.extname(q.image) || '.jpg';
      const filename = `q${q.id}${ext}`;
      const localPath = await downloadImage(q.image, filename);
      if (localPath) {
        q.image = localPath;
        imageCount++;
      } else {
        q.image = null;
      }
      await delay(200);
    }
  }
  console.log(`Downloaded ${imageCount} images`);

  // Renumber questions
  allQuestions = allQuestions.map((q, index) => ({
    ...q,
    id: index + 1
  }));

  // Save JSON
  fs.writeFileSync(JSON_OUTPUT, JSON.stringify(allQuestions, null, 2), 'utf8');
  console.log(`\nSaved ${allQuestions.length} questions to ${JSON_OUTPUT}`);
}

main().catch(console.error);
