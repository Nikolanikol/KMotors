// Подписи витрины аукциона для СЕРВЕРНЫХ компонентов.
//
// Зачем отдельный модуль, когда есть i18next: инстанс i18next поднимается на
// запрос и живёт на КЛИЕНТЕ (см. SectionDictionary). Карточка лота и плашки —
// серверные и без состояния, тащить их в клиент ради подписей значит платить
// килобайтами JS за текст. Тот же приём, что в carLabels.ts для метаданных
// карточки авто: читаем словарь напрямую.
//
// ⚠️ Фолбэк на английский обязателен и повторяет fallbackLng у i18next:
// у ka и ar раздела `auction` нет вовсе — в проекте они намеренно пустые, а
// тексты приходят фолбэком (так же сделан калькулятор). Без этого грузинская
// и арабская витрины показали бы сырые ключи.

import ru from "@/locales/ru/common.json";
import en from "@/locales/en/common.json";

export type AuctionLabels = Record<string, string>;

const DICTS: Record<string, AuctionLabels> = {
  ru: (ru as { auction?: AuctionLabels }).auction ?? {},
  en: (en as { auction?: AuctionLabels }).auction ?? {},
};

/** Словарь витрины аукциона. ka/ar получают английский — переводов туда нет. */
export function auctionLabels(lang: string): AuctionLabels {
  return DICTS[lang] ?? DICTS.en;
}

/**
 * Подстановка счётчиков: «Найдено {{count}}» → «Найдено 394».
 * Свой минимальный интерполятор вместо i18next — на сервере его инстанса нет,
 * а подставить нужно ровно одно число.
 */
export function fill(template: string | undefined, count: number | string): string {
  return (template ?? "").replace(/\{\{count\}\}/g, String(count));
}
