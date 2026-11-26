/**
 * Типы слоя курсов — общие для всех трёх видов курса.
 *
 * Формы объектов перенесены из прежних модулей ОДИН В ОДИН
 * (`utils/getCurrencyRates.ts`, `lib/kbFx.ts`, `lib/customs/fx/types.ts`):
 * потребители их деструктурируют, и любое переименование поля — это молчаливый
 * `undefined` в цене, которого tsc местами не увидит (данные идут пропсом).
 */

// ── Рыночный вид (запчасти, справочные ₽/$, модельные страницы) ─────────────

export interface CurrencyRates {
  krwToRub: number;
  krwToUsd: number;
  /**
   * Рубли → доллары. Нужен там, где цена ЗАДАНА в рублях, а показать её надо в
   * долларах: бейдж «цена под ключ» на модельных страницах. К ценам Encar
   * отношения не имеет — те живут в вонах и считаются банковским видом.
   */
  rubToUsd: number;
  updatedAt: string;
}

// ── Банковский вид для авто (Кукмин-банк) ───────────────────────────────────

export interface KbRates {
  /** Множитель: воны × krwToUsd = доллары. */
  krwToUsd: number;
  /** Множитель: воны × krwToRub = рубли. */
  krwToRub: number;
  /** Отметка котировки KB, «2026.08.27 19:29:01» — для логов и отладки. */
  quotedAt: string;
  /** Номер котировки за день (회차). KB публикует их сотнями. */
  round: string;
}

/** Курс с пометкой, откуда он взялся: расхождение цен иначе не диагностируется. */
export interface CarRates {
  krwToUsd: number;
  krwToRub: number;
  source: "kb" | "market";
  /** Отметка котировки KB либо дата рыночного источника. */
  updatedAt: string;
}

// ── Таможенный вид (калькулятор растаможки, 10 валют) ───────────────────────

/**
 * Все таможенные курсы держим в одном виде — «сколько единиц валюты за 1 USD».
 * Доллар выбран базой потому, что оба провайдера умеют его отдавать напрямую:
 * у open.er-api.com это базовая валюта, у ЦБ РФ доллар есть в общем списке и
 * через него считается кросс. Любая пара получается делением.
 */
export const TRACKED_CURRENCIES = [
  "USD",
  "EUR",
  "KRW",
  "ALL",
  "GEL",
  "AMD",
  "KGS",
  // Россия, Казахстан, Узбекистан — добавлены при слиянии двух калькуляторов
  // в один. Оба провайдера их котируют; у ЦБ РФ рубль — база, поэтому там
  // он берётся особым случаем, см. sources/cbr.ts.
  "RUB",
  "KZT",
  "UZS",
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

/** Какой вид курса нужен вызывающему. */
export type FxKind = "market" | "car" | "customs";
