// Курсы воны для витрины: ₽ на ru, $ на остальных языках.
//
// ⚠️ Источники РАЗНЫЕ, и это не случайность. Раньше оба курса брались одним
// запросом с frankfurter.dev — но RUB там нет вообще (его нет в списке валют
// /v1/currencies, ответ на ?to=RUB,USD приходит с одним USD). Из-за этого
// `data.rates?.RUB ?? FALLBACK` срабатывал НЕ иногда при сбое, а каждый раз, и
// рублёвая цена по всему сайту считалась по константе июня 2026: 0.058 против
// реальных 0.0537 на 29.07.2026, то есть завышение на 8% на карточках, в
// избранном и в рублёвых сниппетах Google.
//
// Поэтому рубль берётся у ЦБ РФ (там KRW есть напрямую и это к тому же
// официальный курс для российского покупателя), доллар остаётся у frankfurter.
// Не сводить обратно к одному источнику, не проверив, что он отдаёт ОБЕ валюты.

// Фолбэки — на случай, когда источник недоступен. Держать близкими к реальности
// и датировать: молчаливое расхождение здесь дороже, чем кажется.
const FALLBACK_KRW_TO_RUB = 0.0609; // ЦБ РФ, 27.08.2026
const FALLBACK_KRW_TO_USD = 0.00072; // frankfurter, 26.08.2026
const FALLBACK_RUB_TO_USD = 1 / 84.28; // ЦБ РФ, 27.08.2026

export interface CurrencyRates {
  krwToRub: number;
  krwToUsd: number;
  /**
   * Рубли → доллары. Нужен там, где цена ЗАДАНА в рублях, а показать её надо в
   * долларах: бейдж «цена под ключ» на модельных страницах. К ценам Encar
   * отношения не имеет — те живут в вонах и считаются курсом KB (`kbFx.ts`).
   */
  rubToUsd: number;
  updatedAt: string;
}

/** Рублей за единицу валюты: Value приходит за Nominal (у KRW обычно 1000). */
function perUnit(valute: unknown): number | null {
  const v = valute as { Value?: unknown; Nominal?: unknown } | undefined;
  const value = Number(v?.Value);
  const nominal = Number(v?.Nominal);
  if (!Number.isFinite(value) || !Number.isFinite(nominal) || nominal <= 0) return null;
  return value / nominal;
}

/**
 * ЦБ РФ одним запросом отдаёт ВСЕ валюты, поэтому и KRW→RUB, и RUB→USD берутся
 * из одного ответа: второго похода в сеть здесь нет, а `revalidate` общий.
 */
async function fetchCbrRates(): Promise<{
  krwToRub: number | null;
  rubToUsd: number | null;
  date: string;
} | null> {
  try {
    const res = await fetch("https://www.cbr-xml-daily.ru/daily_json.js", {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`CBR ${res.status}`);
    const data = await res.json();

    const krwToRub = perUnit(data?.Valute?.KRW);
    // ЦБ котирует «рублей за доллар» — нам нужна обратная величина.
    const rubPerUsd = perUnit(data?.Valute?.USD);

    return {
      krwToRub,
      rubToUsd: rubPerUsd && rubPerUsd > 0 ? 1 / rubPerUsd : null,
      date: String(data?.Date ?? "").slice(0, 10),
    };
  } catch {
    return null;
  }
}

/** KRW→USD от frankfurter. Эту валюту он отдаёт исправно. */
async function fetchKrwToUsd(): Promise<{ rate: number; date: string } | null> {
  try {
    const res = await fetch("https://api.frankfurter.dev/v1/latest?from=KRW&to=USD", {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`frankfurter ${res.status}`);
    const data = await res.json();
    const rate = Number(data?.rates?.USD);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    return { rate, date: String(data?.date ?? "") };
  } catch {
    return null;
  }
}

/**
 * Никогда не бросает исключение: цена важнее точности источника. Источники
 * опрашиваются параллельно и независимо — падение одного не роняет второй.
 */
export async function getCurrencyRates(): Promise<CurrencyRates> {
  const [cbr, usd] = await Promise.all([fetchCbrRates(), fetchKrwToUsd()]);

  // Падение на фолбэк ЛОГИРУЕТСЯ поимённо: молча подставленная константа — это
  // не подстраховка, а место, где расхождение цен становится невидимым.
  const stale: string[] = [];
  if (!cbr?.krwToRub) stale.push("KRW→RUB (ЦБ РФ)");
  if (!cbr?.rubToUsd) stale.push("RUB→USD (ЦБ РФ)");
  if (!usd?.rate) stale.push("KRW→USD (frankfurter)");
  if (stale.length) {
    console.error("[currency] курс на фолбэке, цены могут расходиться:", stale.join(", "));
  }

  return {
    krwToRub: cbr?.krwToRub ?? FALLBACK_KRW_TO_RUB,
    krwToUsd: usd?.rate ?? FALLBACK_KRW_TO_USD,
    rubToUsd: cbr?.rubToUsd ?? FALLBACK_RUB_TO_USD,
    updatedAt: cbr?.date || usd?.date || "fallback",
  };
}

// Конвертирует сырую цену из API в KRW
export function toKrw(price: string | number): number {
  return typeof price === "number"
    ? price * 10000
    : Number(price) * 1000;
}
