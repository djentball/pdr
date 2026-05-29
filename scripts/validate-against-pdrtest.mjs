/**
 * validate-against-pdrtest.mjs
 *
 * Зіставляє локальну questions.json з результатами scrape-pdrtest.mjs
 * і генерує звіт розбіжностей (питання де наш correctAnswerId не співпадає
 * з офіційним з pdrtest.com).
 *
 * Запуск (після `node scripts/scrape-pdrtest.mjs`):
 *   node scripts/validate-against-pdrtest.mjs
 *
 * Вивід: `scripts/validation-report.md`
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRAPED_FILE = join(__dirname, 'pdrtest-scraped.json');
const QUESTIONS_FILE = join(__dirname, '..', 'src', 'data', 'questions.json');
const REPORT_FILE = join(__dirname, 'validation-report.md');

// Нормалізація тексту для матчингу
function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[«»""'']/g, '"')
    .replace(/[ʼ']/g, "'")
    .replace(/ё/g, 'е')
    .replace(/[.,:;!?()\-—–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Простий fuzzy: рахуємо скільки слів зі скрапнутого є в локальному тексті
function similarity(a, b) {
  const wa = new Set(normalize(a).split(' ').filter((w) => w.length > 2));
  const wb = new Set(normalize(b).split(' ').filter((w) => w.length > 2));
  if (wa.size === 0 || wb.size === 0) return 0;
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  return inter / Math.max(wa.size, wb.size);
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function main() {
  const scraped = loadJson(SCRAPED_FILE);
  const local = loadJson(QUESTIONS_FILE);

  console.log(`Скрапнуто з pdrtest: ${scraped.length}`);
  console.log(`У локальній БД:      ${local.length}`);

  // Будуємо індекс по нормалізованому тексту
  const scrapedByNorm = new Map();
  for (const s of scraped) {
    scrapedByNorm.set(normalize(s.text), s);
  }

  const mismatches = [];
  const notFound = [];
  const noCorrect = [];
  let matched = 0;
  let agreed = 0;

  for (const lq of local) {
    const normText = normalize(lq.text);
    let s = scrapedByNorm.get(normText);

    // Якщо точного матчу нема — fuzzy через весь scraped
    if (!s) {
      let best = null;
      let bestScore = 0;
      for (const cand of scraped) {
        const score = similarity(lq.text, cand.text);
        if (score > bestScore) {
          bestScore = score;
          best = cand;
        }
      }
      if (bestScore >= 0.7) s = best;
    }

    if (!s) {
      notFound.push({ id: lq.id, text: lq.text });
      continue;
    }
    matched++;

    if (!s.correctText) {
      noCorrect.push({ id: lq.id, scrapedId: s.id, text: lq.text });
      continue;
    }

    // Порівнюємо: знаходимо в локальних відповідях ту, що матчиться зі скрапнутою correctText
    const localCorrect = lq.answers.find((a) => a.id === lq.correctAnswerId);
    if (!localCorrect) continue;

    const localCorrectNorm = normalize(localCorrect.text);
    const scrapedCorrectNorm = normalize(s.correctText);

    if (localCorrectNorm === scrapedCorrectNorm) {
      agreed++;
      continue;
    }

    // Спробуємо fuzzy
    const sim = similarity(localCorrect.text, s.correctText);
    if (sim >= 0.85) {
      agreed++;
      continue;
    }

    // Знаходимо в local.answers ту що збігається з scraped correctText
    let suggestedAnswer = null;
    let bestSim = 0;
    for (const a of lq.answers) {
      const sm = similarity(a.text, s.correctText);
      if (sm > bestSim) {
        bestSim = sm;
        suggestedAnswer = a;
      }
    }

    mismatches.push({
      id: lq.id,
      category: lq.category,
      text: lq.text,
      currentAnswer: localCorrect,
      currentAnswerId: lq.correctAnswerId,
      scrapedCorrectText: s.correctText,
      suggestedAnswer,
      suggestedAnswerId: suggestedAnswer?.id,
      confidence: bestSim,
      scrapedId: s.id,
    });
  }

  // Звіт
  const lines = [];
  lines.push('# Звіт валідації проти pdrtest.com\n');
  lines.push(`**Дата:** ${new Date().toISOString().slice(0, 10)}\n`);
  lines.push(`- Локальних питань: **${local.length}**`);
  lines.push(`- Скрапнуто з pdrtest: **${scraped.length}**`);
  lines.push(`- Знайшли пару (matched): **${matched}**`);
  lines.push(`- Відповіді співпали: **${agreed}**`);
  lines.push(`- **Розбіжностей: ${mismatches.length}**`);
  lines.push(`- Не знайдено в pdrtest: ${notFound.length}`);
  lines.push(`- Pdrtest не дав правильної відповіді: ${noCorrect.length}\n`);

  lines.push('## Розбіжності (відсортовано за confidence)\n');
  mismatches.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));

  for (const m of mismatches) {
    lines.push(`### Q${m.id} — ${m.category}`);
    lines.push(`**Текст:** ${m.text}`);
    lines.push(`**Зараз у БД:** ID ${m.currentAnswerId} — «${m.currentAnswer.text}»`);
    lines.push(`**pdrtest каже:** «${m.scrapedCorrectText}» (білет ${m.scrapedId})`);
    if (m.suggestedAnswer) {
      lines.push(`**Пропозиція:** ID ${m.suggestedAnswerId} — «${m.suggestedAnswer.text}» (confidence ${(m.confidence * 100).toFixed(0)}%)`);
    } else {
      lines.push(`**Пропозиція:** немає матчу серед варіантів — потрібна ручна перевірка`);
    }
    lines.push('');
  }

  if (notFound.length > 0) {
    lines.push('\n## Питання, які не знайдено в pdrtest\n');
    lines.push(`(${notFound.length} штук — імовірно інше формулювання або відсутні в офіційному наборі)\n`);
    for (const nf of notFound.slice(0, 20)) {
      lines.push(`- Q${nf.id}: ${nf.text.slice(0, 100)}`);
    }
    if (notFound.length > 20) lines.push(`- … і ще ${notFound.length - 20}`);
  }

  writeFileSync(REPORT_FILE, lines.join('\n'), 'utf-8');
  console.log(`\n=== ЗВІТ ===`);
  console.log(`Збережено: ${REPORT_FILE}`);
  console.log(`Розбіжностей знайдено: ${mismatches.length}`);
  console.log(`Не знайдено пар: ${notFound.length}`);
}

main();
