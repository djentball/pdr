// Запуск: node scripts/migrate_indexes.mjs

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const env = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const raw = readFileSync(join(__dirname, 'migrate_indexes.sql'), 'utf-8');
const lines = raw.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
const statements = lines.split(';').map((s) => s.trim()).filter((s) => s.length > 0);

console.log(`Запускаю ${statements.length} SQL-стейтментів...`);
for (const stmt of statements) {
  console.log(`→ ${stmt.replace(/\s+/g, ' ').slice(0, 100)}...`);
  try {
    const start = Date.now();
    await sql.query(stmt);
    console.log(`   ✓ OK (${Date.now() - start}ms)`);
  } catch (e) {
    console.error('   ✗ ERROR:', e.message);
    process.exit(1);
  }
}

// Покажи розмір таблиці і скільки рядків — щоб зрозуміти масштаб
const stats = await sql`
  SELECT
    (SELECT COUNT(*)::int FROM pdr_answer_history) AS total_rows,
    (SELECT COUNT(DISTINCT user_id)::int FROM pdr_answer_history) AS users
`;
console.log(`\npdr_answer_history: ${stats[0].total_rows} рядків від ${stats[0].users} користувачів`);
console.log('\n✓ Індекси додано');
