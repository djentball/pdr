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
    <main className="min-h-screen px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Link
            href="/"
            aria-label="На головну"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors min-h-[36px]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="hidden sm:inline">На головну</span>
          </Link>
        </div>

        <div className="text-center mb-6">
          <div className="text-4xl sm:text-5xl mb-3">📚</div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Режим навчання</h1>
          <p className="text-gray-500 text-sm">Оберіть тему для вивчення</p>
        </div>

        {sequentialProgress > 0 && (
          <Link
            href="/learn?resume=all-sequential"
            className="block w-full p-4 mb-3 bg-blue-50 ring-1 ring-blue-100 hover:ring-blue-300 rounded-2xl transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">▶️</span>
              <div className="flex-1">
                <h2 className="font-semibold text-blue-900 leading-tight">Продовжити з {sequentialProgress + 1}-го</h2>
                <p className="text-xs text-blue-700/80 mt-0.5">з {totalQuestions} питань</p>
              </div>
            </div>
          </Link>
        )}

        <div className="space-y-2 mb-4">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/learn?category=${encodeURIComponent(category)}`}
              className="block w-full p-4 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 hover:ring-green-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-gray-900 text-sm sm:text-base">{category}</span>
                <span className="flex-shrink-0 text-xs text-gray-500 whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded-full">{counts[category]}</span>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/learn?mode=all-sequential"
          className="block w-full p-4 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-2xl font-semibold text-center transition-colors mb-2.5 shadow-sm shadow-green-600/20"
        >
          Всі питання попідряд ({totalQuestions})
        </Link>
        <Link
          href="/learn?mode=all-shuffled"
          className="block w-full p-4 bg-white ring-1 ring-green-600 text-green-700 hover:bg-green-50 active:bg-green-100 rounded-2xl font-semibold text-center transition-colors"
        >
          Всі питання у випадковому порядку
        </Link>
      </div>
    </main>
  );
}
