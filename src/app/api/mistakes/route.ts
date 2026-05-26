import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * GET /api/mistakes — список id питань, на які остання відповідь була неправильною.
 * Виключає питання, на які потім відповіли правильно.
 */
export async function GET() {
  try {
    const session = await requireSession();

    // Для кожного question_id беремо найсвіжіший запис; якщо він is_correct = false — в список.
    const rows = (await sql`
      SELECT DISTINCT ON (question_id) question_id, is_correct
      FROM pdr_answer_history
      WHERE user_id = ${session.userId}
      ORDER BY question_id, answered_at DESC
    `) as Array<{ question_id: number; is_correct: boolean }>;

    const mistakeIds = rows.filter((r) => !r.is_correct).map((r) => r.question_id);

    return NextResponse.json({ questionIds: mistakeIds });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
