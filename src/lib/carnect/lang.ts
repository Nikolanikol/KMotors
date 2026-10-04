// Язык клиентской части карточки carnect.
//
// Решение владельца 04.10.2026: витрина аукциона — на АНГЛИЙСКОМ на всех
// локалях сайта, включая ru, «пока что». Русский перевод при этом не выброшен:
// служебный каталог в /admin остаётся русским, и вернуть русский на витрину —
// поменять один аргумент, а не переводить заново.
//
// Служебное (`internal` в card.ts, InternalPanel) — только по-русски: его
// читаем мы.

export type CardLang = "ru" | "en";

/** Пара [ru, en] → строка на нужном языке. */
export type Pair = readonly [ru: string, en: string];

export const pick = (lang: CardLang, p: Pair): string => (lang === "en" ? p[1] : p[0]);

/** Словарь пар → строка или undefined, если ключа нет. */
export function look(dict: Record<string, Pair>, key: string, lang: CardLang): string | undefined {
  const p = dict[key];
  return p ? pick(lang, p) : undefined;
}

/** Числа на карточке: разделители разрядов по языку. */
export const numLocale = (lang: CardLang) => (lang === "en" ? "en-US" : "ru-RU");
