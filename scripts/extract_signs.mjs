/**
 * Витяжка каталогу знаків з questions.json.
 *
 * Знаходить усі питання категорії "Дорожні знаки" що мають картинку
 * і чітке формулювання "знак позначає/інформує/встановлюється".
 * Для кожної унікальної картинки бере correct answer як назву.
 *
 * Запуск: node scripts/extract_signs.mjs
 * Вивід:  src/data/signs.json
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUESTIONS_FILE = join(__dirname, '..', 'src', 'data', 'questions.json');
const OUT_FILE = join(__dirname, '..', 'src', 'data', 'signs.json');

const PATTERNS = [
  /^Зображений дорожній знак/i,
  /^Вказаний дорожній знак/i,
  /^Даний дорожній знак/i,
  /дорожн.+знак позначає/i,
  /дорожн.+знак інформує/i,
  /дорожн.+знак попереджає/i,
  /дорожн.+знак встановлюється/i,
  /дорожн.+знак вимагає/i,
  /дорожн.+знак забороняє/i,
  /дорожн.+знак дозволяє/i,
];

/**
 * @param {string} name
 * @param {string} qText
 * @returns {string} код групи (warning/priority/prohibition/mandatory/info/service)
 */
function classify(name, qText) {
  const n = name.toLowerCase();
  const t = qText.toLowerCase();

  // Сервісні знаки — заклади на маршруті
  if (
    /(аз[сc]|станці[яї]|мийка|готел|ресторан|кемпінг|аерод|аеропорт|паливо|газо|електрозаряд|телефон|лікарн|медичн|харчуван|вокзал|відпочин|кафе|мотел|санвузо|пост.+поліц|аварійн[аиіі]?)/i.test(n)
  ) {
    return 'service';
  }

  // Знаки пріоритету
  if (/(проїзд без зупинки|переваг|дай дорогу|головна дорога)/.test(n)) {
    return 'priority';
  }

  // Заборонні
  if (/(заборон|обмеж)/.test(n) && !/дозвол/i.test(n.slice(0, 50))) {
    return 'prohibition';
  }

  // Наказові
  if (/(рух прямо|рух праворуч|рух ліворуч|обов'язков)/.test(n) && (n.includes('рух') || n.includes('обов'))) {
    return 'mandatory';
  }

  // Попереджувальні
  if (/(попереджа|наближен|небезпечн)/.test(t) || /(наближен|ділянк|небезпечн|попереджа)/.test(n)) {
    return 'warning';
  }

  // Інформаційно-вказівні і таблички
  return 'info';
}

const data = JSON.parse(readFileSync(QUESTIONS_FILE, 'utf-8'));
const seen = new Map();

for (const q of data) {
  if (!q.image) continue;
  if (q.category !== 'Дорожні знаки') continue;
  if (!PATTERNS.some((p) => p.test(q.text))) continue;
  if (seen.has(q.image)) continue;

  const correct = q.answers.find((a) => a.id === q.correctAnswerId);
  if (!correct) continue;
  const name = correct.text.replace(/\.$/, '').trim();
  if (name.length > 250) continue;
  if (/^відповіді/i.test(name)) continue;
  if (/^знак(и)? \d/i.test(name)) continue; // "Знак 1" / "Знаки 1 і 2" — не назва, а вибір з варіантів

  seen.set(q.image, {
    image: q.image,
    name,
    group: classify(name, q.text),
    questionId: q.id,
    explanation: q.explanation || null,
  });
}

const list = Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name, 'uk'));

writeFileSync(OUT_FILE, JSON.stringify(list, null, 2), 'utf-8');

const counts = list.reduce((acc, s) => ({ ...acc, [s.group]: (acc[s.group] || 0) + 1 }), {});
console.log(`Витягнуто ${list.length} знаків:`);
for (const [g, n] of Object.entries(counts)) console.log(`  ${g.padEnd(12)} ${n}`);
console.log(`Збережено у ${OUT_FILE}`);
