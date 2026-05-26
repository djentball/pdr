import { getSession } from '@/lib/auth';
import { sql } from '@/lib/db';
import { Question } from '@/lib/types';
import questionsData from '@/data/questions.json';
import QuestionRunner from '@/components/QuestionRunner';

export const dynamic = 'force-dynamic';

async function loadMistakes(userId: number): Promise<number[]> {
  const rows = (await sql`
    SELECT DISTINCT ON (question_id) question_id, is_correct
    FROM pdr_answer_history
    WHERE user_id = ${userId}
    ORDER BY question_id, answered_at DESC
  `) as Array<{ question_id: number; is_correct: boolean }>;
  return rows.filter((r) => !r.is_correct).map((r) => r.question_id);
}

async function loadBookmarks(userId: number): Promise<number[]> {
  const rows = (await sql`
    SELECT question_id FROM pdr_bookmarks WHERE user_id = ${userId}
  `) as Array<{ question_id: number }>;
  return rows.map((r) => r.question_id);
}

export default async function MistakesPage() {
  const session = await getSession();
  if (!session) return null;

  const allQuestions = questionsData as Question[];
  const [mistakeIds, bookmarks] = await Promise.all([
    loadMistakes(session.userId),
    loadBookmarks(session.userId),
  ]);

  const questions = mistakeIds
    .map((id) => allQuestions.find((q) => q.id === id))
    .filter((q): q is Question => q !== undefined);

  return (
    <QuestionRunner
      questions={questions}
      title="Робота над помилками"
      backHref="/"
      initialBookmarks={bookmarks}
      completionTitle="Усі помилки відпрацьовано!"
    />
  );
}
