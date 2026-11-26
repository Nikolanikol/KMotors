import type { CurrencyCode, CurrencyRates, ProviderRates } from "@/lib/fx/types";

/**
 * ЕДИНСТВЕННЫЙ вшитый снимок курсов на весь сайт — последний уровень
 * деградации для всех трёх видов курса. Других констант курса в коде нет и
 * быть не должно (CLAUDE.md, «Цены и курсы»).
 *
 * Берётся, только когда живые источники недоступны или отдали мусор, и каждое
 * такое падение логируется (`log.ts`). Выдавать снимок за живой курс нельзя:
 * таможенный вид помечает такие валюты источником `fallback`, рыночный —
 * `updatedAt: "fallback"`.
 *
 * Значения сняты с open.er-api.com 10.08.2026 (`time_last_update_utc`:
 * Mon, 10 Aug 2026 00:02:31 +0000). Обновлять ЦЕЛИКОМ и с датой: даты
 * вразнобой в одном наборе означали бы, что подпись «данные на …» врёт про
 * часть курсов.
 */
export const FX_SNAPSHOT = {
  source: "open.er-api.com",
  asOf: "2026-08-10",
  perUsd: {
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
  } satisfies Record<CurrencyCode, number>,
} as const;

/** Снимок в форме ответа провайдера — для таможенного вида. */
export const snapshotProviderRates: ProviderRates = {
  source: "fallback",
  asOf: FX_SNAPSHOT.asOf,
  perUsd: FX_SNAPSHOT.perUsd,
};

/**
 * Снимок в форме рыночного вида. Пары выводятся кроссом через доллар из того
 * же набора, а не хранятся отдельными числами: иначе это был бы второй снимок
 * со своей датой.
 */
export const snapshotMarket: Omit<CurrencyRates, "updatedAt"> = {
  krwToUsd: 1 / FX_SNAPSHOT.perUsd.KRW,
  krwToRub: FX_SNAPSHOT.perUsd.RUB / FX_SNAPSHOT.perUsd.KRW,
  rubToUsd: 1 / FX_SNAPSHOT.perUsd.RUB,
};
