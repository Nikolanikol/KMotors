/**
 * Форматирование чисел для интерфейса. Ядро форматированием не занимается —
 * оно возвращает точные значения, а округление до вида происходит здесь.
 *
 * Группировка разрядов сделана вручную, а не через Intl: так вывод
 * побайтово одинаков на сервере и в браузере и не даёт рассинхрона
 * при гидратации.
 */

const GROUP_SEPARATOR = " "; // узкий неразрывный пробел

export function formatAmount(value: number, fractionDigits = 0): string {
  if (!Number.isFinite(value)) return "—";

  const sign = value < 0 ? "-" : "";
  const fixed = Math.abs(value).toFixed(fractionDigits);
  const [whole, fraction] = fixed.split(".");

  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);
  return fraction ? `${sign}${grouped},${fraction}` : `${sign}${grouped}`;
}

export function formatMoney(
  amount: number,
  currency: string,
  fractionDigits = 0,
): string {
  return `${formatAmount(amount, fractionDigits)} ${currency}`;
}

const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

/** ISO-дата «2026-08-09» → «9 августа 2026». Без Intl, чтобы вывод был стабилен. */
export function formatDateRu(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;

  const [, year, month, day] = match;
  const monthName = MONTHS_GENITIVE[Number(month) - 1];
  if (!monthName) return isoDate;

  return `${Number(day)} ${monthName} ${year}`;
}
