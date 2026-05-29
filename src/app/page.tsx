import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/db';
import LogoutButton from '@/components/LogoutButton';
import questionsData from '@/data/questions.json';

const TOTAL_QUESTIONS = questionsData.length;

export const dynamic = 'force-dynamic';

interface ProgressRow {
  mode: string;
  current_index: number;
}

interface CountRow {
  count: string | number;
}

async function loadStats(userId: number) {
  // Кількість питань-помилок (питання, на які ОСТАННЯ відповідь була неправильною)
  const mistakeRows = (await sql`
    WITH last_answers AS (
      SELECT DISTINCT ON (question_id) question_id, is_correct
      FROM pdr_answer_history
      WHERE user_id = ${userId}
      ORDER BY question_id, answered_at DESC
    )
    SELECT COUNT(*)::int AS count FROM last_answers WHERE is_correct = false
  `) as CountRow[];

  const bookmarkRows = (await sql`
    SELECT COUNT(*)::int AS count FROM pdr_bookmarks WHERE user_id = ${userId}
  `) as CountRow[];

  const progressRows = (await sql`
    SELECT mode, current_index FROM pdr_progress
    WHERE user_id = ${userId} AND mode = 'all-sequential'
    LIMIT 1
  `) as ProgressRow[];

  return {
    mistakesCount: Number(mistakeRows[0]?.count ?? 0),
    bookmarksCount: Number(bookmarkRows[0]?.count ?? 0),
    sequentialProgress: progressRows[0]?.current_index ?? 0,
  };
}

export default async function Home() {
  const session = await getSession();
  // Middleware гарантує що тут користувач залогінений
  const stats = session ? await loadStats(session.userId) : null;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-12">
      <div className="max-w-md w-full">
        {/* Хедер з email */}
        {session && (
          <div className="flex items-center justify-between gap-3 mb-6 text-sm">
            <span className="text-gray-600 truncate">{session.email}</span>
            <LogoutButton />
          </div>
        )}

        <div className="text-center mb-6 sm:mb-8">
          <div className="text-5xl sm:text-6xl mb-3">🚗</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">Тести ПДР України</h1>
          <p className="text-gray-600 text-sm sm:text-base">Підготовка до іспиту в ГСЦ МВС</p>
        </div>

        {/* Особисті картки (якщо є прогрес) */}
        {stats && (stats.mistakesCount > 0 || stats.bookmarksCount > 0 || stats.sequentialProgress > 0) && (
          <div className="grid grid-cols-1 gap-2.5 mb-3">
            {stats.sequentialProgress > 0 && (
              <Link
                href="/learn?resume=all-sequential"
                className="group block p-4 bg-blue-50 rounded-2xl ring-1 ring-blue-100 hover:ring-blue-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">▶️</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-blue-900 leading-tight">Продовжити навчання</h2>
                    <p className="text-xs text-blue-700/80 mt-0.5">питання {stats.sequentialProgress + 1} з {TOTAL_QUESTIONS}</p>
                  </div>
                </div>
              </Link>
            )}

            {stats.mistakesCount > 0 && (
              <Link
                href="/mistakes"
                className="group block p-4 bg-red-50 rounded-2xl ring-1 ring-red-100 hover:ring-red-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📕</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-red-900 leading-tight">Робота над помилками</h2>
                    <p className="text-xs text-red-700/80 mt-0.5">{stats.mistakesCount} питань з помилками</p>
                  </div>
                </div>
              </Link>
            )}

            {stats.bookmarksCount > 0 && (
              <Link
                href="/bookmarks"
                className="group block p-4 bg-yellow-50 rounded-2xl ring-1 ring-yellow-100 hover:ring-yellow-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⭐️</span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-yellow-900 leading-tight">Закладки</h2>
                    <p className="text-xs text-yellow-700/80 mt-0.5">{stats.bookmarksCount} збережених</p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        )}

        <div className="space-y-2.5">
          <Link
            href="/exam"
            className="block w-full p-5 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 hover:ring-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl sm:text-3xl">📝</span>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Іспит</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">20 питань • 20 хвилин • макс 2 помилки</p>
              </div>
            </div>
          </Link>

          <Link
            href="/learn"
            className="block w-full p-5 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 hover:ring-green-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl sm:text-3xl">📚</span>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Навчання</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">За темами • з поясненнями</p>
              </div>
            </div>
          </Link>

          <Link
            href="/practice"
            className="block w-full p-5 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 hover:ring-yellow-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl sm:text-3xl">🎯</span>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Практика</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Без таймера • без обмежень</p>
              </div>
            </div>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">Всього питань у базі: {TOTAL_QUESTIONS}</p>
      </div>
    </main>
  );
}
