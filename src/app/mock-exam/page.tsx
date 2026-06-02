'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BackPill from '@/components/BackPill';
import QuestionCard from '@/components/QuestionCard';
import AnswerOption from '@/components/AnswerOption';
import Timer from '@/components/Timer';
import ProgressBar from '@/components/ProgressBar';
import { Question, UserAnswer } from '@/lib/types';
import {
  TOTAL_EXAM_QUESTIONS,
  EXAM_TIME_SECONDS,
  MAX_EXAM_ERRORS,
  BLOCK_LABELS,
  BLOCK_QUOTAS,
} from '@/lib/examBlocks';

export default function MockExamPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [wrongCount, setWrongCount] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    fetch('/api/mock-exam/generate')
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions || []))
      .catch(() => setQuestions([]));
  }, []);

  const submitAttempt = useCallback(
    async (finalAnswers: UserAnswer[]) => {
      if (isSaving) return;
      setIsSaving(true);
      const durationSec = startedAtRef.current
        ? Math.round((Date.now() - startedAtRef.current) / 1000)
        : EXAM_TIME_SECONDS;
      try {
        const res = await fetch('/api/mock-exam/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            durationSec,
            questions: questions.map((q) => q.id),
            answers: finalAnswers,
          }),
        });
        const data = await res.json();
        if (data?.id) {
          router.push(`/mock-exam/${data.id}`);
        } else {
          router.push('/mock-exam/history');
        }
      } catch {
        router.push('/mock-exam/history');
      }
    },
    [isSaving, questions, router],
  );

  const handleTimeUp = useCallback(() => {
    // Доповнюємо порожніми «не відповіли»
    const remaining = questions.slice(userAnswers.length).map((q) => ({
      questionId: q.id,
      answerId: -1,
      isCorrect: false,
    }));
    submitAttempt([...userAnswers, ...remaining]);
  }, [questions, userAnswers, submitAttempt]);

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

    const newWrongCount = isCorrect ? wrongCount : wrongCount + 1;
    if (!isCorrect) setWrongCount(newWrongCount);

    // Перевищили ліміт помилок — завершуємо одразу
    if (newWrongCount > MAX_EXAM_ERRORS) {
      submitAttempt(newUserAnswers);
      return;
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswerId(null);
    } else {
      submitAttempt(newUserAnswers);
    }
  };

  if (questions.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Генеруємо білет…</div>
      </main>
    );
  }

  if (!isStarted) {
    return (
      <main className="min-h-screen p-4 sm:py-10">
        <div className="max-w-md mx-auto">
          <div className="mb-5">
            <BackPill href="/" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <div className="text-5xl mb-3 text-center">🏛️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              Іспит ГСЦ МВС
            </h1>
            <p className="text-sm text-gray-500 text-center mb-5">
              Офіційний формат: <b>{TOTAL_EXAM_QUESTIONS}</b> питань за <b>20 хв</b>,
              максимум <b>{MAX_EXAM_ERRORS}</b> помилки.
            </p>

            <div className="rounded-xl bg-gray-50 p-4 mb-5">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                Структура білета
              </p>
              <ul className="space-y-1.5 text-sm text-gray-700">
                {(Object.keys(BLOCK_QUOTAS) as Array<keyof typeof BLOCK_QUOTAS>).map((b) => (
                  <li key={b} className="flex justify-between">
                    <span>{BLOCK_LABELS[b]}</span>
                    <span className="font-semibold tabular-nums">{BLOCK_QUOTAS[b]}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => {
                startedAtRef.current = Date.now();
                setIsStarted(true);
              }}
              className="w-full bg-blue-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
            >
              Почати іспит
            </button>

            <Link
              href="/mock-exam/history"
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Історія спроб
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const currentQuestion = questions[currentIndex];
  const correctCount = userAnswers.filter((a) => a.isCorrect).length;

  return (
    <main className="min-h-screen p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <BackPill href="/" label="Вийти" />
          <Timer
            initialSeconds={EXAM_TIME_SECONDS}
            onTimeUp={handleTimeUp}
            isPaused={isSaving}
          />
        </div>

        <div className="mb-6">
          <ProgressBar
            current={currentIndex + 1}
            total={questions.length}
            correctCount={correctCount}
            wrongCount={wrongCount}
          />
          {wrongCount > 0 && (
            <p className="text-sm text-red-500 mt-2">
              Помилок: {wrongCount} / {MAX_EXAM_ERRORS}
            </p>
          )}
        </div>

        <QuestionCard
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
        />

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

        <button
          onClick={handleNextQuestion}
          disabled={selectedAnswerId === null || isSaving}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
            selectedAnswerId !== null && !isSaving
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSaving
            ? 'Зберігаємо…'
            : currentIndex < questions.length - 1
              ? 'Наступне питання'
              : 'Завершити іспит'}
        </button>
      </div>
    </main>
  );
}
