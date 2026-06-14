const FALLBACK_KRW_TO_RUB = 0.058; // ~1 KRW = 0.058 RUB (June 2026)
const FALLBACK_KRW_TO_USD = 0.00066; // ~1 KRW = 0.00066 USD (June 2026)

export interface CurrencyRates {
  krwToRub: number;
  krwToUsd: number;
  updatedAt: string;
}

export async function getCurrencyRates(): Promise<CurrencyRates> {
  try {
    const res = await fetch(
      "https://api.frankfurter.dev/v1/latest?from=KRW&to=RUB,USD",
      { next: { revalidate: 86400 } } // кеш 24 часа
    );

    if (!res.ok) throw new Error("Currency API error");

    const data = await res.json();

    return {
      krwToRub: data.rates?.RUB ?? FALLBACK_KRW_TO_RUB,
      krwToUsd: data.rates?.USD ?? FALLBACK_KRW_TO_USD,
      updatedAt: data.date ?? new Date().toISOString().slice(0, 10),
    };
  } catch {
    return {
      krwToRub: FALLBACK_KRW_TO_RUB,
      krwToUsd: FALLBACK_KRW_TO_USD,
      updatedAt: "fallback",
    };
  }
}

// Конвертирует сырую цену из API в KRW
export function toKrw(price: string | number): number {
  return typeof price === "number"
    ? price * 10000
    : Number(price) * 1000;
}
