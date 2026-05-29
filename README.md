# Тести ПДР України 2026

Веб-додаток для підготовки до теоретичного іспиту в ГСЦ МВС на категорію B. Повна база — **1715 офіційних питань** із актуальної редакції ПДР 2026 з картинками, варіантами відповідей і поясненнями.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Neon Postgres](https://img.shields.io/badge/Neon-Postgres-00e699?logo=postgresql)](https://neon.tech)

## Можливості

- **Іспит** — 20 випадкових питань, таймер 20 хвилин, до 2 помилок (як у реальному ГСЦ)
- **Навчання** — питання за темами або всі попідряд / випадково, з поясненнями після відповіді
- **Практика** — без таймера й без обмежень
- **Робота над помилками** — питання, на яких ви востаннє помилилися
- **Закладки** — позначайте складні питання й переглядайте окремо
- **Збереження прогресу** — продовжуйте з того питання, де зупинилися, навіть на іншому пристрої
- **Email + пароль авторизація** — особиста статистика, синхронізація між пристроями

## Технології

- **Next.js 16** (App Router) + **React 19** + **Tailwind CSS 4**
- **Neon Postgres** (serverless) для зберігання користувачів, прогресу, закладок, історії відповідей
- **JWT** у HttpOnly cookie (бібліотека `jose`)
- **bcryptjs** для хешування паролів
- TypeScript 5

## База питань

Питання витягнуто з офіційного DOCX від ГСЦ МВС (категорія B):

- Розділи 1–39 (універсальні) + розділ B (додаткові)
- Сумарно **1715** питань з 41 категорії
- 60% мають ілюстрації (знаки, схеми перехресть, ситуації на дорозі)
- Правильні відповіді й пояснення згенеровано AI-агентами на основі знання ПДР (паралельно 12 агентів), потім вручну виправляються через режим «робота над помилками»

## Локальний запуск

### 1. Залежності

```bash
npm install
```

### 2. Базу даних

Потрібен [Neon Postgres](https://neon.tech) (free tier OK). Створіть проект і скопіюйте Connection string.

Створіть `.env.local`:

```bash
DATABASE_URL=postgresql://...ваш_рядок...
AUTH_SECRET=$(openssl rand -base64 32)
```

Запустіть міграції:

```bash
node scripts/migrate.mjs                       # users, history, progress, bookmarks
node scripts/migrate_progress_counters.mjs     # correct/wrong counters
```

### 3. Dev server

```bash
npm run dev
```

Відкрийте [http://localhost:3000](http://localhost:3000).

## Деплой на Vercel

Деталі — у [DEPLOY.md](./DEPLOY.md). Коротко: підключити GitHub-репо, додати `DATABASE_URL` і `AUTH_SECRET` у Environment Variables, запушити. Vercel автоматично перебілдить на кожен push.

## Структура проєкту

```
src/
  app/
    api/              # API роути (auth, answers, mistakes, progress, bookmarks)
    learn/            # режим навчання
    exam/             # режим іспиту
    practice/         # режим практики
    mistakes/         # робота над помилками
    bookmarks/        # закладки
    login/, signup/   # авторизація
    page.tsx          # головна
  components/
    QuestionRunner    # єдиний компонент проходження питань
    QuestionCard      # картка питання
    AnswerOption      # варіант відповіді
    ProgressBar       # прогрес з лічильниками ✓/✗
    BookmarkButton    # зірочка
    AuthForm          # форма входу/реєстрації
    Timer             # таймер іспиту
  data/questions.json # 1715 питань
  lib/
    auth.ts           # bcrypt + JWT + сесії
    db.ts             # Neon client
    utils.ts          # хелпери
public/images/        # ілюстрації до питань
scripts/              # міграції БД
files/                # (gitignored) оригінальні PDF/DOCX від ГСЦ МВС
```

## Скрипти

```bash
npm run dev      # запуск dev-сервера
npm run build    # production build
npm start        # production server
npm run lint     # ESLint
```

## Як виправити неправильну відповідь у базі

База створена напівавтоматично — десь є помилки. Якщо натрапили:

1. Натисніть зірочку біля питання (закладка) — щоб потім швидко знайти
2. Або просто запам'ятайте id питання
3. Відкрийте `src/data/questions.json`, знайдіть питання за id, виправте `correctAnswerId` або `explanation`
4. Закомітьте і запуште

## Ліцензія

Питання — з відкритого офіційного банку ГСЦ МВС України. Код — використовуйте на свій розсуд.
