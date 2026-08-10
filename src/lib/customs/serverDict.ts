import ru from "@/locales/ru/customs.json";
import en from "@/locales/en/customs.json";
import ka from "@/locales/ka/customs.json";
import ar from "@/locales/ar/customs.json";

/**
 * Доступ к словарю калькуляторов ВНЕ React.
 *
 * `generateMetadata` живёт вне рендер-дерева, инстанса i18next там нет —
 * ровно как у карточки авто, которая по той же причине читает cars.json
 * напрямую. Хук сюда не годится.
 */
const DICTS: Record<string, unknown> = { ru, en, ka, ar };

/**
 * Заполнен ли словарь для языка.
 *
 * Пока перевода нет, страница отдаётся с noindex: пустить в индекс страницу,
 * состоящую из сырых ключей, хуже, чем не пустить её вовсе. Проверка
 * автоматическая — когда словарь заполнят, индексация включится сама, без
 * правок в разметке.
 */
export function hasCustomsDictionary(lang: string): boolean {
  const dict = DICTS[lang];
  return Boolean(
    dict && typeof dict === "object" && Object.keys(dict).length > 0,
  );
}

/** Значение по точечному ключу; undefined, если ключа нет. */
export function customsText(lang: string, key: string): string | undefined {
  const value = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object"
          ? (node as Record<string, unknown>)[part]
          : undefined,
      DICTS[lang],
    );
  return typeof value === "string" ? value : undefined;
}
