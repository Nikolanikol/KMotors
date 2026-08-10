import type { TFunction } from "i18next";
import type { I18nText } from "@/lib/customs/core/types";

/**
 * Разворачивает текст, названный ядром, в строку активного языка.
 *
 * Параметр сам может быть `I18nText` — например возрастной бракет внутри
 * формулы акциза, — поэтому обход рекурсивный. Экранирование отключать не
 * нужно: в инстансе i18next этого проекта уже стоит `escapeValue: false`,
 * иначе глифы «>» и «≤» из бракетов приезжали бы как «&gt;».
 *
 * `t` обязан быть привязан к неймспейсу `customs`: ключи ядер идут без него.
 */
export function resolveText(t: TFunction, text: I18nText): string {
  const params: Record<string, string | number> = {};
  for (const [name, value] of Object.entries(text.params ?? {})) {
    params[name] =
      value !== null && typeof value === "object"
        ? resolveText(t, value)
        : value;
  }
  return t(text.key, params) as string;
}

/**
 * ISO-дата «2026-08-09» → «9 августа 2026» на активном языке.
 *
 * Названия месяцев лежат в словаре, а не в коде: `formatDateRu` из ядра
 * умеет только по-русски и годится лишь для внутренних нужд.
 */
export function resolveDate(t: TFunction, isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;

  const [, year, month, day] = match;
  const monthName = t(`ui.month.${Number(month)}`);
  if (!monthName || monthName === `ui.month.${Number(month)}`) return isoDate;

  return t("ui.date", { day: Number(day), month: monthName, year });
}
