'use client';

import { useEffect, useState } from 'react';
import { formatTime } from '@/lib/utils';

interface TimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
  isPaused?: boolean;
}

export default function Timer({ initialSeconds, onTimeUp, isPaused = false }: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (isPaused) return;

    if (seconds <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, isPaused, onTimeUp]);

  const isLowTime = seconds <= 60;
  const isCritical = seconds <= 30;

  return (
    <div className={`
      flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold
      ${isCritical ? 'bg-red-100 text-red-700 animate-pulse' :
        isLowTime ? 'bg-yellow-100 text-yellow-700' :
        'bg-gray-100 text-gray-700'}
    `}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {formatTime(seconds)}
    </div>
  );
}
