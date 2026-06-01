import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { generateMockExamTicket } from '@/lib/examBlocks';
import questionsData from '@/data/questions.json';
import type { Question } from '@/lib/types';

export const runtime = 'nodejs';

/**
 * GET /api/mock-exam/generate
 *
 * Повертає 20 питань пропорційно по 4-х офіційних блоках ГСЦ МВС:
 *   10 ПДР + 4 безпека + 4 будова + 2 домедична допомога.
 */
export async function GET() {
  try {
    await requireSession();
    const ticket = generateMockExamTicket(questionsData as Question[]);
    return NextResponse.json({ questions: ticket });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
