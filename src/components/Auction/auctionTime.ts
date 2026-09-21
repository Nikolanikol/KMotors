// Момент окончания торгов.
//
// ⚠️ В данных витрины времени НЕТ — там только календарная дата
// (`2026-09-22T00:00:00.000Z`), а обратный отсчёт она считает своим кодом.
// Реальный дедлайн снят с её же счётчика 21.09.2026: показывая «22h 1m 55s
// left» в 05:58 UTC, она целилась в 04:00 UTC следующего дня. Сверено на трёх
// страницах и двух площадках (SK и K Car) — расхождение в пределах секунды.
//
// 04:00 UTC — это 13:00 по Корее. Час правдоподобный для окончания торгов, но
// он ИЗМЕРЕН, а не объявлен: если наш счётчик разойдётся с их, первым делом
// перемерять этот сдвиг, а не искать ошибку в арифметике.
//
// ⚠️ ДАТЫ У ПЛОЩАДОК РАЗНЫЕ — торги идут по своим расписаниям (замер: Lotte
// 21.09, SK и K Car 22.09). Поэтому дедлайн считается из даты КОНКРЕТНОГО
// лота, а не из общей на раздел.
const AUCTION_END_HOUR_UTC = 4;

/** Дедлайн лота как момент времени. null — даты нет или она непригодна. */
export function auctionDeadline(date: string | null | undefined): Date | null {
  if (!date) return null;
  const day = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(day.getTime())) return null;
  day.setUTCHours(AUCTION_END_HOUR_UTC);
  return day;
}

export interface Remaining {
  hours: number;
  minutes: number;
  seconds: number;
  /** Торги уже закончились. */
  over: boolean;
  /** Меньше суток — повод подсветить. */
  soon: boolean;
}

/** Сколько осталось до дедлайна. Часы НЕ сворачиваются в дни: витрина-источник
 *  показывает «47h», и так понятнее, чем «1 день 23 часа». */
export function remainingUntil(deadline: Date, now: Date = new Date()): Remaining {
  const ms = deadline.getTime() - now.getTime();
  if (ms <= 0) return { hours: 0, minutes: 0, seconds: 0, over: true, soon: false };
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  return {
    hours,
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    over: false,
    soon: hours < 24,
  };
}
