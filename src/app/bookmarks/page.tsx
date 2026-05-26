import { getSession } from '@/lib/auth';
import { sql } from '@/lib/db';
import { Question } from '@/lib/types';
import questionsData from '@/data/questions.json';
import QuestionRunner from '@/components/QuestionRunner';

export const dynamic = 'force-dynamic';

async function loadBookmarks(userId: number): Promise<number[]> {
  const rows = (await sql`
    SELECT question_id FROM pdr_bookmarks
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `) as Array<{ question_id: number }>;
  return rows.map((r) => r.question_id);
}

export default async function BookmarksPage() {
  const session = await getSession();
  if (!session) return null;

  const allQuestions = questionsData as Question[];
  const bookmarkIds = await loadBookmarks(session.userId);

  const questions = bookmarkIds
    .map((id) => allQuestions.find((q) => q.id === id))
    .filter((q): q is Question => q !== undefined);

  return (
    <QuestionRunner
      questions={questions}
      title="Закладки"
      backHref="/"
      initialBookmarks={bookmarkIds}
      completionTitle="Закладки переглянуто!"
    />
  );
}
