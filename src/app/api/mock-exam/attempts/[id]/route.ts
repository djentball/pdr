import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

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

/**
 * GET /api/mock-exam/attempts/[id] — деталі однієї спроби.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const rows = (await sql`
      SELECT id, finished_at, duration_sec, correct_count, wrong_count, passed,
             questions, answers
      FROM pdr_mock_exam_attempts
      WHERE id = ${id} AND user_id = ${session.userId}
      LIMIT 1
    `) as FullAttemptRow[];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ attempt: rows[0] });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
