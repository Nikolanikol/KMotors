// Время торгов carnect: часовой пояс и календарные дни — по Корее.
//
// Торги у всех площадок идут по корейскому времени, а источник пишет его
// по-разному: HeyDealer с зоной (+09:00), K Car без неё. Сюда сведено всё,
// что считает время лота, — и синк, и таймер на витрине.

const KST_OFFSET_MS = 9 * 3600 * 1000;

/**
 * Время из источника → ISO с зоной. K Car отдаёт startAt без зоны, время
 * корейское — без явного +09:00 Date.parse счёл бы его UTC и сдвинул на 9
 * часов (тот же класс ошибки, что у дат Encar в CLAUDE.md).
 */
export function kstIso(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  const withZone = /[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}+09:00`;
  const t = Date.parse(withZone);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

/** Сегодняшняя дата в Корее, YYYY-MM-DD. */
export function kstToday(now: Date = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Сколько КАЛЕНДАРНЫХ дней до дня торгов по корейскому календарю: 0 —
 * сегодня, 1 — завтра, отрицательное — прошли. null — дата непригодна.
 * Календарные, а не по миллисекундам: торги завтра утром — это «завтра».
 */
export function kstDaysUntil(date: string | null | undefined, now: Date = new Date()): number | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) return null;
  const target = Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
  const today = Date.parse(`${kstToday(now)}T00:00:00Z`);
  return Number.isFinite(target) ? Math.round((target - today) / 86_400_000) : null;
}
