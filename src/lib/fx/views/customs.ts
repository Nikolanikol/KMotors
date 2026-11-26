import { logFallback, logSourceDown } from "@/lib/fx/log";
import { snapshotProviderRates } from "@/lib/fx/snapshot";
import { loadCbr, parseCbrPayload, type CbrQuote } from "@/lib/fx/sources/cbr";
import { loadErApi } from "@/lib/fx/sources/erapi";
import {
  TRACKED_CURRENCIES,
  type CurrencyCode,
  type ProviderRates,
  type Rates,
  type RateSource,
} from "@/lib/fx/types";

/**
 * Таможенный вид: десять валют «за 1 USD» для калькулятора растаможки.
 * Курс сделки, а не наш банковский: таможня считает свою базу сама.
 */

/**
 * Только серверный код: браузер сюда не ходит — иначе начались бы
 * CORS-сюрпризы, лимиты провайдеров разъехались бы по клиентам, а курс не
 * попадал бы в HTML первого ответа. Пакета `server-only` в проекте нет,
 * поэтому граница держится проверкой во время выполнения.
 */
function assertServer(): void {
  if (typeof window !== "undefined") {
    throw new Error("getRates вызван в браузере: слой курсов только серверный");
  }
}

/**
 * Ответ ЦБ в форме провайдера таможенного вида: «единиц за 1 USD» кроссом
 * через доллар. Без доллара кросс не построить — ответ негоден целиком.
 */
export function cbrToProviderRates(quote: CbrQuote): ProviderRates {
  const rubPerUsd = quote.rubPerUnit.USD;
  if (!rubPerUsd) {
    throw new Error("ЦБ РФ: в ответе нет курса USD, кросс не построить");
  }

  // Рубль у ЦБ — база, отдельной записи в Valute для него нет. Курс «рублей
  // за доллар» и есть то, что мы уже прочитали; без этого случая RUB молча
  // уходил бы в фолбэк, хотя источник его знает лучше всех.
  const perUsd: Partial<Record<CurrencyCode, number>> = { USD: 1, RUB: rubPerUsd };
  for (const code of TRACKED_CURRENCIES) {
    if (code === "USD" || code === "RUB") continue;
    const rubPerUnit = quote.rubPerUnit[code];
    if (rubPerUnit) perUsd[code] = rubPerUsd / rubPerUnit;
  }

  return { source: "cbr", asOf: quote.asOf, perUsd };
}

/** Сырой ответ ЦБ → провайдер таможенного вида. Бросает на негодном ответе. */
export function parseCbr(payload: unknown): ProviderRates {
  return cbrToProviderRates(parseCbrPayload(payload));
}

/**
 * Порядок приоритета. Первый, у кого валюта есть, тот её и даёт.
 *
 * open.er-api идёт первым, потому что он единственный котирует лек и
 * покрывает все нужные валюты одним запросом. ЦБ РФ закрывает всё, кроме
 * лека, и подстраховывает на случай, если основной провайдер отвалится.
 */
const PRIORITY: RateSource[] = ["erapi", "cbr", "fallback"];

/**
 * Сборка итогового набора из ответов провайдеров. Чистая функция: пробелы
 * закрывает вшитый снимок, поэтому результат заполнен всегда.
 */
export function mergeRates(results: ProviderRates[]): Rates {
  const bySource = new Map<RateSource, ProviderRates>();
  for (const result of results) bySource.set(result.source, result);
  bySource.set("fallback", snapshotProviderRates);

  const perUsd = {} as Record<CurrencyCode, number>;
  const sources = {} as Record<CurrencyCode, RateSource>;
  const usedSources = new Set<RateSource>();

  for (const code of TRACKED_CURRENCIES) {
    for (const source of PRIORITY) {
      const value = bySource.get(source)?.perUsd[code];
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        perUsd[code] = value;
        sources[code] = source;
        usedSources.add(source);
        break;
      }
    }
  }

  // Показываем самую старую дату среди реально использованных источников:
  // так подпись не выглядит свежее, чем самый несвежий курс в наборе.
  const dates = [...usedSources]
    .map((source) => bySource.get(source)?.asOf)
    .filter((date): date is string => Boolean(date))
    .sort();

  return {
    perUsd,
    sources,
    asOf: dates[0] ?? snapshotProviderRates.asOf,
    degraded: usedSources.has("fallback"),
  };
}

/**
 * Падение на вшитый снимок обязано быть видно в логах. Провайдер может
 * ответить успехом и не отдать часть валют — тогда исключения нет, и без этой
 * записи расчёт шёл бы на устаревших цифрах, ничем не отличаясь от живого.
 */
export function logDegradation(rates: Rates): void {
  if (!rates.degraded) return;

  const fromSnapshot = TRACKED_CURRENCIES.filter((code) => rates.sources[code] === "fallback");
  logFallback(
    "customs",
    `курсы взяты из вшитого снимка от ${snapshotProviderRates.asOf}: ${fromSnapshot.join(", ")}`,
    "живые провайдеры их не отдали, расчёт идёт на устаревших цифрах",
  );
}

/**
 * Оба провайдера опрашиваются параллельно, каждый сам по себе: падение одного
 * не роняет второй. Исключений наружу не бросает никогда — калькулятор не
 * имеет права сломаться из-за недоступного API.
 */
export async function getCustomsRates(): Promise<Rates> {
  assertServer();

  const settled = await Promise.allSettled([
    loadErApi(),
    loadCbr().then(cbrToProviderRates),
  ]);

  const names = ["open.er-api", "ЦБ РФ"];
  const ok: ProviderRates[] = [];
  settled.forEach((result, i) => {
    if (result.status === "fulfilled") ok.push(result.value);
    else logSourceDown(names[i], result.reason);
  });

  const rates = mergeRates(ok);
  logDegradation(rates);
  return rates;
}
