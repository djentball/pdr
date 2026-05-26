'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QuestionCard from '@/components/QuestionCard';
import AnswerOption from '@/components/AnswerOption';
import ProgressBar from '@/components/ProgressBar';
import { Question, UserAnswer } from '@/lib/types';
import { getRandomQuestions } from '@/lib/utils';
import questionsData from '@/data/questions.json';

const PRACTICE_QUESTIONS_COUNT = 20;

export default function PracticePage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const randomQuestions = getRandomQuestions(questionsData as Question[], PRACTICE_QUESTIONS_COUNT);
    setQuestions(randomQuestions);
  }, []);

  const handleAnswerSelect = (answerId: number) => {
    if (showResult) return;
    setSelectedAnswerId(answerId);
    setShowResult(true);

    const currentQuestion = questions[currentIndex];
    const isCorrect = answerId === currentQuestion.correctAnswerId;

    setUserAnswers([...userAnswers, {
      questionId: currentQuestion.id,
      answerId,
      isCorrect,
    }]);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswerId(null);
      setShowResult(false);
    } else {
      // Finish practice
      const correctCount = userAnswers.filter(a => a.isCorrect).length;
      localStorage.setItem('examResults', JSON.stringify({
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        wrongAnswers: questions.length - correctCount,
        passed: correctCount >= questions.length - 2,
        userAnswers,
        questions,
      }));
      router.push('/results?mode=practice');
    }
  };

  if (questions.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Завантаження...</div>
      </main>
    );
  }

  if (!isStarted) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Режим практики</h1>
          <div className="text-gray-600 mb-6 space-y-2">
            <p>• {PRACTICE_QUESTIONS_COUNT} випадкових питань</p>
            <p>• Без обмеження часу</p>
            <p>• Миттєва перевірка відповіді</p>
            <p>• Статистика в кінці</p>
          </div>
          <button
            onClick={() => setIsStarted(true)}
            className="w-full bg-yellow-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
          >
            Почати практику
          </button>
          <Link
            href="/"
            className="block mt-4 text-gray-500 hover:text-gray-700"
          >
            ← Повернутися
          </Link>
        </div>
      </main>
    );
  }

  const currentQuestion = questions[currentIndex];
  const correctCount = userAnswers.filter(a => a.isCorrect).length;
  const wrongCount = userAnswers.filter(a => !a.isCorrect).length;

  return (
    <main className="min-h-screen p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            ← Вийти
          </Link>
          <span className="text-sm text-gray-500">Без таймера</span>
        </div>

        {/* Progress */}
        <div className="mb-6">
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
        <div className="space-y-3 mb-6">
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
          <div className={`p-4 rounded-lg mb-6 ${
            selectedAnswerId === currentQuestion.correctAnswerId
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className="text-sm font-medium mb-1">
              {selectedAnswerId === currentQuestion.correctAnswerId
                ? '✓ Правильно!'
                : '✗ Неправильно'}
            </p>
            <p className="text-sm text-gray-700">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Next Button */}
        <button
          onClick={handleNextQuestion}
          disabled={!showResult}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
            showResult
              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {currentIndex < questions.length - 1 ? 'Наступне питання' : 'Завершити практику'}
        </button>
      </div>
    </main>
  );
}
