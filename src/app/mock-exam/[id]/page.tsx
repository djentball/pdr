import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import BackPill from '@/components/BackPill';
import { requireSession } from '@/lib/auth';
import { sql } from '@/lib/db';
import questionsData from '@/data/questions.json';
import type { Question } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface FullAttemptRow {
  id: number;
  finished_at: string;
  duration_sec: number;
  correct_count: number;
  wrong_count: number;
  passed: boolean;
  questions: number[];
  answers: Array<{ questionId: number; answerId: number | null; isCorrect: boolean }>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('uk-UA', {
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

export default async function MockExamDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) notFound();

  const rows = (await sql`
    SELECT id, finished_at, duration_sec, correct_count, wrong_count, passed,
           questions, answers
    FROM pdr_mock_exam_attempts
    WHERE id = ${id} AND user_id = ${session.userId}
    LIMIT 1
  `) as FullAttemptRow[];

  if (rows.length === 0) notFound();
  const a = rows[0];

  const qById = new Map<number, Question>(
    (questionsData as Question[]).map((q) => [q.id, q]),
  );

  const items = a.questions.map((qid, idx) => {
    const q = qById.get(qid);
    const userAns = a.answers.find((x) => x.questionId === qid);
    return { idx: idx + 1, q, userAns };
  });

  return (
    <main className="min-h-screen p-4 sm:py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <BackPill href="/mock-exam/history" label="Історія" />
          <Link
            href="/mock-exam"
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Спробувати ще →
          </Link>
        </div>

        <div
          className={`rounded-2xl p-6 mb-6 ${
            a.passed ? 'bg-green-50 ring-1 ring-green-200' : 'bg-red-50 ring-1 ring-red-200'
          }`}
        >
          <div className="text-3xl mb-1">{a.passed ? '🎉' : '😔'}</div>
          <h1 className="text-2xl font-bold text-gray-800">
            {a.passed ? 'Складено!' : 'Не складено'}
          </h1>
          <div className="mt-3 text-gray-700 text-sm space-y-1">
            <div>
              Правильних: <b>{a.correct_count}</b> з {a.correct_count + a.wrong_count}
            </div>
            <div>
              Помилок: <b>{a.wrong_count}</b>
            </div>
            <div>
              Час: <b>{formatDuration(a.duration_sec)}</b>
            </div>
            <div className="text-gray-500">{formatDate(a.finished_at)}</div>
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-800 mb-3">Детальний розбір</h2>
        <div className="space-y-4">
          {items.map(({ idx, q, userAns }) => {
            if (!q) return null;
            const isCorrect = userAns?.isCorrect ?? false;
            const userPicked = userAns?.answerId ?? null;
            return (
              <div
                key={`${idx}-${q.id}`}
                className={`rounded-2xl border p-4 ${
                  isCorrect
                    ? 'border-green-200 bg-white'
                    : 'border-red-300 bg-red-50/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs text-gray-500">Питання {idx}</span>
                  {q.category && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {q.category}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-3 leading-snug">
                  {q.text}
                </h3>
                {q.image && (
                  <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-50 mb-3">
                    <Image
                      src={q.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 672px"
                      className="object-contain"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  {q.answers.map((ans) => {
                    const isRight = ans.id === q.correctAnswerId;
                    const isPicked = ans.id === userPicked;
                    let cls = 'border-gray-200 bg-white text-gray-700';
                    if (isRight) cls = 'border-green-500 bg-green-50 text-green-900';
                    else if (isPicked) cls = 'border-red-500 bg-red-50 text-red-900';
                    return (
                      <div
                        key={ans.id}
                        className={`rounded-lg border px-3 py-2 text-sm ${cls}`}
                      >
                        {isRight && '✓ '}
                        {isPicked && !isRight && '✗ '}
                        {ans.text}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer text-blue-600">Пояснення</summary>
                    <p className="mt-2 text-gray-700 leading-relaxed">{q.explanation}</p>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
