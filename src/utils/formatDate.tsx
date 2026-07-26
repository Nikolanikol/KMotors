// Формат Encar «ГГ.ММ» — дата первой регистрации. Уместен в спеках карточки,
// но НЕ в title/H1: покупателю вне Кореи «24.07» читается как мусор.
export function formatDate(yyyymm: number | string): string {
  if (!yyyymm) return "";

  const string = yyyymm.toString();
  // Пустая строка вместо текста ошибки: значение попадает в title и JSON-LD,
  // и русская фраза уезжала бы в заголовок на всех языках.
  if (!/^\d{6}$/.test(string)) {
    return "";
  }

  const year = string.slice(2, 4); // последние две цифры года
  const month = string.slice(4, 6); // месяц

  return `${year}.${month}`;
}

// Полный год для заголовков и описаний: 202407 → «2024».
export function formatYear(yyyymm: number | string): string {
  if (!yyyymm) return "";

  const string = yyyymm.toString();
  if (!/^\d{6}$/.test(string)) return "";

  return string.slice(0, 4);
}
