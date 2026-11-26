import type { CurrencyCode, CurrencyRates, ProviderRates } from "@/lib/fx/types";

/**
 * Вшитый снимок курсов — ОДИН файл на весь сайт, но у каждого вида свой
 * датированный блок: таможенный (`FX_SNAPSHOT`) и рыночный (`MARKET_SNAPSHOT`,
 * им же пользуется авто-вид на фолбэке). Других констант курса в коде нет и
 * быть не должно (CLAUDE.md, «Цены и курсы»).
 *
 * Ниже — таможенный блок.
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
 * Рыночный блок снимка — фолбэк рыночного и (через него) авто-вида.
 *
 * Свой блок, а не кросс из таможенного: значения и даты перенесены из прежнего
 * `utils/getCurrencyRates.ts` (удалён 26.11.2026) без изменений, чтобы цены на фолбэке остались
 * прежними. Таможенный блок старше (10.08 против 26–27.08.2026), и вывод из
 * него сдвинул бы рубль на −4.5%. Свести блоки в один — решение владельца,
 * вместе с обновлением снимка. Обновлять блок целиком и с датами.
 */
export const MARKET_SNAPSHOT = {
  krwToRub: { value: 0.0609, asOf: "2026-08-27", source: "ЦБ РФ" },
  krwToUsd: { value: 0.00072, asOf: "2026-08-26", source: "frankfurter" },
  rubToUsd: { value: 1 / 84.28, asOf: "2026-08-27", source: "ЦБ РФ" },
} as const;

/** Рыночный блок в форме вида. */
export const snapshotMarket: Omit<CurrencyRates, "updatedAt"> = {
  krwToRub: MARKET_SNAPSHOT.krwToRub.value,
  krwToUsd: MARKET_SNAPSHOT.krwToUsd.value,
  rubToUsd: MARKET_SNAPSHOT.rubToUsd.value,
};
