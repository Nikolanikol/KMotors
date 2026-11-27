// Номер детали Hyundai/Kia/Genesis из сообщения клиента. Чистая функция —
// tests/telegram/tgbot.spec.ts.
//
// Формат: 5 знаков + 3–6, с дефисом, пробелом или слитно: 26300-35505, 2630035505,
// 86511 D9000. Возвращает слитную запись в верхнем регистре или null.

const PART_RE = /^[0-9A-Z]{5}[-\s]?[0-9A-Z]{3,6}$/;

export function normalizePartNumber(raw: string): string | null {
  const s = raw.trim().toUpperCase();
  if (!PART_RE.test(s)) return null;
  // Слова вроде «HELLO WORLD» — не номер: нужна хотя бы одна цифра в обеих частях.
  const flat = s.replace(/[-\s]/g, "");
  if (!/\d/.test(flat.slice(0, 5)) || !/\d/.test(flat.slice(5))) return null;
  return flat;
}
