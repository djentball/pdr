import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { sql } from '@/lib/db';
import { TOTAL_EXAM_QUESTIONS, MAX_EXAM_ERRORS } from '@/lib/examBlocks';

export const runtime = 'nodejs';

interface AttemptPayload {
  durationSec: number;
  questions: number[]; // ids питань у порядку
  answers: Array<{
    questionId: number;
    answerId: number | null;
    isCorrect: boolean;
  }>;
}

/**
 * POST /api/mock-exam/attempts — зберегти результат спроби.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = (await req.json().catch(() => null)) as AttemptPayload | null;
    if (!body) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const correctCount = body.answers.filter((a) => a.isCorrect).length;
    const wrongCount = body.answers.filter((a) => !a.isCorrect).length;
    const passed =
      wrongCount <= MAX_EXAM_ERRORS &&
      correctCount >= TOTAL_EXAM_QUESTIONS - MAX_EXAM_ERRORS;

    const rows = (await sql`
      INSERT INTO pdr_mock_exam_attempts
        (user_id, finished_at, duration_sec, total_questions,
         correct_count, wrong_count, passed, questions, answers)
      VALUES
        (${session.userId}, NOW(), ${body.durationSec}, ${TOTAL_EXAM_QUESTIONS},
         ${correctCount}, ${wrongCount}, ${passed},
         ${JSON.stringify(body.questions)}::jsonb, ${JSON.stringify(body.answers)}::jsonb)
      RETURNING id
    `) as Array<{ id: number }>;

    return NextResponse.json({
      id: rows[0]?.id,
      passed,
      correctCount,
      wrongCount,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

interface AttemptRow {
  id: number;
  finished_at: string;
  duration_sec: number;
  correct_count: number;
  wrong_count: number;
  passed: boolean;
}

/**
 * GET /api/mock-exam/attempts — історія спроб користувача (останні 50).
 */
export async function GET() {
  try {
    const session = await requireSession();
    const rows = (await sql`
      SELECT id, finished_at, duration_sec, correct_count, wrong_count, passed
      FROM pdr_mock_exam_attempts
      WHERE user_id = ${session.userId}
      ORDER BY finished_at DESC
      LIMIT 50
    `) as AttemptRow[];
    return NextResponse.json({ attempts: rows });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
