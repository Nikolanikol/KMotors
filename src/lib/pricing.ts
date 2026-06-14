export const PRICE_MARKUP = 1.23;

const usdFormatter = new Intl.NumberFormat("en-US");

export function formatUsd(priceKrw: number, krwToUsd: number): string {
  return "$" + usdFormatter.format(Math.ceil(priceKrw * krwToUsd * PRICE_MARKUP));
}

export function krwToDisplayUsd(priceKrw: number, krwToUsd: number): number {
  return Math.ceil(priceKrw * krwToUsd * PRICE_MARKUP);
}
