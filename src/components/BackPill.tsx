import Link from 'next/link';

interface BackPillProps {
  href: string;
  label?: string;
  className?: string;
}

/**
 * Уніфікована кнопка "Назад" у вигляді сірого pill з шевроном.
 */
export default function BackPill({
  href,
  label = 'Назад',
  className = '',
}: BackPillProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors min-h-[36px] ${className}`}
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span>{label}</span>
    </Link>
  );
}
