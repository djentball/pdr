'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface ExamResults {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  passed: boolean;
  failedEarly?: boolean;
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'exam';
  const [results, setResults] = useState<ExamResults | null>(null);

  useEffect(() => {
    const storedResults = localStorage.getItem('examResults');
    if (storedResults) {
      setResults(JSON.parse(storedResults));
    }
  }, []);

  if (!results) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Завантаження результатів...</div>
      </main>
    );
  }

  const percentage = Math.round((results.correctAnswers / results.totalQuestions) * 100);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Result Icon */}
        <div className="text-6xl mb-4">
          {results.passed ? '🎉' : '😔'}
        </div>

        {/* Title */}
        <h1 className={`text-2xl font-bold mb-2 ${results.passed ? 'text-green-600' : 'text-red-600'}`}>
          {mode === 'exam'
            ? (results.passed ? 'Іспит складено!' : 'Іспит не складено')
            : 'Результати практики'}
        </h1>

        {results.failedEarly && (
          <p className="text-red-500 text-sm mb-4">
            Перевищено ліміт помилок
          </p>
        )}

        {/* Score Circle */}
        <div className="relative w-40 h-40 mx-auto mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={results.passed ? '#22c55e' : '#ef4444'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${percentage * 2.83} 283`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-gray-800">{percentage}%</span>
            <span className="text-sm text-gray-500">{results.correctAnswers}/{results.totalQuestions}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{results.correctAnswers}</p>
            <p className="text-sm text-gray-600">Правильних</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{results.wrongAnswers}</p>
            <p className="text-sm text-gray-600">Неправильних</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href={mode === 'exam' ? '/exam' : '/practice'}
            className={`block w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
              mode === 'exam'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            }`}
          >
            Спробувати ще раз
          </Link>
          <Link
            href="/"
            className="block w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            На головну
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Завантаження...</div>
      </main>
    }>
      <ResultsContent />
    </Suspense>
  );
}
