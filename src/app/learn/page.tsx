import { getSession } from '@/lib/auth';
import { sql } from '@/lib/db';
import { Question } from '@/lib/types';
import { getUniqueCategories, getQuestionsByCategory, shuffleArray } from '@/lib/utils';
import questionsData from '@/data/questions.json';
import QuestionRunner from '@/components/QuestionRunner';
import LearnCategoryPicker from '@/components/LearnCategoryPicker';

export const dynamic = 'force-dynamic';

interface SearchParams {
  category?: string;
  mode?: 'all-sequential' | 'all-shuffled';
  resume?: 'all-sequential';
}

async function loadProgress(userId: number, mode: string): Promise<number> {
  const rows = (await sql`
    SELECT current_index FROM pdr_progress
    WHERE user_id = ${userId} AND mode = ${mode}
  `) as Array<{ current_index: number }>;
  return rows[0]?.current_index ?? 0;
}

async function loadBookmarks(userId: number): Promise<number[]> {
  const rows = (await sql`
    SELECT question_id FROM pdr_bookmarks WHERE user_id = ${userId}
  `) as Array<{ question_id: number }>;
  return rows.map((r) => r.question_id);
}

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const session = await getSession();
  if (!session) {
    // middleware вже перенаправить, але про всяк
    return null;
  }

  const allQuestions = questionsData as Question[];
  const bookmarks = await loadBookmarks(session.userId);

  // Режим: продовжити sequential
  if (params.resume === 'all-sequential') {
    const initialIndex = await loadProgress(session.userId, 'all-sequential');
    const questions = [...allQuestions].sort((a, b) => a.id - b.id);
    return (
      <QuestionRunner
        questions={questions}
        title="Всі питання — попідряд"
        backHref="/"
        progressMode="all-sequential"
        initialIndex={initialIndex}
        initialBookmarks={bookmarks}
        completionTitle="Усі питання завершено!"
      />
    );
  }

  // Режим: всі питання послідовно (з нуля)
  if (params.mode === 'all-sequential') {
    const questions = [...allQuestions].sort((a, b) => a.id - b.id);
    return (
      <QuestionRunner
        questions={questions}
        title="Всі питання — попідряд"
        backHref="/learn"
        progressMode="all-sequential"
        initialBookmarks={bookmarks}
        completionTitle="Усі питання завершено!"
      />
    );
  }

  // Режим: всі питання випадково
  if (params.mode === 'all-shuffled') {
    const questions = shuffleArray(allQuestions);
    return (
      <QuestionRunner
        questions={questions}
        title="Всі питання — випадково"
        backHref="/learn"
        initialBookmarks={bookmarks}
        completionTitle="Усі питання завершено!"
      />
    );
  }

  // Конкретна категорія
  if (params.category) {
    const questions = shuffleArray(getQuestionsByCategory(allQuestions, params.category));
    return (
      <QuestionRunner
        questions={questions}
        title={params.category}
        backHref="/learn"
        initialBookmarks={bookmarks}
        completionTitle="Тему завершено!"
      />
    );
  }

  // Екран вибору категорії
  const categories = getUniqueCategories(allQuestions);
  const categoryCounts: Record<string, number> = {};
  for (const cat of categories) {
    categoryCounts[cat] = getQuestionsByCategory(allQuestions, cat).length;
  }
  const sequentialProgress = await loadProgress(session.userId, 'all-sequential');

  return (
    <LearnCategoryPicker
      categories={categories}
      counts={categoryCounts}
      totalQuestions={allQuestions.length}
      sequentialProgress={sequentialProgress}
    />
  );
}
