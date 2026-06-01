/**
 * Розподіл категорій з questions.json по 4-х офіційних блоках іспиту ГСЦ МВС:
 *   - ПДР               — 10 питань з 20
 *   - Безпека руху      — 4 питання
 *   - Будова ТЗ         — 4 питання
 *   - Домедична допомога — 2 питання
 */

import type { Question } from './types';

export type ExamBlock = 'pdr' | 'safety' | 'vehicle' | 'medical';

export const BLOCK_LABELS: Record<ExamBlock, string> = {
  pdr: 'Правила дорожнього руху',
  safety: 'Основи безпеки руху',
  vehicle: 'Будова та експлуатація ТЗ',
  medical: 'Домедична допомога',
};

export const BLOCK_QUOTAS: Record<ExamBlock, number> = {
  pdr: 10,
  safety: 4,
  vehicle: 4,
  medical: 2,
};

export const TOTAL_EXAM_QUESTIONS = 20;
export const MAX_EXAM_ERRORS = 2;
export const EXAM_TIME_SECONDS = 20 * 60; // 20 хвилин

const CATEGORY_TO_BLOCK: Record<string, ExamBlock> = {
  // Блок ПДР
  'Загальні положення': 'pdr',
  "Обов'язки і права водіїв": 'pdr',
  'Рух ТЗ зі спеціальними сигналами': 'pdr',
  "Обов'язки і права пішоходів": 'pdr',
  "Обов'язки і права пасажирів": 'pdr',
  'Вимоги до велосипедистів': 'pdr',
  'Вимоги до гужового транспорту': 'pdr',
  'Регулювання дорожнього руху': 'pdr',
  'Попереджувальні сигнали': 'pdr',
  'Початок руху та зміна напрямку': 'pdr',
  'Розташування ТЗ на дорозі': 'pdr',
  'Швидкість руху': 'pdr',
  "Дистанція, інтервал, зустрічний роз'їзд": 'pdr',
  'Зупинка і стоянка': 'pdr',
  'Проїзд перехресть': 'pdr',
  'Переваги маршрутних ТЗ': 'pdr',
  'Проїзд пішохідних переходів': 'pdr',
  'Користування зовнішніми світловими приладами': 'pdr',
  'Рух через залізничні переїзди': 'pdr',
  'Перевезення пасажирів': 'pdr',
  'Перевезення вантажу': 'pdr',
  'Буксирування та експлуатація ТЗ': 'pdr',
  'Навчальна їзда': 'pdr',
  'Рух ТЗ у колонах': 'pdr',
  'Рух в житлових і пішохідних зонах': 'pdr',
  'Рух автомагістралями і дорогами для автомобілів': 'pdr',
  'Рух гірськими дорогами': 'pdr',
  'Дорожні знаки': 'pdr',
  'Дорожня розмітка': 'pdr',
  'Окремі питання дорожнього руху': 'pdr',
  'Додаткові для категорії B (Загальні)': 'pdr',
  'Етика водіння': 'pdr',
  'Основи права': 'pdr',
  'Додаткові для категорії B (Юридична відповідальність)': 'pdr',
  'Європротокол': 'pdr',

  // Блок Безпека
  'Основи безпечного водіння': 'safety',
  'Додаткові для категорії B (Безпека)': 'safety',

  // Блок Будова
  'Технічний стан ТЗ': 'vehicle',
  'Номерні та розпізнавальні знаки': 'vehicle',
  'Додаткові для категорії B (Будова)': 'vehicle',

  // Блок Домедична допомога
  'Домедична допомога': 'medical',
};

export function categoryToBlock(category?: string): ExamBlock | null {
  if (!category) return null;
  return CATEGORY_TO_BLOCK[category] ?? null;
}

/**
 * Згенерувати білет 20 питань пропорційно по блоках.
 */
export function generateMockExamTicket(allQuestions: Question[]): Question[] {
  const byBlock: Record<ExamBlock, Question[]> = {
    pdr: [],
    safety: [],
    vehicle: [],
    medical: [],
  };

  for (const q of allQuestions) {
    const block = categoryToBlock(q.category);
    if (block) byBlock[block].push(q);
  }

  const ticket: Question[] = [];
  (Object.keys(BLOCK_QUOTAS) as ExamBlock[]).forEach((block) => {
    const pool = byBlock[block];
    const quota = BLOCK_QUOTAS[block];
    const picked = pickRandom(pool, quota);
    ticket.push(...picked);
  });

  return ticket;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return [...arr];
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}
