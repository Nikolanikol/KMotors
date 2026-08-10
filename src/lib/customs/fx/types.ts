/**
 * Типы слоя курсов.
 *
 * Все курсы держим в одном виде — «сколько единиц валюты за 1 USD».
 * Доллар выбран базой не из принципа, а потому что оба провайдера умеют его
 * отдавать напрямую: у open.er-api.com это базовая валюта, у ЦБ РФ доллар
 * есть в общем списке и через него считается кросс. Любая пара получается
 * делением, отдельных запросов «пара к паре» не нужно.
 */

/** Валюты, которые нужны калькуляторам. */
export const TRACKED_CURRENCIES = [
  "USD",
  "EUR",
  "KRW",
  "ALL",
  "GEL",
  "AMD",
  "KGS",
] as const;

export type CurrencyCode = (typeof TRACKED_CURRENCIES)[number];

export type RateSource = "erapi" | "cbr" | "fallback";

export const SOURCE_LABELS: Record<RateSource, string> = {
  erapi: "open.er-api.com",
  cbr: "ЦБ РФ",
  fallback: "вшитый снимок",
};

/** Ответ одного провайдера. Валюта может отсутствовать — это нормально. */
export interface ProviderRates {
  source: RateSource;
  /** ISO-дата «2026-08-09», к которой относятся курсы. */
  asOf: string;
  perUsd: Partial<Record<CurrencyCode, number>>;
}

/** Готовый набор курсов. Заполнен всегда: пробелы закрывает вшитый снимок. */
export interface Rates {
  perUsd: Record<CurrencyCode, number>;
  /** Откуда пришла каждая валюта — чтобы не выдавать снимок за живой курс. */
  sources: Record<CurrencyCode, RateSource>;
  /** Самая старая дата среди использованных источников. */
  asOf: string;
  /** Хотя бы одна валюта взята из вшитого снимка. */
  degraded: boolean;
}

/**
 * Курс одной валюты к другой: сколько `to` за единицу `from`.
 *
 * Возвращает null, если какой-то из курсов нулевой или отсутствует —
 * вызывающий сам решает, что показать. Молча подставлять единицу нельзя:
 * это выглядело бы как настоящий курс.
 */
export function rateBetween(
  rates: Rates,
  from: CurrencyCode,
  to: CurrencyCode,
): number | null {
  if (from === to) return 1;
  const fromPerUsd = rates.perUsd[from];
  const toPerUsd = rates.perUsd[to];
  if (!fromPerUsd || !toPerUsd) return null;
  return toPerUsd / fromPerUsd;
}

/** Курс для подстановки в поле формы. Шесть значащих цифр хватает и воне, и лари. */
export function formatRateValue(value: number): string {
  return String(Number(value.toPrecision(6)));
}
