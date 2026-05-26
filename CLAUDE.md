# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ukrainian traffic rules (ПДР) testing application for exam preparation at ГСЦ МВС (traffic safety centers). Built with Next.js 16, React 19, and Tailwind CSS 4.

## Commands

```bash
npm run dev      # Development server at localhost:3000
npm run build    # Production build
npm start        # Start production server
npm run lint     # ESLint check
```

**Image management:**
```bash
node scripts/download-images.js  # Download question images from sources
```

## Architecture

### Test Modes
- **Exam** (`/exam`) - 20 random questions, 20-minute timer, max 2 errors allowed
- **Learn** (`/learn`) - Questions by category with explanations, no time limit
- **Practice** (`/practice`) - Random questions without timer or error limits

### Data Flow
1. Questions stored in `src/data/questions.json` (326 questions with images)
2. Pages load questions and use `getRandomQuestions()` or `getQuestionsByCategory()` from `src/lib/utils.ts`
3. Results stored in `localStorage` and displayed on `/results`

### Key Types (`src/lib/types.ts`)
- `Question` - id, text, image?, answers[], correctAnswerId, explanation?, category?
- `UserAnswer` - questionId, answerId, isCorrect
- `TestResult` - test summary with pass/fail status

### Components
- `QuestionCard` - Displays question text and optional image
- `AnswerOption` - Single answer button with correct/incorrect states
- `Timer` - Countdown timer for exam mode
- `ProgressBar` - Question progress indicator

### Image Sources
Images are downloaded from vodiy.ua and pdrtest.com via `scripts/download-images.js`. New images should be added to the IMAGES array in that script, then run the download command.

## Important Notes

- All UI text is in Ukrainian
- Update question counter in `src/app/page.tsx` when adding new questions
- Check for duplicate questions after adding new ones (same text but different images are valid - different traffic situations)

## WIP: Заміна картинок з водяними знаками

**Проблема:** Картинки з vodiy.ua мають водяний знак "vodiy.ua".

**Рішення:** Замінити на офіційні картинки з pdr.infotech.gov.ua (без водяних знаків).

**Офіційне джерело:** `https://web.testpdr.com/storage/questions/QNS_[ID].jpg`

**Поточний стан:**
- `scripts/image-mapping.json` — знайдено **95 з 210** відповідностей (45%, замінено на офіційні)
- `scripts/unmatched-questions.json` — 115 питань без відповідностей
- Всі замінені картинки мають формат .jpg

**Скрипти:**
- `scripts/find-official-ids.js` — пошук відповідностей (fuzzy matching + Levenshtein + deep normalization)
- `scripts/download-official-images.js` — завантаження офіційних картинок
- `scripts/update-extensions.js` — оновлення розширень в questions.json

**Що залишилось:**
1. 115 питань не знайдено на офіційному сайті (різне формулювання або унікальні питання)
2. Сайт pdr.infotech.gov.ua має rate limiting — повторний запуск може знайти більше
3. Деякі картинки можуть бути дорожніми знаками без аналогу на офіційному сайті
