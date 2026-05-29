# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ukrainian traffic rules (ПДР) testing application for exam preparation at ГСЦ МВС (traffic safety centers), category B (passenger car). Built with Next.js 16, React 19, Tailwind CSS 4, with Neon Postgres for user data (auth, progress, mistakes, bookmarks).

## Commands

```bash
npm run dev      # Development server at localhost:3000
npm run build    # Production build
npm start        # Start production server
npm run lint     # ESLint check
```

**Database migrations** (Neon Postgres):
```bash
node scripts/migrate.mjs                       # initial schema (users, history, progress, bookmarks)
node scripts/migrate_progress_counters.mjs     # adds correct_count, wrong_count to pdr_progress
```

## Architecture

### Test Modes
- **Exam** (`/exam`) - 20 random questions, 20-minute timer, max 2 errors allowed
- **Learn** (`/learn`) - Questions by category, all-sequential, all-shuffled. With explanations after each answer, bookmarks, resumable progress
- **Practice** (`/practice`) - Random questions without timer or error limits
- **Mistakes** (`/mistakes`) - Questions where last answer was wrong
- **Bookmarks** (`/bookmarks`) - User-flagged questions

### Auth
Simple email + bcrypt password, JWT in HttpOnly cookie (30 days). Middleware redirects unauthenticated requests to `/login` (auth API routes are public).

### Data Flow
1. Questions stored in `src/data/questions.json` (~1715 questions for category B, from official ГСЦ МВС exam bank)
2. Pages load questions and use helpers from `src/lib/utils.ts`
3. User actions (answers, progress, bookmarks) persist in Neon via API routes under `src/app/api/`

### Key Types (`src/lib/types.ts`)
- `Question` - id, text, image?, answers[], correctAnswerId, explanation?, category?
- `Answer` - id, text
- `UserAnswer` - questionId, answerId, isCorrect

### Components
- `QuestionRunner` - Unified runner for /learn, /mistakes, /bookmarks (handles state, bookmarks, progress save, restart)
- `QuestionCard` - Displays question text and optional image
- `AnswerOption` - Single answer button with correct/incorrect states
- `Timer` - Countdown timer for exam mode
- `ProgressBar` - Question progress indicator
- `BookmarkButton` - Star toggle
- `AuthForm` - Login/signup form
- `LogoutButton` - Header logout

### API Routes
- `POST /api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `GET /api/auth/me`
- `POST /api/answers` - record answer attempt
- `GET /api/mistakes` - last-wrong question ids
- `GET/PUT /api/progress` - save/restore current index + correct/wrong counts per mode
- `GET/POST/DELETE /api/bookmarks`

### Source Material
`files/` (gitignored) contains the official ГСЦ МВС sources:
- `questions.docx` - 1715 cat-B questions with embedded images
- `questions.pdf`, `answers.pdf` - PDF originals

To re-extract questions from source, use scripts in the project root (or `scripts/`) tailored for the docx structure.

## Important Notes

- All UI text is in Ukrainian
- Question counter on homepage is computed dynamically from `questions.json.length`
- Images live in `public/images/imageN.jpeg` and `imageN.png`
- Bookmark `category: B` only — additional sections (А, C, D, T) were filtered out during import
