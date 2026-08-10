import { fallbackRates } from "@/lib/customs/fx/fallback";
import { fetchCbr } from "@/lib/customs/fx/providers/cbr";
import { fetchErApi } from "@/lib/customs/fx/providers/erapi";
import {
  TRACKED_CURRENCIES,
  type CurrencyCode,
  type ProviderRates,
  type Rates,
  type RateSource,
} from "@/lib/customs/fx/types";

/**
 * Получение курсов. Только серверный код: браузер сюда не ходит — иначе
 * начались бы CORS-сюрпризы, лимиты провайдеров разъехались бы по клиентам,
 * а курс не попадал бы в HTML первого ответа.
 *
 * В проекте нет пакета `server-only`, поэтому граница держится проверкой
 * во время выполнения. Если понадобится запрет на этапе сборки — это одна
 * зависимость, добавлять её отдельным решением.
 */
function assertServer(): void {
  if (typeof window !== "undefined") {
    throw new Error("getRates вызван в браузере: слой курсов только серверный");
  }
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
 * Сборка итогового набора из ответов провайдеров.
 *
 * Вынесена отдельной чистой функцией, чтобы проверять деградацию тестами,
 * не трогая сеть. Пробелы закрывает вшитый снимок, поэтому результат
 * заполнен всегда и исключений не бросает.
 */
export function mergeRates(results: ProviderRates[]): Rates {
  const bySource = new Map<RateSource, ProviderRates>();
  for (const result of results) bySource.set(result.source, result);
  bySource.set("fallback", fallbackRates);

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
    asOf: dates[0] ?? fallbackRates.asOf,
    degraded: usedSources.has("fallback"),
  };
}

/**
 * Падение на вшитый снимок обязано быть видно в логах.
 *
 * Провайдер может ответить успехом и при этом не отдать часть валют — тогда
 * исключения нет, `degraded` тихо становится true, и расчёт идёт на цифрах
 * многомесячной давности, ничем не отличаясь снаружи от живого. В KMotors это
 * уже стоило месяца незамеченного расхождения по курсу (см. постмортемы),
 * поэтому уровень здесь error, а не warn: предупреждениями лог зашумлён.
 *
 * Вынесено из `mergeRates`, чтобы та осталась чистой и проверяемой без спая.
 */
export function logDegradation(rates: Rates): void {
  if (!rates.degraded) return;

  const fromSnapshot = TRACKED_CURRENCIES.filter(
    (code) => rates.sources[code] === "fallback",
  );
  console.error(
    `[fx] курсы взяты из вшитого снимка от ${fallbackRates.asOf}: ` +
      `${fromSnapshot.join(", ")}. Живые провайдеры их не отдали — ` +
      `расчёт идёт на устаревших цифрах.`,
  );
}

/**
 * Оба провайдера опрашиваются параллельно, каждый в своём try/catch:
 * падение одного не роняет второй. Исключений наружу не бросает никогда —
 * калькулятор не имеет права сломаться из-за недоступного API.
 */
export async function getRates(): Promise<Rates> {
  assertServer();

  const settled = await Promise.allSettled([fetchErApi(), fetchCbr()]);

  const ok: ProviderRates[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") {
      ok.push(result.value);
    } else {
      // Тихо глотать нельзя: без записи в лог отвалившийся провайдер
      // обнаружится только тогда, когда снимок устареет на полгода.
      console.warn("[fx] провайдер недоступен:", result.reason);
    }
  }

  const rates = mergeRates(ok);
  logDegradation(rates);
  return rates;
}
