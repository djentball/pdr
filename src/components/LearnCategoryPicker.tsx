'use client';

import Link from 'next/link';

interface Props {
  categories: string[];
  counts: Record<string, number>;
  totalQuestions: number;
  sequentialProgress: number;
}

export default function LearnCategoryPicker({
  categories,
  counts,
  totalQuestions,
  sequentialProgress,
}: Props) {
  return (
    <main className="min-h-screen px-3 sm:px-4 py-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← На головну
          </Link>
        </div>

        <div className="text-center mb-6">
          <div className="text-4xl sm:text-5xl mb-3">📚</div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Режим навчання</h1>
          <p className="text-gray-600 text-sm">Оберіть тему для вивчення</p>
        </div>

        {sequentialProgress > 0 && (
          <Link
            href="/learn?resume=all-sequential"
            className="block w-full p-4 mb-3 bg-blue-50 border-2 border-blue-200 hover:border-blue-400 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">▶️</span>
              <div className="flex-1">
                <h2 className="font-semibold text-blue-900">Продовжити з {sequentialProgress + 1}-го</h2>
                <p className="text-xs text-blue-700">з {totalQuestions} питань</p>
              </div>
            </div>
          </Link>
        )}

        <div className="space-y-2 sm:space-y-3 mb-4">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/learn?category=${encodeURIComponent(category)}`}
              className="block w-full p-3 sm:p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border-2 border-transparent hover:border-green-500"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-gray-800 text-sm sm:text-base">{category}</span>
                <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">{counts[category]} питань</span>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/learn?mode=all-sequential"
          className="block w-full p-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-center transition-colors mb-3"
        >
          Всі питання попідряд ({totalQuestions})
        </Link>
        <Link
          href="/learn?mode=all-shuffled"
          className="block w-full p-4 bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 rounded-xl font-semibold text-center transition-colors"
        >
          Всі питання у випадковому порядку
        </Link>
      </div>
    </main>
  );
}
