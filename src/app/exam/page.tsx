'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QuestionCard from '@/components/QuestionCard';
import AnswerOption from '@/components/AnswerOption';
import Timer from '@/components/Timer';
import ProgressBar from '@/components/ProgressBar';
import { Question, UserAnswer } from '@/lib/types';
import { getRandomQuestions } from '@/lib/utils';
import questionsData from '@/data/questions.json';

const EXAM_QUESTIONS_COUNT = 20;
const EXAM_TIME_SECONDS = 20 * 60; // 20 minutes
const MAX_ERRORS = 2;

export default function ExamPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [wrongCount, setWrongCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const randomQuestions = getRandomQuestions(questionsData as Question[], EXAM_QUESTIONS_COUNT);
    setQuestions(randomQuestions);
  }, []);

  const handleFinish = useCallback(() => {
    setIsFinished(true);
    const correctCount = userAnswers.filter(a => a.isCorrect).length;
    const passed = wrongCount <= MAX_ERRORS && correctCount >= EXAM_QUESTIONS_COUNT - MAX_ERRORS;

    // Store results in localStorage
    localStorage.setItem('examResults', JSON.stringify({
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      passed,
      userAnswers,
      questions,
    }));

    router.push('/results?mode=exam');
  }, [userAnswers, wrongCount, questions, router]);

  const handleTimeUp = useCallback(() => {
    handleFinish();
  }, [handleFinish]);

  const handleAnswerSelect = (answerId: number) => {
    if (selectedAnswerId !== null) return;
    setSelectedAnswerId(answerId);
  };

  const handleNextQuestion = () => {
    if (selectedAnswerId === null) return;

    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedAnswerId === currentQuestion.correctAnswerId;

    const newAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      answerId: selectedAnswerId,
      isCorrect,
    };

    const newUserAnswers = [...userAnswers, newAnswer];
    setUserAnswers(newUserAnswers);

    if (!isCorrect) {
      const newWrongCount = wrongCount + 1;
      setWrongCount(newWrongCount);

      if (newWrongCount > MAX_ERRORS) {
        setIsFinished(true);
        localStorage.setItem('examResults', JSON.stringify({
          totalQuestions: questions.length,
          correctAnswers: newUserAnswers.filter(a => a.isCorrect).length,
          wrongAnswers: newWrongCount,
          passed: false,
          userAnswers: newUserAnswers,
          questions,
          failedEarly: true,
        }));
        router.push('/results?mode=exam');
        return;
      }
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswerId(null);
    } else {
      handleFinish();
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
          <div className="text-5xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Режим іспиту</h1>
          <div className="text-gray-600 mb-6 space-y-2">
            <p>• {EXAM_QUESTIONS_COUNT} питань</p>
            <p>• Час: 20 хвилин</p>
            <p>• Максимум {MAX_ERRORS} помилки</p>
            <p>• Для складання потрібно 18+ правильних</p>
          </div>
          <button
            onClick={() => setIsStarted(true)}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Почати іспит
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

  return (
    <main className="min-h-screen p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            ← Вийти
          </Link>
          <Timer
            initialSeconds={EXAM_TIME_SECONDS}
            onTimeUp={handleTimeUp}
            isPaused={isFinished}
          />
        </div>

        {/* Progress */}
        <div className="mb-6">
          <ProgressBar
            current={currentIndex + 1}
            total={questions.length}
            correctCount={correctCount}
            wrongCount={wrongCount}
          />
          {wrongCount > 0 && (
            <p className="text-sm text-red-500 mt-2">
              Помилок: {wrongCount} / {MAX_ERRORS} (більше {MAX_ERRORS} = не склав)
            </p>
          )}
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
              showResult={false}
              disabled={selectedAnswerId !== null}
              onClick={() => handleAnswerSelect(answer.id)}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNextQuestion}
          disabled={selectedAnswerId === null}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
            selectedAnswerId !== null
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {currentIndex < questions.length - 1 ? 'Наступне питання' : 'Завершити іспит'}
        </button>
      </div>
    </main>
  );
}
