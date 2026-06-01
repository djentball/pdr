import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface AttemptRow {
  id: number;
  finished_at: string;
  duration_sec: number;
  correct_count: number;
  wrong_count: number;
  passed: boolean;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default async function MockExamHistoryPage() {
  const session = await requireSession();
  const attempts = (await sql`
    SELECT id, finished_at, duration_sec, correct_count, wrong_count, passed
    FROM pdr_mock_exam_attempts
    WHERE user_id = ${session.userId}
    ORDER BY finished_at DESC
    LIMIT 50
  `) as AttemptRow[];

  const passedCount = attempts.filter((a) => a.passed).length;
  const passRate = attempts.length > 0 ? Math.round((passedCount / attempts.length) * 100) : 0;

  return (
    <main className="min-h-screen p-4 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/mock-exam" className="text-blue-600 hover:underline text-sm">
            ← До іспиту
          </Link>
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            На головну
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Історія спроб</h1>
        {attempts.length > 0 ? (
          <p className="text-sm text-gray-500 mb-6">
            Усього спроб: <b>{attempts.length}</b> · Складено: <b>{passedCount}</b> (
            {passRate}%)
          </p>
        ) : (
          <p className="text-gray-500 mb-6">
            Ще немає жодної спроби.{' '}
            <Link href="/mock-exam" className="text-blue-600 hover:underline">
              Скласти перший
            </Link>
            ?
          </p>
        )}

        <div className="space-y-2">
          {attempts.map((a) => (
            <Link
              key={a.id}
              href={`/mock-exam/${a.id}`}
              className={`block rounded-lg border p-4 transition-colors ${
                a.passed
                  ? 'border-green-200 bg-green-50 hover:bg-green-100'
                  : 'border-red-200 bg-red-50 hover:bg-red-100'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-800">
                    {a.passed ? '✓ Складено' : '✗ Не складено'}
                  </div>
                  <div className="text-sm text-gray-500">{formatDate(a.finished_at)}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold tabular-nums">
                    {a.correct_count}/{a.correct_count + a.wrong_count}
                  </div>
                  <div className="text-gray-500 tabular-nums">
                    {formatDuration(a.duration_sec)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
