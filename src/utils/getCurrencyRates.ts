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
const FALLBACK_KRW_TO_RUB = 0.0537; // ЦБ РФ, 29.07.2026
const FALLBACK_KRW_TO_USD = 0.00069; // frankfurter, 28.07.2026

export interface CurrencyRates {
  krwToRub: number;
  krwToUsd: number;
  updatedAt: string;
}

/** KRW→RUB от ЦБ РФ. Valute.KRW приходит как Value за Nominal (обычно 1000). */
async function fetchKrwToRub(): Promise<{ rate: number; date: string } | null> {
  try {
    const res = await fetch("https://www.cbr-xml-daily.ru/daily_json.js", {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`CBR ${res.status}`);
    const data = await res.json();
    const krw = data?.Valute?.KRW;
    const value = Number(krw?.Value);
    const nominal = Number(krw?.Nominal);
    if (!Number.isFinite(value) || !Number.isFinite(nominal) || nominal <= 0) return null;
    return { rate: value / nominal, date: String(data?.Date ?? "").slice(0, 10) };
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
  const [rub, usd] = await Promise.all([fetchKrwToRub(), fetchKrwToUsd()]);

  return {
    krwToRub: rub?.rate ?? FALLBACK_KRW_TO_RUB,
    krwToUsd: usd?.rate ?? FALLBACK_KRW_TO_USD,
    updatedAt:
      rub?.date || usd?.date || "fallback",
  };
}

// Конвертирует сырую цену из API в KRW
export function toKrw(price: string | number): number {
  return typeof price === "number"
    ? price * 10000
    : Number(price) * 1000;
}
