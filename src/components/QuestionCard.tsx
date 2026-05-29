'use client';

import Image from 'next/image';
import { Question } from '@/lib/types';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuestionCard({ question, questionNumber, totalQuestions }: QuestionCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
        <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
          Питання {questionNumber} з {totalQuestions}
        </span>
        {question.category && (
          <span className="text-[11px] sm:text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-right line-clamp-1 font-medium">
            {question.category}
          </span>
        )}
      </div>

      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 leading-snug">
        {question.text}
      </h2>

      {question.image && (
        <div className="relative w-full aspect-[4/3] sm:aspect-auto sm:h-64 rounded-xl overflow-hidden bg-gray-50">
          <Image
            src={question.image}
            alt="Зображення до питання"
            fill
            sizes="(max-width: 640px) 100vw, 672px"
            className="object-contain"
          />
        </div>
      )}
    </div>
  );
}
