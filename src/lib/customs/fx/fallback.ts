import type { CurrencyCode, ProviderRates } from "@/lib/customs/fx/types";

/**
 * Вшитый снимок курсов — последний уровень деградации.
 *
 * Используется, только когда оба провайдера недоступны или отдали мусор.
 * Курсы, взятые отсюда, помечаются источником `fallback`, и интерфейс обязан
 * это показывать: выдавать снимок полугодовой давности за живой курс нельзя.
 *
 * Значения сняты с open.er-api.com 10.08.2026 (`time_last_update_utc`:
 * Mon, 10 Aug 2026 00:02:31 +0000). Снимок обновлён целиком, а не дополнен
 * тремя новыми валютами: даты вразнобой в одном наборе означали бы, что
 * подпись «данные на …» врёт про часть курсов.
 *
 * Обновлять вручную вместе со сверкой ставок.
 */
export const FALLBACK_AS_OF = "2026-08-10";

export const FALLBACK_PER_USD: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.865507,
  KRW: 1409.640365,
  ALL: 80.734271,
  GEL: 2.61527,
  AMD: 366.050039,
  KGS: 87.474596,
  RUB: 81.969182,
  KZT: 468.321957,
  UZS: 11851.454593,
};

export const fallbackRates: ProviderRates = {
  source: "fallback",
  asOf: FALLBACK_AS_OF,
  perUsd: FALLBACK_PER_USD,
};
