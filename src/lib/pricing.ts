// Ценообразование запчастей.
//
// В БД лежит ЧИСТАЯ цена в вонах (колонка price_krw) — без каких-либо наценок.
// Финальная цена для покупателя собирается так:
//
//   продажа_KRW = (price_krw × маржа(price_krw) + фикс(price_krw)) × буфер_оплаты
//   продажа_USD = ceil( продажа_KRW × курс_KRW→USD )   // округление вверх до целого доллара
//
//  • маржа и фикс задаются ПО ТИЕРАМ цены товара — у каждого ценового диапазона
//    свой процент И свой фикс. Это даёт гибкость: на копеечных деталях можно поставить
//    маленький (или нулевой) фикс + повыше процент, чтобы цена не раздувалась, а полный
//    фикс внутренней логистики включать только с более дорогих позиций.
//  • буфер_оплаты — комиссия приёма платежа (инвойс/PayPal) + запас на конвертацию.
//
// Все параметры вынесены в env. Префикс NEXT_PUBLIC_ обязателен — цена считается
// и на сервере (checkout), и на клиенте (карточки, фильтр), поэтому значения
// должны попадать в клиентский бандл.
//
//   NEXT_PUBLIC_PARTS_PAYMENT_BUFFER  множитель буфера комиссии оплаты   (напр. 1.06 = +6%)
//   NEXT_PUBLIC_PARTS_FIXED_FEE_KRW   фикс по умолчанию, вон — для тиеров, где фикс не указан явно
//   NEXT_PUBLIC_PARTS_MARGIN_TIERS    тиеры "верхняя_граница_вон:множитель[:фикс_вон], ..." по возрастанию;
//                                     товар берёт первый тиер, под чью границу попадает его цена.
//                                     Третье число (фикс) необязательно — если опущено, берётся
//                                     NEXT_PUBLIC_PARTS_FIXED_FEE_KRW.
//                                     Пример: "10000:1.4:1500,30000:1.32:3500,100000:1.26,999999999:1.2"

interface MarginTier {
  /** Верхняя граница цены товара в вонах (не включительно). */
  maxKrw: number;
  /** Множитель маржи для этого диапазона (1.4 = +40%). */
  multiplier: number;
  /** Фикс-надбавка для этого диапазона, вон (доставка/упаковка). */
  fixedKrw: number;
}

// Значения по умолчанию — используются, если соответствующая env-переменная не задана.
const DEFAULT_FIXED_FEE_KRW = 5000;
const DEFAULT_PAYMENT_BUFFER = 1.06;
// Дешёвые товары: маленький фикс + выше процент, чтобы цена не раздувалась.
// Дорогие: полный фикс + процент ниже.
const DEFAULT_MARGIN_TIERS =
  "5000:1.45:2000,10000:1.4:3000,30000:1.35:3500,100000:1.28:5000,999999999:1.22:8000";

export const PARTS_FIXED_FEE_KRW =
  Number(process.env.NEXT_PUBLIC_PARTS_FIXED_FEE_KRW) || DEFAULT_FIXED_FEE_KRW;

export const PARTS_PAYMENT_BUFFER =
  Number(process.env.NEXT_PUBLIC_PARTS_PAYMENT_BUFFER) || DEFAULT_PAYMENT_BUFFER;

function parseMarginTiers(raw: string | undefined): MarginTier[] {
  const tiers = (raw ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [maxRaw, multRaw, fixedRaw] = part.split(":");
      const fixed = Number(fixedRaw);
      return {
        maxKrw: Number(maxRaw),
        multiplier: Number(multRaw),
        // Фикс необязателен: если не указан/битый — берём глобальный дефолт.
        fixedKrw: Number.isFinite(fixed) && fixed >= 0 ? fixed : PARTS_FIXED_FEE_KRW,
      };
    })
    .filter((t) => Number.isFinite(t.maxKrw) && Number.isFinite(t.multiplier) && t.multiplier > 0)
    .sort((a, b) => a.maxKrw - b.maxKrw);

  // При пустой/битой строке откатываемся к дефолтам.
  return tiers.length ? tiers : parseMarginTiers(DEFAULT_MARGIN_TIERS);
}

export const PARTS_MARGIN_TIERS = parseMarginTiers(process.env.NEXT_PUBLIC_PARTS_MARGIN_TIERS);

/** Тиер (множитель + фикс) для конкретной цены товара (вон). */
export function tierFor(priceKrw: number): MarginTier {
  for (const tier of PARTS_MARGIN_TIERS) {
    if (priceKrw < tier.maxKrw) return tier;
  }
  return PARTS_MARGIN_TIERS[PARTS_MARGIN_TIERS.length - 1];
}

/** Итоговая цена продажи в вонах: маржа + фикс + буфер оплаты (до конвертации в USD). */
export function sellingKrw(priceKrw: number): number {
  const tier = tierFor(priceKrw);
  return (priceKrw * tier.multiplier + tier.fixedKrw) * PARTS_PAYMENT_BUFFER;
}

/** Финальная цена в USD — целое число долларов, округление вверх. */
export function krwToDisplayUsd(priceKrw: number, krwToUsd: number): number {
  return Math.ceil(sellingKrw(priceKrw) * krwToUsd);
}

const usdFormatter = new Intl.NumberFormat("en-US");

export function formatUsd(priceKrw: number, krwToUsd: number): string {
  return "$" + usdFormatter.format(krwToDisplayUsd(priceKrw, krwToUsd));
}

/**
 * Обратная конвертация: отображаемая цена в USD → приблизительная цена товара в вонах.
 * Нужна для фильтра по цене — пользователь задаёт диапазон в USD, а запрос к БД идёт
 * по чистой price_krw. Инвертируем формулу sellingKrw по тиерам.
 */
export function displayUsdToKrw(targetUsd: number, krwToUsd: number): number {
  if (!(krwToUsd > 0)) return 0;

  const sellKrw = targetUsd / krwToUsd; // целевая цена продажи в вонах

  // Ищем тиер, при чьих (множитель, фикс) получившаяся price_krw попадает в его диапазон.
  for (const tier of PARTS_MARGIN_TIERS) {
    const priceKrw = (sellKrw / PARTS_PAYMENT_BUFFER - tier.fixedKrw) / tier.multiplier;
    if (priceKrw < tier.maxKrw) return Math.max(0, Math.round(priceKrw));
  }
  const last = PARTS_MARGIN_TIERS[PARTS_MARGIN_TIERS.length - 1];
  return Math.max(0, Math.round((sellKrw / PARTS_PAYMENT_BUFFER - last.fixedKrw) / last.multiplier));
}
