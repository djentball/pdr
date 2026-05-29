'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import QuestionCard from './QuestionCard';
import AnswerOption from './AnswerOption';
import ProgressBar from './ProgressBar';
import BookmarkButton from './BookmarkButton';
import { Question } from '@/lib/types';

interface QuestionRunnerProps {
  questions: Question[];
  /** Назва/підпис режиму у хедері (наприклад "Всі питання — попідряд") */
  title: string;
  /** Куди веде кнопка "Назад". За замовчуванням — на головну. */
  backHref?: string;
  /** Унікальний ключ режиму, по якому зберігаємо прогрес у БД */
  progressMode?: string;
  /** Початковий індекс (наприклад відновлений з БД) */
  initialIndex?: number;
  /** Початковий лічильник правильних */
  initialCorrectCount?: number;
  /** Початковий лічильник неправильних */
  initialWrongCount?: number;
  /** Початковий набір id закладок */
  initialBookmarks?: number[];
  /** Чи звітувати відповіді на сервер (записати в pdr_answer_history) */
  recordAnswers?: boolean;
  /** Custom subtitle на завершальному екрані */
  completionTitle?: string;
}

export default function QuestionRunner({
  questions,
  title,
  backHref = '/',
  progressMode,
  initialIndex = 0,
  initialCorrectCount = 0,
  initialWrongCount = 0,
  initialBookmarks = [],
  recordAnswers = true,
  completionTitle = 'Завершено!',
}: QuestionRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(initialCorrectCount);
  const [wrongCount, setWrongCount] = useState(initialWrongCount);
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set(initialBookmarks));
  const [completed, setCompleted] = useState(false);

  // Запис прогресу в БД разом з лічильниками
  const saveProgress = useCallback(
    async (index: number, correct: number, wrong: number) => {
      if (!progressMode) return;
      try {
        await fetch('/api/progress', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: progressMode,
            currentIndex: index,
            correctCount: correct,
            wrongCount: wrong,
          }),
        });
      } catch {
        // ігноруємо помилки збереження
      }
    },
    [progressMode]
  );

  const handleAnswerSelect = (answerId: number) => {
    if (showResult) return;
    const q = questions[currentIndex];
    const isCorrect = answerId === q.correctAnswerId;

    setSelectedAnswerId(answerId);
    setShowResult(true);
    const newCorrect = isCorrect ? correctCount + 1 : correctCount;
    const newWrong = isCorrect ? wrongCount : wrongCount + 1;
    if (isCorrect) setCorrectCount(newCorrect);
    else setWrongCount(newWrong);

    if (recordAnswers) {
      fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, selectedAnswerId: answerId, isCorrect }),
      }).catch(() => {});
    }

    // Зберігаю прогрес одразу після відповіді (щоб при виході лічильники збереглися)
    saveProgress(currentIndex, newCorrect, newWrong);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      setSelectedAnswerId(null);
      setShowResult(false);
      saveProgress(next, correctCount, wrongCount);
    } else {
      setCompleted(true);
      if (progressMode) {
        // на завершенні скидаємо все в 0 щоб «Продовжити» зникло і наступний раз був з чистого аркуша
        saveProgress(0, 0, 0);
      }
    }
  };

  const handleSkip = () => {
    if (currentIndex < questions.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      setSelectedAnswerId(null);
      setShowResult(false);
      saveProgress(next, correctCount, wrongCount);
    }
  };

  const handleRestart = () => {
    if (!confirm('Скинути прогрес і почати з 1-го питання?')) return;
    setCurrentIndex(0);
    setSelectedAnswerId(null);
    setShowResult(false);
    setCorrectCount(0);
    setWrongCount(0);
    setCompleted(false);
    if (progressMode) saveProgress(0, 0, 0);
  };

  const toggleBookmark = async (questionId: number) => {
    const isBookmarked = bookmarks.has(questionId);
    const newSet = new Set(bookmarks);
    if (isBookmarked) {
      newSet.delete(questionId);
      setBookmarks(newSet);
      await fetch(`/api/bookmarks?questionId=${questionId}`, { method: 'DELETE' }).catch(() => {});
    } else {
      newSet.add(questionId);
      setBookmarks(newSet);
      await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
      }).catch(() => {});
    }
  };

  // Прибрано початкове збереження — лічильники і індекс ставимо одразу з initial*

  if (questions.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-4xl mb-3">🎉</div>
          <p className="text-gray-700 mb-4">Тут пусто — нічого проходити.</p>
          <Link href={backHref} className="text-blue-600 hover:text-blue-700 font-medium">
            ← На головну
          </Link>
        </div>
      </main>
    );
  }

  if (completed) {
    const total = correctCount + wrongCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{completionTitle}</h1>
          <div className="text-gray-600 mb-6 space-y-1">
            <p>
              Правильних: <span className="text-green-600 font-semibold">{correctCount}</span>
            </p>
            <p>
              Неправильних: <span className="text-red-600 font-semibold">{wrongCount}</span>
            </p>
            <p>Точність: {accuracy}%</p>
          </div>
          <Link
            href={backHref}
            className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700"
          >
            На головну
          </Link>
        </div>
      </main>
    );
  }

  const q = questions[currentIndex];
  const isBookmarked = bookmarks.has(q.id);

  return (
    <main className="min-h-screen px-3 sm:px-4 pt-3 sm:pt-4 pb-[140px] sm:pb-32">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
          <Link
            href={backHref}
            className="text-sm text-gray-500 hover:text-gray-700 min-h-[44px] flex items-center -ml-1 px-1"
          >
            ← Назад
          </Link>
          <span className="flex-1 text-xs sm:text-sm text-green-600 font-medium text-center line-clamp-1">
            {title}
          </span>
          {progressMode && (
            <button
              onClick={handleRestart}
              aria-label="Почати заново"
              title="Почати заново"
              className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-500"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 4v5h5" />
              </svg>
            </button>
          )}
          <BookmarkButton isBookmarked={isBookmarked} onClick={() => toggleBookmark(q.id)} />
        </div>

        {/* Progress */}
        <div className="mb-4 sm:mb-6">
          <ProgressBar
            current={currentIndex + 1}
            total={questions.length}
            correctCount={correctCount}
            wrongCount={wrongCount}
          />
        </div>

        {/* Question */}
        <QuestionCard
          question={q}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
        />

        {/* Answers */}
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          {q.answers.map((answer) => (
            <AnswerOption
              key={answer.id}
              answer={answer}
              isSelected={selectedAnswerId === answer.id}
              isCorrect={answer.id === q.correctAnswerId}
              isWrong={answer.id !== q.correctAnswerId}
              showResult={showResult}
              disabled={showResult}
              onClick={() => handleAnswerSelect(answer.id)}
            />
          ))}
        </div>

        {/* Explanation */}
        {showResult && q.explanation && (
          <div
            className={`p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 ${
              selectedAnswerId === q.correctAnswerId
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <p className="text-sm font-medium mb-1">
              {selectedAnswerId === q.correctAnswerId ? '✓ Правильно!' : '✗ Неправильно'}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{q.explanation}</p>
          </div>
        )}
      </div>

      {/* Sticky bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-3 sm:px-4 py-3 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        <div className="max-w-2xl mx-auto flex gap-2 sm:gap-3">
          {!showResult && (
            <button
              onClick={handleSkip}
              className="flex-1 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors min-h-[52px]"
            >
              Пропустити
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!showResult}
            className={`flex-1 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-colors min-h-[52px] ${
              showResult
                ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {currentIndex < questions.length - 1 ? 'Наступне' : 'Завершити'}
          </button>
        </div>
      </div>
    </main>
  );
}
