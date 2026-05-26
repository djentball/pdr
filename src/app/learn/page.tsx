'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import QuestionCard from '@/components/QuestionCard';
import AnswerOption from '@/components/AnswerOption';
import ProgressBar from '@/components/ProgressBar';
import { Question } from '@/lib/types';
import { getUniqueCategories, getQuestionsByCategory, shuffleArray } from '@/lib/utils';
import questionsData from '@/data/questions.json';

export default function LearnPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    const uniqueCategories = getUniqueCategories(questionsData as Question[]);
    setCategories(uniqueCategories);
  }, []);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    const categoryQuestions = shuffleArray(getQuestionsByCategory(questionsData as Question[], category));
    setQuestions(categoryQuestions);
    setCurrentIndex(0);
    setSelectedAnswerId(null);
    setShowResult(false);
    setCorrectCount(0);
    setWrongCount(0);
  };

  const handleAnswerSelect = (answerId: number) => {
    if (showResult) return;
    setSelectedAnswerId(answerId);
    setShowResult(true);

    const currentQuestion = questions[currentIndex];
    if (answerId === currentQuestion.correctAnswerId) {
      setCorrectCount(correctCount + 1);
    } else {
      setWrongCount(wrongCount + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswerId(null);
      setShowResult(false);
    }
  };

  const handleSkip = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswerId(null);
      setShowResult(false);
    }
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setQuestions([]);
    setCurrentIndex(0);
  };

  // Category selection screen
  if (!selectedCategory) {
    return (
      <main className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              ← На головну
            </Link>
          </div>

          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📚</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Режим навчання</h1>
            <p className="text-gray-600">Оберіть тему для вивчення</p>
          </div>

          <div className="space-y-3">
            {categories.map((category) => {
              const count = getQuestionsByCategory(questionsData as Question[], category).length;
              return (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className="w-full p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-green-500 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{category}</span>
                    <span className="text-sm text-gray-500">{count} питань</span>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              setSelectedCategory('all');
              const allQuestions = [...(questionsData as Question[])].sort((a, b) => a.id - b.id);
              setQuestions(allQuestions);
              setCurrentIndex(0);
              setSelectedAnswerId(null);
              setShowResult(false);
              setCorrectCount(0);
              setWrongCount(0);
            }}
            className="w-full mt-6 p-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            Всі питання попідряд ({questionsData.length})
          </button>
          <button
            onClick={() => {
              setSelectedCategory('all-shuffled');
              const allQuestions = shuffleArray(questionsData as Question[]);
              setQuestions(allQuestions);
              setCurrentIndex(0);
              setSelectedAnswerId(null);
              setShowResult(false);
              setCorrectCount(0);
              setWrongCount(0);
            }}
            className="w-full mt-3 p-4 bg-white border-2 border-green-600 text-green-700 rounded-xl font-semibold hover:bg-green-50 transition-colors"
          >
            Всі питання у випадковому порядку
          </button>
        </div>
      </main>
    );
  }

  // Question finished screen
  if (questions.length > 0 && currentIndex >= questions.length - 1 && showResult) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {selectedCategory === 'all' || selectedCategory === 'all-shuffled' ? 'Усі питання завершено!' : 'Тему завершено!'}
          </h1>
          <div className="text-gray-600 mb-6 space-y-2">
            <p>Правильних: <span className="text-green-600 font-semibold">{correctCount}</span></p>
            <p>Неправильних: <span className="text-red-600 font-semibold">{wrongCount}</span></p>
            <p>Всього: {questions.length}</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => {
                if (selectedCategory === 'all') {
                  const allQuestions = [...(questionsData as Question[])].sort((a, b) => a.id - b.id);
                  setQuestions(allQuestions);
                  setCurrentIndex(0);
                  setSelectedAnswerId(null);
                  setShowResult(false);
                  setCorrectCount(0);
                  setWrongCount(0);
                } else if (selectedCategory === 'all-shuffled') {
                  const allQuestions = shuffleArray(questionsData as Question[]);
                  setQuestions(allQuestions);
                  setCurrentIndex(0);
                  setSelectedAnswerId(null);
                  setShowResult(false);
                  setCorrectCount(0);
                  setWrongCount(0);
                } else {
                  handleCategorySelect(selectedCategory);
                }
              }}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              {selectedCategory === 'all' || selectedCategory === 'all-shuffled' ? 'Почати знову' : 'Повторити тему'}
            </button>
            <button
              onClick={handleBack}
              className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Обрати іншу тему
            </button>
            <Link
              href="/"
              className="block w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              На головну
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Завантаження...</div>
      </main>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <main className="min-h-screen px-3 sm:px-4 pt-3 sm:pt-4 pb-[140px] sm:pb-32">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
          <button
            onClick={handleBack}
            className="text-sm text-gray-500 hover:text-gray-700 min-h-[44px] flex items-center -ml-1 px-1"
          >
            ← Теми
          </button>
          <span className="text-xs sm:text-sm text-green-600 font-medium text-right line-clamp-1">
            {selectedCategory === 'all'
              ? 'Всі питання — попідряд'
              : selectedCategory === 'all-shuffled'
              ? 'Всі питання — випадково'
              : selectedCategory}
          </span>
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
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
        />

        {/* Answers */}
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          {currentQuestion.answers.map((answer) => (
            <AnswerOption
              key={answer.id}
              answer={answer}
              isSelected={selectedAnswerId === answer.id}
              isCorrect={answer.id === currentQuestion.correctAnswerId}
              isWrong={answer.id !== currentQuestion.correctAnswerId}
              showResult={showResult}
              disabled={showResult}
              onClick={() => handleAnswerSelect(answer.id)}
            />
          ))}
        </div>

        {/* Explanation */}
        {showResult && currentQuestion.explanation && (
          <div className={`p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 ${
            selectedAnswerId === currentQuestion.correctAnswerId
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className="text-sm font-medium mb-1">
              {selectedAnswerId === currentQuestion.correctAnswerId
                ? '✓ Правильно!'
                : '✗ Неправильно'}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{currentQuestion.explanation}</p>
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
            onClick={handleNextQuestion}
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
