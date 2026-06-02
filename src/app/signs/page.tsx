'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import signsData from '@/data/signs.json';

type SignGroup = 'warning' | 'priority' | 'prohibition' | 'mandatory' | 'info' | 'service';

interface Sign {
  image: string;
  name: string;
  group: SignGroup;
  questionId: number;
  explanation: string | null;
}

const GROUP_LABELS: Record<SignGroup, string> = {
  warning: 'Попереджувальні',
  priority: 'Пріоритету',
  prohibition: 'Заборонні',
  mandatory: 'Наказові',
  info: 'Інформаційно-вказівні',
  service: 'Сервісу',
};

const GROUP_ORDER: SignGroup[] = [
  'warning',
  'priority',
  'prohibition',
  'mandatory',
  'info',
  'service',
];

const GROUP_COLORS: Record<SignGroup, string> = {
  warning: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  priority: 'bg-orange-50 text-orange-700 ring-orange-200',
  prohibition: 'bg-red-50 text-red-700 ring-red-200',
  mandatory: 'bg-blue-50 text-blue-700 ring-blue-200',
  info: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  service: 'bg-purple-50 text-purple-700 ring-purple-200',
};

export default function SignsPage() {
  const signs = signsData as Sign[];
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<SignGroup | 'all'>('all');
  const [openSign, setOpenSign] = useState<Sign | null>(null);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = { all: signs.length };
    for (const g of GROUP_ORDER) counts[g] = 0;
    for (const s of signs) counts[s.group] = (counts[s.group] || 0) + 1;
    return counts;
  }, [signs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return signs.filter((s) => {
      if (activeGroup !== 'all' && s.group !== activeGroup) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [signs, query, activeGroup]);

  // Згрупувати для відображення (тільки якщо переглядаємо всі групи)
  const sectioned = useMemo(() => {
    if (activeGroup !== 'all') return null;
    const map = new Map<SignGroup, Sign[]>();
    for (const s of filtered) {
      if (!map.has(s.group)) map.set(s.group, []);
      map.get(s.group)!.push(s);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
      group: g,
      items: map.get(g)!,
    }));
  }, [filtered, activeGroup]);

  return (
    <main className="min-h-screen p-4 sm:py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← На головну
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-1">Каталог дорожніх знаків</h1>
        <p className="text-sm text-gray-500 mb-6">
          {signs.length} знаків з нашої бази. Натисни на знак — побачиш пояснення.
        </p>

        {/* Пошук */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Пошук за назвою…"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 mb-4 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />

        {/* Фільтр груп */}
        <div className="flex flex-wrap gap-2 mb-6">
          <FilterChip
            active={activeGroup === 'all'}
            onClick={() => setActiveGroup('all')}
            label={`Усі (${groupCounts.all})`}
          />
          {GROUP_ORDER.map((g) =>
            groupCounts[g] > 0 ? (
              <FilterChip
                key={g}
                active={activeGroup === g}
                onClick={() => setActiveGroup(g)}
                label={`${GROUP_LABELS[g]} (${groupCounts[g]})`}
                colorClass={GROUP_COLORS[g]}
              />
            ) : null,
          )}
        </div>

        {/* Грід знаків */}
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Знаків за запитом не знайдено</p>
        ) : sectioned ? (
          <div className="space-y-8">
            {sectioned.map(({ group, items }) => (
              <section key={group}>
                <h2 className="text-sm uppercase tracking-wide text-gray-400 mb-3">
                  {GROUP_LABELS[group]}
                </h2>
                <Grid items={items} onClick={setOpenSign} />
              </section>
            ))}
          </div>
        ) : (
          <Grid items={filtered} onClick={setOpenSign} />
        )}

        {/* Модалка з деталями */}
        {openSign && (
          <div
            className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setOpenSign(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-md w-full p-5 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <span
                  className={`text-[11px] uppercase tracking-wide px-2 py-1 rounded-full ring-1 ${GROUP_COLORS[openSign.group]}`}
                >
                  {GROUP_LABELS[openSign.group]}
                </span>
                <button
                  onClick={() => setOpenSign(null)}
                  className="text-gray-400 hover:text-gray-700 -mt-1 text-2xl leading-none"
                  aria-label="Закрити"
                >
                  ×
                </button>
              </div>
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-50 mb-3">
                <Image
                  src={openSign.image}
                  alt={openSign.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 448px"
                  className="object-contain"
                />
              </div>
              <h3 className="font-semibold text-gray-900 leading-snug mb-2">{openSign.name}</h3>
              {openSign.explanation && (
                <p className="text-sm text-gray-600 leading-relaxed">{openSign.explanation}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  colorClass,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  colorClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs sm:text-sm px-3 py-1.5 rounded-full transition-colors ring-1 ${
        active
          ? colorClass
            ? colorClass
            : 'bg-blue-600 text-white ring-blue-600'
          : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}

function Grid({ items, onClick }: { items: Sign[]; onClick: (s: Sign) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((s) => (
        <button
          key={s.image}
          onClick={() => onClick(s)}
          className="group block rounded-2xl bg-white ring-1 ring-gray-100 hover:ring-blue-300 hover:shadow-md transition-all p-3 text-left"
        >
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-50 mb-2">
            <Image
              src={s.image}
              alt={s.name}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-contain"
            />
          </div>
          <p className="text-xs text-gray-700 line-clamp-2 leading-snug">{s.name}</p>
        </button>
      ))}
    </div>
  );
}
