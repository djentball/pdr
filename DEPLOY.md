# Налаштування БД і авторизації

## Крок 1. Отримати DATABASE_URL з Neon

1. Відкрийте https://console.neon.tech
2. Виберіть проєкт, у якому ваш crypto-sandbox
3. У навігації — **Connection Details** → копіюйте **Connection string** (вигляду `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require`)

## Крок 2. Створити `.env.local` локально

У корені проєкту створіть файл `.env.local`:

```
DATABASE_URL=postgresql://...ваш_connection_string...
AUTH_SECRET=<згенерувати, дивись нижче>
```

Згенерувати `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

Скопіюйте результат у `.env.local`. **Не комітьте `.env.local`** — він уже в `.gitignore`.

## Крок 3. Запустити міграцію

```bash
cd ~/Documents/pdr
node scripts/migrate.mjs
```

Має вивести:

```
Запускаю 6 SQL-стейтментів...
→ CREATE TABLE IF NOT EXISTS pdr_users...
→ CREATE TABLE IF NOT EXISTS pdr_answer_history...
→ ...
✓ Міграцію завершено
```

Таблиці `pdr_users`, `pdr_answer_history`, `pdr_progress`, `pdr_bookmarks` зʼявляться у вашій базі.

## Крок 4. Локальний тест

```bash
npm run dev
```

Відкрити http://localhost:3000 — має перенаправити на `/login`. Створіть акаунт через `/signup`, увійдіть, спробуйте пройти кілька питань — перевірте що зʼявилися картки «Робота над помилками» / «Закладки» / «Продовжити» на головній після того як зробили щось.

## Крок 5. Додати ENV у Vercel

1. Відкрийте свій проєкт у Vercel-дашборді
2. **Settings** → **Environment Variables**
3. Додайте:
   - `DATABASE_URL` = той самий connection string
   - `AUTH_SECRET` = той самий секрет
4. Виберіть `Production`, `Preview`, `Development` (всі три)
5. Збережіть

## Крок 6. Запушити і дочекатися деплою

```bash
git add .
git commit -m "Add auth and DB-backed progress, mistakes, bookmarks"
git push
```

Vercel автоматично перебілдить. Якщо щось упаде — пришліть лог.

## Що тепер працює

- `/login`, `/signup` — створення акаунту, вхід
- Всі інші сторінки потребують логіну (middleware редиректить на `/login`)
- При проходженні питань в `/learn` (а також `/mistakes`, `/bookmarks`):
  - Кожна відповідь записується в `pdr_answer_history`
  - Прогрес в режимі «Всі питання попідряд» зберігається автоматично
  - Зірочка справа зверху дозволяє додавати/прибирати закладку
- На головній зʼявляються особисті картки:
  - **Робота над помилками** — питання з останньою неправильною відповіддю
  - **Закладки** — все що ви відмітили
  - **Продовжити** — повертає у точку де зупинилися
