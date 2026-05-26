import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * POST /api/answers — записати спробу відповіді
 * body: { questionId, selectedAnswerId, isCorrect }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => null);

    const questionId = Number(body?.questionId);
    const selectedAnswerId = Number(body?.selectedAnswerId);
    const isCorrect = Boolean(body?.isCorrect);

    if (!Number.isInteger(questionId) || !Number.isInteger(selectedAnswerId)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await sql`
      INSERT INTO pdr_answer_history (user_id, question_id, selected_answer_id, is_correct)
      VALUES (${session.userId}, ${questionId}, ${selectedAnswerId}, ${isCorrect})
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
