import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * GET /api/progress?mode=all-sequential — повертає { currentIndex, correctCount, wrongCount }
 * GET /api/progress — мапа { mode: { currentIndex, correctCount, wrongCount } }
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const mode = req.nextUrl.searchParams.get('mode');

    if (mode) {
      const rows = (await sql`
        SELECT current_index, correct_count, wrong_count FROM pdr_progress
        WHERE user_id = ${session.userId} AND mode = ${mode}
      `) as Array<{ current_index: number; correct_count: number; wrong_count: number }>;
      const r = rows[0];
      return NextResponse.json({
        currentIndex: r?.current_index ?? 0,
        correctCount: r?.correct_count ?? 0,
        wrongCount: r?.wrong_count ?? 0,
      });
    }

    const rows = (await sql`
      SELECT mode, current_index, correct_count, wrong_count FROM pdr_progress
      WHERE user_id = ${session.userId}
    `) as Array<{ mode: string; current_index: number; correct_count: number; wrong_count: number }>;

    const map: Record<string, { currentIndex: number; correctCount: number; wrongCount: number }> = {};
    for (const r of rows) {
      map[r.mode] = {
        currentIndex: r.current_index,
        correctCount: r.correct_count,
        wrongCount: r.wrong_count,
      };
    }
    return NextResponse.json({ progress: map });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

/**
 * PUT /api/progress — { mode, currentIndex, correctCount?, wrongCount? }
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => null);
    const mode = typeof body?.mode === 'string' ? body.mode : '';
    const currentIndex = Number(body?.currentIndex);
    const correctCount = Number(body?.correctCount ?? 0);
    const wrongCount = Number(body?.wrongCount ?? 0);

    if (!mode || !Number.isInteger(currentIndex) || currentIndex < 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await sql`
      INSERT INTO pdr_progress (user_id, mode, current_index, correct_count, wrong_count, updated_at)
      VALUES (${session.userId}, ${mode}, ${currentIndex}, ${correctCount}, ${wrongCount}, NOW())
      ON CONFLICT (user_id, mode)
      DO UPDATE SET
        current_index = ${currentIndex},
        correct_count = ${correctCount},
        wrong_count = ${wrongCount},
        updated_at = NOW()
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
