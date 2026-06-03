/**
 * Метрика готовності до іспиту 0-100%.
 *
 * Формула:
 *   readiness = 0.4*acc + 0.3*coverage + 0.3*mockPass
 *
 *   acc       — точність останніх 100 відповідей (% правильних)
 *   coverage  — % категорій де користувач відповів >= 5 разів
 *   mockPass  — % зданих останніх 5 mock-exam спроб
 *
 * Якщо метрика не може бути обчислена (нема даних) — повертається 0.
 */

import { sql } from './db';
import questionsData from '@/data/questions.json';
import type { Question } from './types';

const ACC_WEIGHT = 0.4;
const COVERAGE_WEIGHT = 0.3;
const MOCK_WEIGHT = 0.3;

const MIN_ANSWERS_PER_CATEGORY = 5;
const RECENT_ANSWERS_WINDOW = 100;
const RECENT_MOCK_WINDOW = 5;

const ALL_CATEGORIES = new Set(
  (questionsData as Question[])
    .map((q) => q.category)
    .filter((c): c is string => typeof c === 'string'),
);
const TOTAL_CATEGORIES = ALL_CATEGORIES.size;

export interface ReadinessSnapshot {
  score: number;       // 0..100
  accuracy: number;    // 0..100
  coverage: number;    // 0..100
  mockPass: number;    // 0..100
  recentCorrect: number;
  recentTotal: number;
  coveredCategories: number;
  totalCategories: number;
  mockAttempts: number;
  mockPassed: number;
  streakDays: number;
}

interface RecentAccRow {
  total: string | number;
  correct: string | number;
}
interface CoverageRow {
  question_id: number;
  cnt: string | number;
}
interface MockRow {
  passed: boolean;
}
interface StreakRow {
  d: string;
}

/** Безпечно виконати SQL, повернути fallback при помилці (напр. немає таблиці). */
async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    console.warn('[readiness] sql failed:', (e as Error).message);
    return fallback;
  }
}

export async function computeReadiness(userId: number): Promise<ReadinessSnapshot> {
  // Усі 4 запити одночасно — швидше + ізоляція помилок (mock-exam таблиця може ще не існувати)
  const [accRows, coverageRows, mockRows, streakRows] = await Promise.all([
    safe(
      sql`
        WITH recent AS (
          SELECT is_correct FROM pdr_answer_history
          WHERE user_id = ${userId}
          ORDER BY answered_at DESC
          LIMIT ${RECENT_ANSWERS_WINDOW}
        )
        SELECT COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE is_correct)::int AS correct
        FROM recent
      ` as unknown as Promise<RecentAccRow[]>,
      [{ total: 0, correct: 0 }] as RecentAccRow[],
    ),
    safe(
      sql`
        SELECT question_id, COUNT(*)::int AS cnt
        FROM pdr_answer_history
        WHERE user_id = ${userId}
        GROUP BY question_id
      ` as unknown as Promise<CoverageRow[]>,
      [] as CoverageRow[],
    ),
    safe(
      sql`
        SELECT passed FROM pdr_mock_exam_attempts
        WHERE user_id = ${userId}
        ORDER BY finished_at DESC
        LIMIT ${RECENT_MOCK_WINDOW}
      ` as unknown as Promise<MockRow[]>,
      [] as MockRow[],
    ),
    safe(
      sql`
        SELECT DISTINCT DATE(answered_at AT TIME ZONE 'UTC') AS d
        FROM pdr_answer_history
        WHERE user_id = ${userId}
          AND answered_at >= NOW() - INTERVAL '60 days'
        ORDER BY d DESC
      ` as unknown as Promise<StreakRow[]>,
      [] as StreakRow[],
    ),
  ]);

  const recentTotal = Number(accRows[0]?.total ?? 0);
  const recentCorrect = Number(accRows[0]?.correct ?? 0);
  const accuracy = recentTotal > 0 ? (recentCorrect / recentTotal) * 100 : 0;

  const categoryById = new Map<number, string | undefined>(
    (questionsData as Question[]).map((q) => [q.id, q.category]),
  );
  const perCategory = new Map<string, number>();
  for (const row of coverageRows) {
    const cat = categoryById.get(Number(row.question_id));
    if (!cat) continue;
    perCategory.set(cat, (perCategory.get(cat) ?? 0) + Number(row.cnt));
  }
  const coveredCategories = Array.from(perCategory.values()).filter(
    (n) => n >= MIN_ANSWERS_PER_CATEGORY,
  ).length;
  const coverage = TOTAL_CATEGORIES > 0 ? (coveredCategories / TOTAL_CATEGORIES) * 100 : 0;

  const mockAttempts = mockRows.length;
  const mockPassed = mockRows.filter((r) => r.passed).length;
  const mockPass = mockAttempts > 0 ? (mockPassed / mockAttempts) * 100 : 0;
  const days = new Set(streakRows.map((r) => r.d.slice(0, 10)));
  let streakDays = 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) streakDays++;
    else if (i === 0) {
      // якщо сьогодні нема — серія не починається з сьогодні, але може з учора
      continue;
    } else {
      break;
    }
  }

  const score =
    ACC_WEIGHT * accuracy + COVERAGE_WEIGHT * coverage + MOCK_WEIGHT * mockPass;

  return {
    score: Math.round(score),
    accuracy: Math.round(accuracy),
    coverage: Math.round(coverage),
    mockPass: Math.round(mockPass),
    recentCorrect,
    recentTotal,
    coveredCategories,
    totalCategories: TOTAL_CATEGORIES,
    mockAttempts,
    mockPassed,
    streakDays,
  };
}
