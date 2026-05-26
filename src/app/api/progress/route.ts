import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * GET /api/progress?mode=all-sequential — поточний індекс для конкретного режиму
 * GET /api/progress — мапа { mode: currentIndex } для всіх режимів
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const mode = req.nextUrl.searchParams.get('mode');

    if (mode) {
      const rows = (await sql`
        SELECT current_index FROM pdr_progress
        WHERE user_id = ${session.userId} AND mode = ${mode}
      `) as Array<{ current_index: number }>;
      return NextResponse.json({ currentIndex: rows[0]?.current_index ?? 0 });
    }

    const rows = (await sql`
      SELECT mode, current_index FROM pdr_progress
      WHERE user_id = ${session.userId}
    `) as Array<{ mode: string; current_index: number }>;

    const map: Record<string, number> = {};
    for (const r of rows) map[r.mode] = r.current_index;
    return NextResponse.json({ progress: map });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

/**
 * PUT /api/progress — { mode, currentIndex }
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => null);
    const mode = typeof body?.mode === 'string' ? body.mode : '';
    const currentIndex = Number(body?.currentIndex);

    if (!mode || !Number.isInteger(currentIndex) || currentIndex < 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await sql`
      INSERT INTO pdr_progress (user_id, mode, current_index, updated_at)
      VALUES (${session.userId}, ${mode}, ${currentIndex}, NOW())
      ON CONFLICT (user_id, mode)
      DO UPDATE SET current_index = ${currentIndex}, updated_at = NOW()
    `;

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
