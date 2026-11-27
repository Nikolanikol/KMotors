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
 * Значения сняты с open.er-api.com 27.11.2026 (`time_last_update_utc`:
 * Fri, 27 Nov 2026 00:02:31 +0000). Обновлять ЦЕЛИКОМ и с датой: даты
 * вразнобой в одном наборе означали бы, что подпись «данные на …» врёт про
 * часть курсов.
 */
export const FX_SNAPSHOT = {
  source: "open.er-api.com",
  asOf: "2026-11-27",
  perUsd: {
    USD: 1,
    EUR: 0.911313,
    KRW: 1343.841909,
    ALL: 81.898388,
    GEL: 2.590689,
    AMD: 360.238589,
    KGS: 87.446556,
    RUB: 82.133199,
    KZT: 457.685748,
    UZS: 11966.840025,
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
 * Свой блок, а не кросс из таможенного: источники у видов разные (ЦБ РФ и
 * frankfurter против open.er-api). Обновлён 27.11.2026 (шаг 23, решение владельца)
 * вместе с таможенным, значения — без округления, как отдают источники (прежние
 * 0.00072 и 0.0609 были округлены грубо). Свести блоки в один — решение владельца,
 * не принято. Обновлять блок целиком и с датами.
 *
 * Авто-вид своего снимка не имеет: при недоступности Кукмин-банка берёт рыночный
 * (`views/car.ts`), то есть этот блок.
 */
export const MARKET_SNAPSHOT = {
  krwToRub: { value: 0.0611106, asOf: "2026-11-27", source: "ЦБ РФ" },
  krwToUsd: { value: 0.00074369, asOf: "2026-11-26", source: "frankfurter" },
  rubToUsd: { value: 1 / 82.1265, asOf: "2026-11-27", source: "ЦБ РФ" },
} as const;

/** Рыночный блок в форме вида. */
export const snapshotMarket: Omit<CurrencyRates, "updatedAt"> = {
  krwToRub: MARKET_SNAPSHOT.krwToRub.value,
  krwToUsd: MARKET_SNAPSHOT.krwToUsd.value,
  rubToUsd: MARKET_SNAPSHOT.rubToUsd.value,
};
