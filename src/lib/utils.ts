import { Question } from './types';

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getRandomQuestions(questions: Question[], count: number): Question[] {
  const shuffled = shuffleArray(questions);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getQuestionsByCategory(questions: Question[], category: string): Question[] {
  return questions.filter(q => q.category === category);
}

export function getUniqueCategories(questions: Question[]): string[] {
  const categories = questions
    .map(q => q.category)
    .filter((c): c is string => c !== undefined);
  return [...new Set(categories)];
}
