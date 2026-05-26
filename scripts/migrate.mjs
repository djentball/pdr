// Простий скрипт для запуску міграцій. Запуск: `node scripts/migrate.mjs`
// Читає DATABASE_URL з .env.local.

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Завантажуємо .env.local вручну
try {
  const env = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {
  // .env.local може не існувати — тоді DATABASE_URL має бути в системі
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Додайте його у .env.local');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const migrationRaw = readFileSync(join(__dirname, 'migrate.sql'), 'utf-8');

// Видаляємо рядки-коментарі (-- ...) перш ніж розбивати на стейтменти
const migration = migrationRaw
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n');

// Розбиваємо на окремі стейтменти по ;
const statements = migration
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(`Запускаю ${statements.length} SQL-стейтментів...`);

for (const stmt of statements) {
  const preview = stmt.replace(/\s+/g, ' ').slice(0, 80);
  console.log(`→ ${preview}...`);
  await sql.query(stmt);
}

console.log('✓ Міграцію завершено');
