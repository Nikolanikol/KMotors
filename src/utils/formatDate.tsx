export function formatDate(yyyymm: number | string): string {
  if (!yyyymm) return "";

  const string = yyyymm.toString();
  if (!/^\d{6}$/.test(string)) {
    return "указан неверный формат";
  }

  const year = string.slice(2, 4); // последние две цифры года
  const month = string.slice(4, 6); // месяц

  return `${year}.${month}`;
}
