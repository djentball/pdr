import type { ReadinessSnapshot } from '@/lib/readiness';

interface Props {
  data: ReadinessSnapshot;
}

function ringColor(score: number) {
  if (score >= 80) return 'stroke-green-500';
  if (score >= 60) return 'stroke-blue-500';
  if (score >= 40) return 'stroke-yellow-500';
  return 'stroke-red-500';
}

function statusLabel(score: number) {
  if (score >= 85) return 'Готовий';
  if (score >= 70) return 'Майже готовий';
  if (score >= 50) return 'Підтягуй слабкі теми';
  if (score >= 20) return 'Тренуйся більше';
  return 'Тільки на старті';
}

export default function ReadinessWidget({ data }: Props) {
  const { score } = data;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm p-5 mb-5">
      <div className="flex items-center gap-5">
        {/* Кільце з відсотком */}
        <div className="relative shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              className="stroke-gray-100"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              className={ringColor(score)}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 600ms ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 tabular-nums">{score}%</div>
              <div className="text-[10px] uppercase tracking-wide text-gray-400">
                готовність
              </div>
            </div>
          </div>
        </div>

        {/* Підпис + метрики */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-800 mb-2">{statusLabel(score)}</div>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            <Metric
              label="Точність останніх 100"
              value={`${data.accuracy}%`}
              sub={data.recentTotal > 0 ? `${data.recentCorrect}/${data.recentTotal}` : 'нема даних'}
            />
            <Metric
              label="Покриття тем"
              value={`${data.coverage}%`}
              sub={`${data.coveredCategories}/${data.totalCategories}`}
            />
            <Metric
              label="Здано іспитів"
              value={`${data.mockPass}%`}
              sub={
                data.mockAttempts > 0
                  ? `${data.mockPassed}/${data.mockAttempts}`
                  : 'жодного'
              }
            />
            {data.streakDays > 0 && (
              <div className="text-xs text-orange-600 font-semibold mt-1">
                🔥 серія: {data.streakDays} {pluralizeDays(data.streakDays)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-gray-500 truncate">{label}</span>
      <span className="font-semibold text-gray-800 tabular-nums whitespace-nowrap">
        {value} <span className="text-gray-400 font-normal text-[11px]">({sub})</span>
      </span>
    </div>
  );
}

function pluralizeDays(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дні';
  return 'днів';
}
