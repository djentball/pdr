'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  correctCount?: number;
  wrongCount?: number;
}

export default function ProgressBar({ current, total, correctCount, wrongCount }: ProgressBarProps) {
  const progress = (current / total) * 100;
  const showStats = correctCount !== undefined || wrongCount !== undefined;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-sm text-gray-600 font-medium tabular-nums">
          {current}<span className="text-gray-400"> / {total}</span>
        </span>
        {showStats && (
          <div className="flex gap-2 text-sm font-medium tabular-nums">
            {correctCount !== undefined && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {correctCount}
              </span>
            )}
            {wrongCount !== undefined && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {wrongCount}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
