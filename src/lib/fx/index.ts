/**
 * ЕДИНСТВЕННЫЙ вход за курсами валют на сайте. Правила — `./CLAUDE.md`.
 *
 * Курс — не одно число: у задач разные курсы по делу, поэтому наружу отдаются
 * три именованных вида, собранные из одних и тех же загрузок источников:
 *
 * - `market`  — рыночный (ЦБ РФ + frankfurter): запчасти, справочные ₽/$;
 * - `car`     — банковский покупной Кукмин-банка: цены авто и инвойс;
 * - `customs` — десять валют «за 1 USD» (open.er-api + ЦБ РФ): растаможка.
 *
 * Ни один вид исключений не бросает: при отказе источника — следующий
 * источник или вшитый снимок, и каждое падение на фолбэк пишется в лог.
 */
import { getCarRates } from "@/lib/fx/views/car";
import { getCustomsRates } from "@/lib/fx/views/customs";
import { getMarketRates } from "@/lib/fx/views/market";
import type { CarRates, CurrencyRates, FxKind, Rates } from "@/lib/fx/types";

export function getFx(kind: "market"): Promise<CurrencyRates>;
export function getFx(kind: "car"): Promise<CarRates>;
export function getFx(kind: "customs"): Promise<Rates>;
export function getFx(kind: FxKind): Promise<CurrencyRates | CarRates | Rates> {
  switch (kind) {
    case "market":
      return getMarketRates();
    case "car":
      return getCarRates();
    case "customs":
      return getCustomsRates();
  }
}

export { getMarketRates, getCarRates, getCustomsRates };
export { getKbRates } from "@/lib/fx/views/car";
export {
  TRACKED_CURRENCIES,
  SOURCE_LABELS,
  rateBetween,
  formatRateValue,
} from "@/lib/fx/types";
export type {
  CarRates,
  CurrencyCode,
  CurrencyRates,
  FxKind,
  KbRates,
  ProviderRates,
  RateSource,
  Rates,
} from "@/lib/fx/types";
export { FX_SNAPSHOT } from "@/lib/fx/snapshot";
