/**
 * scrape-pdrtest.mjs
 *
 * Скрапить усі питання категорії B з pdrtest.com.
 *
 * Виносить у `scripts/pdrtest-scraped.json`:
 *   [{ id: "1.1", text, options: ["...","..."], correctText: "..." }, ...]
 *
 * Запуск:
 *   node scripts/scrape-pdrtest.mjs               # всі секції
 *   node scripts/scrape-pdrtest.mjs --topic=1     # тільки секція 1
 *   node scripts/scrape-pdrtest.mjs --resume      # продовжити
 *   node scripts/scrape-pdrtest.mjs --max=20      # перші N питань (для тесту)
 *   node scripts/scrape-pdrtest.mjs --delay=600   # мс між запитами
 *   node scripts/scrape-pdrtest.mjs --debug       # зберегти HTML для перевірки
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(__dirname, 'pdrtest-scraped.json');
const DEBUG_DIR = join(__dirname, 'pdrtest-debug');

const args = process.argv.slice(2);
const RESUME = args.includes('--resume');
const DEBUG = args.includes('--debug');
const TOPIC_FILTER = args.find((a) => a.startsWith('--topic='))?.split('=')[1];
const MAX = Number(args.find((a) => a.startsWith('--max='))?.split('=')[1] ?? Infinity);
const DELAY_MS = Number(args.find((a) => a.startsWith('--delay='))?.split('=')[1] ?? 600);

const TOPIC_PATTERNS = [
  { topic: 1, sub: null, maxQ: 100 },
  { topic: 2, sub: null, maxQ: 60 },
  { topic: 3, sub: null, maxQ: 30 },
  { topic: 4, sub: null, maxQ: 40 },
  { topic: 5, sub: null, maxQ: 30 },
  { topic: 6, sub: null, maxQ: 30 },
  { topic: 7, sub: null, maxQ: 10 },
  { topic: 8, sub: 1, maxQ: 100 },
  { topic: 8, sub: 2, maxQ: 70 },
  { topic: 9, sub: null, maxQ: 80 },
  { topic: 10, sub: null, maxQ: 100 },
  { topic: 11, sub: null, maxQ: 60 },
  { topic: 12, sub: null, maxQ: 60 },
  { topic: 13, sub: null, maxQ: 80 },
  { topic: 14, sub: null, maxQ: 80 },
  { topic: 15, sub: null, maxQ: 120 },
  { topic: 16, sub: 1, maxQ: 50 },
  { topic: 16, sub: 2, maxQ: 120 },
  { topic: 17, sub: null, maxQ: 20 },
  { topic: 18, sub: null, maxQ: 25 },
  { topic: 19, sub: null, maxQ: 40 },
  { topic: 20, sub: null, maxQ: 40 },
  { topic: 21, sub: null, maxQ: 20 },
  { topic: 22, sub: null, maxQ: 15 },
  { topic: 23, sub: null, maxQ: 30 },
  { topic: 24, sub: null, maxQ: 20 },
  { topic: 25, sub: null, maxQ: 15 },
  { topic: 26, sub: null, maxQ: 20 },
  { topic: 27, sub: null, maxQ: 20 },
  { topic: 28, sub: null, maxQ: 15 },
  { topic: 29, sub: null, maxQ: 5 },
  { topic: 30, sub: null, maxQ: 20 },
  { topic: 31, sub: null, maxQ: 25 },
  { topic: 32, sub: null, maxQ: 10 },
  { topic: 33, sub: null, maxQ: 400 },
  { topic: 34, sub: null, maxQ: 50 },
  { topic: 35, sub: null, maxQ: 200 },
  { topic: 36, sub: null, maxQ: 15 },
  { topic: 37, sub: null, maxQ: 70 },
  { topic: 38, sub: null, maxQ: 20 },
  { topic: 39, sub: null, maxQ: 10 },
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildId(topic, sub, num) {
  return sub ? `${topic}.${sub}.${num}` : `${topic}.${num}`;
}

async function fetchQuestion(id) {
  const url = `https://pdrtest.com/question/${id}`;
  const res = await fetch(url, { headers: HEADERS });
  if (res.status === 404 || res.status === 410) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return await res.text();
}

/**
 * Очищає HTML від тегів і дає чистий текст.
 */
function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Парсить сторінку pdrtest.com через регекс по чистому тексту.
 * Структура: "1.1. <питання>?  <опц1>.<опц2>.<опц3>"
 *           десь нижче: 'правильна відповідь - "<текст>"'
 */
function parseQuestionHtml(html, id) {
  if (DEBUG) {
    mkdirSync(DEBUG_DIR, { recursive: true });
    writeFileSync(join(DEBUG_DIR, `${id}.html`), html, 'utf-8');
  }

  // 1. Витягую текст питання з <h3> через регекс по сирому HTML.
  //    pdrtest використовує: <h3 ...>1.1. <текст>...</h3>
  let questionText = '';
  const h3Regex = new RegExp(`<h3[^>]*>\\s*${id.replace(/\./g, '\\.')}\\.\\s*([\\s\\S]*?)</h3>`, 'i');
  const h3Match = html.match(h3Regex);
  if (h3Match) {
    questionText = stripHtml(h3Match[1]);
  } else {
    // fallback: пошук "ID. " в title або в тексті
    const titleRegex = new RegExp(`${id.replace(/\./g, '\\.')}\\.\\s*([^?]+\\?|[^.]+\\.)`, '');
    const tm = html.match(titleRegex);
    if (tm) questionText = stripHtml(tm[1]);
  }
  if (!questionText) return null;

  // 2. Витягую правильну відповідь з тексту "правильна відповідь - "..."".
  //    Зустрічаються варіанти: "Тобто, правильна відповідь -", "Отже, вірна відповідь -" etc.
  let correctText = null;
  const plainText = stripHtml(html);
  const patterns = [
    /правильна відповідь\s*[-—:]\s*["«]([^"»]+)["»]/i,
    /вірна відповідь\s*[-—:]\s*["«]([^"»]+)["»]/i,
    /правильна\s+відповідь\s*[-—:]?\s*&quot;([^&]+)&quot;/i,
  ];
  for (const re of patterns) {
    const m = plainText.match(re);
    if (m) {
      correctText = m[1].trim().replace(/\.$/, '').replace(/^["«]+|["»]+$/g, '').trim();
      // Додаю крапку назад якщо вона є у відповіді з оригіналу
      if (!correctText.endsWith('.') && !correctText.endsWith('?')) correctText += '.';
      break;
    }
  }

  // 3. Опції — намагаюся витягнути з description meta або з h3-наступного блоку.
  let options = [];
  const descMatch = html.match(/<meta name="description" content="([^"]+)"/i);
  if (descMatch) {
    // description часто має формат "Опц1. Опц2. Опц3." на початку
    const desc = descMatch[1];
    // Beremu першу частину до "На зображенні" або інших стандартних слів
    const optsRaw = desc.split(/(?:На зображенні|У ПДР|Коли в питанні|За визначенням)/)[0];
    options = optsRaw
      .split(/(?<=[.!?])\s+(?=[А-ЯІЇЄҐ«"])/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 300 && !s.includes('ПДР'));
  }

  return { id, text: questionText, options, correctText };
}

async function main() {
  let existing = [];
  let seenIds = new Set();
  if (RESUME && existsSync(OUT_FILE)) {
    existing = JSON.parse(readFileSync(OUT_FILE, 'utf-8'));
    seenIds = new Set(existing.map((q) => q.id));
    console.log(`Resume: ${existing.length} вже скрапнуто`);
  }

  const results = existing;
  let stats = { fetched: 0, missing: 0, parseFailed: 0, skipped: existing.length };
  let scrapedThisRun = 0;

  outer: for (const pat of TOPIC_PATTERNS) {
    if (TOPIC_FILTER && String(pat.topic) !== TOPIC_FILTER) continue;

    let consecutive404 = 0;
    for (let num = 1; num <= pat.maxQ; num++) {
      if (scrapedThisRun >= MAX) {
        console.log(`Досягнуто --max=${MAX}, виходимо.`);
        break outer;
      }
      const id = buildId(pat.topic, pat.sub, num);
      if (seenIds.has(id)) continue;

      try {
        const html = await fetchQuestion(id);
        if (html === null) {
          consecutive404++;
          stats.missing++;
          if (consecutive404 >= 5) {
            console.log(`  [${id}] 5 404 поспіль — завершую секцію ${pat.topic}${pat.sub ? '.' + pat.sub : ''}`);
            break;
          }
          continue;
        }
        consecutive404 = 0;
        const parsed = parseQuestionHtml(html, id);
        if (!parsed || !parsed.text) {
          stats.parseFailed++;
          console.log(`  [${id}] парсинг не вдався (text=${!!parsed?.text})`);
          continue;
        }
        if (!parsed.correctText) {
          // Зберігаю питання навіть без correctText — буде в звіті
          parsed.correctText = null;
        }
        results.push(parsed);
        seenIds.add(id);
        stats.fetched++;
        scrapedThisRun++;
        if (stats.fetched % 10 === 0) {
          console.log(`  [${id}] зібрано ${stats.fetched}, всього ${results.length}`);
          writeFileSync(OUT_FILE, JSON.stringify(results, null, 1), 'utf-8');
        }
      } catch (e) {
        console.error(`  [${id}] помилка:`, e.message);
      }
      await sleep(DELAY_MS);
    }
  }

  writeFileSync(OUT_FILE, JSON.stringify(results, null, 1), 'utf-8');
  console.log('\n=== ПІДСУМОК ===');
  console.log(`Скрапнуто за цей прогон: ${stats.fetched}`);
  console.log(`Пропущено (вже були):    ${stats.skipped}`);
  console.log(`Не знайдено (404):       ${stats.missing}`);
  console.log(`Помилки парсингу:        ${stats.parseFailed}`);
  console.log(`Усього в pdrtest-scraped.json: ${results.length}`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
