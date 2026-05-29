'use client';

import { Answer } from '@/lib/types';

interface AnswerOptionProps {
  answer: Answer;
  isSelected: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  showResult: boolean;
  disabled: boolean;
  onClick: () => void;
}

export default function AnswerOption({
  answer,
  isSelected,
  isCorrect,
  isWrong,
  showResult,
  disabled,
  onClick,
}: AnswerOptionProps) {
  // Стан кнопки
  const buttonClasses = [
    'w-full text-left rounded-2xl border transition-all duration-200',
    'px-4 py-3 sm:px-5 sm:py-4',
    'min-h-[56px]', // зручний tap-target на мобілці
    'active:scale-[0.99]',
    disabled ? 'cursor-default' : 'cursor-pointer',
  ];

  if (showResult) {
    if (isCorrect) {
      buttonClasses.push('border-green-500 bg-green-50 text-green-900');
    } else if (isWrong && isSelected) {
      buttonClasses.push('border-red-500 bg-red-50 text-red-900');
    } else {
      buttonClasses.push('border-gray-200 bg-white text-gray-400');
    }
  } else if (isSelected) {
    buttonClasses.push('border-blue-500 bg-blue-50 text-blue-900');
  } else {
    buttonClasses.push(
      'border-gray-200 bg-white text-gray-800',
      'hover:border-blue-400 hover:bg-blue-50/30'
    );
  }

  // Стан кружечка зліва — прозорий за замовчуванням
  const badgeClasses = [
    'flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full',
    'border-2 flex items-center justify-center',
    'text-sm sm:text-base font-semibold',
    'transition-colors duration-200',
  ];

  if (showResult && isCorrect) {
    badgeClasses.push('border-green-500 bg-green-500 text-white');
  } else if (showResult && isWrong && isSelected) {
    badgeClasses.push('border-red-500 bg-red-500 text-white');
  } else if (showResult) {
    badgeClasses.push('border-gray-300 bg-transparent text-gray-400');
  } else if (isSelected) {
    badgeClasses.push('border-blue-500 bg-blue-500 text-white');
  } else {
    // дефолтний стан — прозорий фон, кружечок і цифра одного синього відтінку
    badgeClasses.push('border-blue-500 bg-transparent text-blue-600');
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses.join(' ')}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <span className={badgeClasses.join(' ')}>
          {showResult && isCorrect ? '✓' : showResult && isWrong && isSelected ? '✗' : answer.id}
        </span>
        <span className="flex-1 text-[17px] sm:text-base font-medium leading-snug">{answer.text}</span>
      </div>
    </button>
  );
}
