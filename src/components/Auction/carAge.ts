/**
 * «2023 (3 года)» — год выпуска с возрастом машины.
 *
 * ⚠️ Склонение обязательно: «3 года», но «5 лет» и «21 год». Строка видна
 * на самом заметном месте карточки, и «3 лет» там читается как недоделка.
 */
export function yearWithAge(year: number | null | undefined, now = new Date()): string | null {
  if (!year) return null;
  const age = now.getFullYear() - year;
  if (age <= 0) return String(year);

  const last = age % 10;
  const lastTwo = age % 100;
  const word =
    lastTwo >= 11 && lastTwo <= 14 ? "лет" : last === 1 ? "год" : last >= 2 && last <= 4 ? "года" : "лет";
  return `${year} (${age} ${word})`;
}

/**
 * Сколько дней осталось до торгов. Возвращает ЧИСЛО, а не готовую подпись:
 * карточка живёт и на русской служебной странице, и на публичной витрине в
 * четырёх языках, поэтому текст собирает вызывающая сторона из своих подписей.
 *
 * ⚠️ Считаем по КАЛЕНДАРНЫМ дням, а не по разнице в миллисекундах: торги
 * завтра в 09:00 и завтра в 23:00 — это одинаково «завтра», а деление на
 * 86 400 000 дало бы для первого «сегодня».
 */
export function daysUntilAuction(date: string | null | undefined, now = new Date()): number | null {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(target.getTime())) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target.getTime() - today) / 86_400_000);
}

/** Русское склонение дней: 1 день, 2–4 дня, 5+ дней. */
export function pluralDays(days: number): string {
  const last = days % 10;
  const lastTwo = days % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return "дней";
  if (last === 1) return "день";
  if (last >= 2 && last <= 4) return "дня";
  return "дней";
}
