import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * GET /api/bookmarks — список id заброньованих питань
 */
export async function GET() {
  try {
    const session = await requireSession();
    const rows = (await sql`
      SELECT question_id FROM pdr_bookmarks
      WHERE user_id = ${session.userId}
      ORDER BY created_at DESC
    `) as Array<{ question_id: number }>;
    return NextResponse.json({ questionIds: rows.map((r) => r.question_id) });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

/**
 * POST /api/bookmarks — { questionId } — додати закладку
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => null);
    const questionId = Number(body?.questionId);
    if (!Number.isInteger(questionId)) {
      return NextResponse.json({ error: 'Invalid questionId' }, { status: 400 });
    }
    await sql`
      INSERT INTO pdr_bookmarks (user_id, question_id)
      VALUES (${session.userId}, ${questionId})
      ON CONFLICT DO NOTHING
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

/**
 * DELETE /api/bookmarks?questionId=N — видалити закладку
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireSession();
    const questionId = Number(req.nextUrl.searchParams.get('questionId'));
    if (!Number.isInteger(questionId)) {
      return NextResponse.json({ error: 'Invalid questionId' }, { status: 400 });
    }
    await sql`
      DELETE FROM pdr_bookmarks
      WHERE user_id = ${session.userId} AND question_id = ${questionId}
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
