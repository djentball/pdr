// Міграція для mock-exam таблиці. Запуск: `node scripts/migrate_mock_exam.mjs`

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
const raw = readFileSync(join(__dirname, 'migrate_mock_exam.sql'), 'utf-8');
const migration = raw
  .split('\n')
  .filter((l) => !l.trim().startsWith('--'))
  .join('\n');

const statements = migration
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(`Запускаю ${statements.length} SQL-стейтментів для mock-exam...`);
for (const stmt of statements) {
  console.log(`→ ${stmt.replace(/\s+/g, ' ').slice(0, 100)}...`);
  try {
    await sql.query(stmt);
    console.log('   ✓ OK');
  } catch (e) {
    console.error('   ✗ ERROR:', e.message);
    process.exit(1);
  }
}

// Перевірка що таблиця реально створилась
const check = await sql`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'pdr_mock_exam_attempts'
  ORDER BY ordinal_position
`;
console.log('\n=== Колонки pdr_mock_exam_attempts ===');
if (check.length === 0) {
  console.log('⚠️  Таблиця НЕ створилась!');
  process.exit(1);
} else {
  for (const col of check) console.log(`  ${col.column_name.padEnd(20)} ${col.data_type}`);
}
console.log('\n✓ Міграцію mock-exam завершено');
