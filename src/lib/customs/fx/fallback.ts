import type { CurrencyCode, ProviderRates } from "@/lib/customs/fx/types";

/**
 * Вшитый снимок курсов — последний уровень деградации.
 *
 * Используется, только когда оба провайдера недоступны или отдали мусор.
 * Курсы, взятые отсюда, помечаются источником `fallback`, и интерфейс обязан
 * это показывать: выдавать снимок полугодовой давности за живой курс нельзя.
 *
 * Значения сняты с open.er-api.com 09.08.2026 (`time_last_update_utc`:
 * Sun, 09 Aug 2026 00:02:31 +0000). Обновлять вручную вместе со сверкой ставок.
 */
export const FALLBACK_AS_OF = "2026-08-09";

export const FALLBACK_PER_USD: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.865939,
  KRW: 1412.197474,
  ALL: 80.785937,
  GEL: 2.619746,
  AMD: 366.081469,
  KGS: 87.487992,
};

export const fallbackRates: ProviderRates = {
  source: "fallback",
  asOf: FALLBACK_AS_OF,
  perUsd: FALLBACK_PER_USD,
};
