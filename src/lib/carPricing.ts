// Ценообразование АВТО. Единственный источник — как pricing.ts у запчастей.
//
//   цена_для_клиента_KRW = цена_Encar_KRW + стояночный сбор
//   цена_₽/$             = цена_для_клиента_KRW × курс KB (см. kbFx.ts)
//
// Сбор входит в цену НА ВСЕХ УРОВНЯХ, включая главную цену в вонах (решение
// владельца 27.08.2026). То есть воны на карточке — это уже НЕ цена объявления
// Encar, а наша цена. Следствия, которые легко пропустить:
//   • JSON-LD Offer (priceCurrency KRW) обязан нести ту же сумму, что видит
//     посетитель, — иначе Google получает одну цену, а клиент другую;
//   • цена в title/description карточки идёт отсюда же;
//   • перечёркнутая цена проданной машины — тоже, иначе «было/стало» врёт;
//   • калькулятор растаможки НЕ трогаем (решение владельца 27.08.2026): база
//     таможни — стоимость сделки, стояночный сбор в неё не входит.
//
// ⚠️ Никаких локальных формул цены в компонентах. Ровно этот класс обхода уже
// стоил проекта: FavoritesClient объявлял свою formatUsd и показывал цены ниже
// каталога (см. CLAUDE.md, «Цены и курсы»). Нужна цена авто — только отсюда.

/**
 * Стояночный сбор, воны. Фикс на любую машину, независимо от цены и срока.
 *
 * ⚠️ NEXT_PUBLIC_ обязателен: цену считает и сервер (метаданные, JSON-LD,
 * телеграм), и клиент (карточки каталога) — значение должно попасть в бандл.
 *
 * ⚠️ Дефолт в коде НЕ декоративный. Прод собирает Coolify со своим окружением,
 * и `.env` из репозитория туда не едет: не заведи переменную в панели — пустое
 * значение молча обнулило бы сбор на всём сайте, а внешне это выглядит как
 * «просто цены чуть ниже». Поэтому 440 000 живут и здесь.
 */
const DEFAULT_CAR_STORAGE_FEE_KRW = 440_000;

export const CAR_STORAGE_FEE_KRW = Math.max(
  0,
  Number(process.env.NEXT_PUBLIC_CAR_STORAGE_FEE_KRW) || DEFAULT_CAR_STORAGE_FEE_KRW,
);

/**
 * Сырая цена Encar → воны.
 *
 * Encar везде отдаёт 만원 (10 000 вон): и `Price` в листинге, и
 * `advertisement.price` в карточке, и `price_manwon` в снимке cars_seen.
 * Тип при этом гуляет — в листинге объявлен `string`, а приходит число.
 *
 * ⚠️ Поэтому строка и число трактуются ОДИНАКОВО. Прежний `convertNumber`
 * множил строку на 1000, а число на 10000, и цена из избранного (там она
 * хранится через `String(car.Price)`) выходила в десять раз ниже настоящей.
 */
export function encarToKrw(raw: string | number | null | undefined): number {
  const manwon = typeof raw === "string" ? Number(raw.replace(/[^\d.]/g, "")) : Number(raw);
  if (!Number.isFinite(manwon) || manwon <= 0) return 0;
  return manwon * 10_000;
}

/**
 * Итоговая цена для клиента, воны: цена Encar + стояночный сбор.
 *
 * У машины без внятной цены сбор НЕ прибавляется: «цена = один стояночный
 * сбор» — заведомая бессмыслица, лучше отдать 0 и дать вызывающему скрыть блок.
 */
export function carPriceKrw(raw: string | number | null | undefined): number {
  const base = encarToKrw(raw);
  return base > 0 ? base + CAR_STORAGE_FEE_KRW : 0;
}

/** Итоговая цена вонами, готовая строка: «21 350 000». */
export function formatCarKrw(raw: string | number | null | undefined): string {
  return carPriceKrw(raw).toLocaleString("ru-RU");
}

/** Курс, который нужен для показа цены. Приходит с сервера, см. kbFx.ts. */
export interface CarDisplayRates {
  krwToRub?: number;
  krwToUsd?: number;
}

export interface ConvertedCarPrice {
  /** Уже с разделителями разрядов под нужную локаль. */
  value: string;
  /** «₽» или «$». */
  symbol: string;
}

/**
 * Справочная цена под главной: ₽ на ru, $ на остальных языках.
 *
 * `ko` исключён намеренно — локаль отключена (301 → /en), а каталог авто для
 * Кореи закрыт; показывать там воны в долларах незачем.
 *
 * Возвращает `null`, когда показывать нечего: нет цены или не доехал курс.
 * Молчаливой константы-курса тут нет и быть не может (CLAUDE.md).
 */
export function convertedCarPrice(
  raw: string | number | null | undefined,
  lang: string,
  rates: CarDisplayRates,
): ConvertedCarPrice | null {
  const krw = carPriceKrw(raw);
  if (krw <= 0) return null;

  if (lang === "ru" && rates.krwToRub) {
    return { value: Math.round(krw * rates.krwToRub).toLocaleString("ru-RU"), symbol: "₽" };
  }
  if (lang !== "ko" && lang !== "ru" && rates.krwToUsd) {
    return { value: Math.round(krw * rates.krwToUsd).toLocaleString("en-US"), symbol: "$" };
  }
  return null;
}

/** Цена в долларах числом — для JSON-LD, телеграма и писем. */
export function carPriceUsd(
  raw: string | number | null | undefined,
  krwToUsd: number | undefined,
): number | null {
  const krw = carPriceKrw(raw);
  if (krw <= 0 || !krwToUsd) return null;
  return Math.round(krw * krwToUsd);
}

/** Цена в рублях числом — для сниппета ru и телеграма. */
export function carPriceRub(
  raw: string | number | null | undefined,
  krwToRub: number | undefined,
): number | null {
  const krw = carPriceKrw(raw);
  if (krw <= 0 || !krwToRub) return null;
  return Math.round(krw * krwToRub);
}
