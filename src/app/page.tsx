import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚗</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Тести ПДР України
          </h1>
          <p className="text-gray-600">
            Підготовка до іспиту в ГСЦ МВС
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/exam"
            className="block w-full p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">📝</span>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Іспит</h2>
                <p className="text-sm text-gray-500">20 питань • 20 хвилин • макс 2 помилки</p>
              </div>
            </div>
          </Link>

          <Link
            href="/learn"
            className="block w-full p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-green-500"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">📚</span>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Навчання</h2>
                <p className="text-sm text-gray-500">За темами • з поясненнями</p>
              </div>
            </div>
          </Link>

          <Link
            href="/practice"
            className="block w-full p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-yellow-500"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">🎯</span>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Практика</h2>
                <p className="text-sm text-gray-500">Без таймера • без обмежень</p>
              </div>
            </div>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Всього питань у базі: 326
        </p>
      </div>
    </main>
  );
}
