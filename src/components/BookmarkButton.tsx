'use client';

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onClick: () => void;
}

export default function BookmarkButton({ isBookmarked, onClick }: BookmarkButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={isBookmarked ? 'Прибрати з закладок' : 'Додати в закладки'}
      className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full hover:bg-yellow-50 active:bg-yellow-100 transition-colors"
    >
      {isBookmarked ? (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#facc15" stroke="#eab308" strokeWidth="1.5">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ) : (
        <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      )}
    </button>
  );
}
