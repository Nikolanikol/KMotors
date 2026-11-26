import { logFallback, reasonText } from "@/lib/fx/log";
import { snapshotMarket } from "@/lib/fx/snapshot";
import { loadCbr, type CbrQuote } from "@/lib/fx/sources/cbr";
import { loadFrankfurter, type FrankfurterQuote } from "@/lib/fx/sources/frankfurter";
import type { CurrencyRates } from "@/lib/fx/types";

/**
 * Рыночный вид: запчасти (буфер оплаты уже в `pricing.ts`), справочные ₽/$,
 * бейдж «под ключ» на модельных страницах.
 *
 * Рубль — от ЦБ РФ (там KRW есть напрямую, и это официальный курс для
 * российского покупателя), доллар — от frankfurter. Источники опрашиваются
 * параллельно и независимо: падение одного не роняет второй.
 */

type Settled<T> = { ok: true; value: T } | { ok: false; reason: unknown };

async function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  try {
    return { ok: true, value: await promise };
  } catch (reason) {
    return { ok: false, reason };
  }
}

/**
 * Сборка вида из ответов источников. Чистая: проверяется тестами без сети.
 * `null` у источника — он не ответил; причина нужна только для лога.
 */
export function buildMarketRates(
  cbr: CbrQuote | null,
  usd: FrankfurterQuote | null,
): { rates: CurrencyRates; stale: string[] } {
  const krwToRub = cbr?.rubPerUnit.KRW ?? null;
  // ЦБ котирует «рублей за доллар» — нам нужна обратная величина.
  const rubPerUsd = cbr?.rubPerUnit.USD ?? null;
  const rubToUsd = rubPerUsd && rubPerUsd > 0 ? 1 / rubPerUsd : null;

  const stale: string[] = [];
  if (!krwToRub) stale.push("KRW→RUB (ЦБ РФ)");
  if (!rubToUsd) stale.push("RUB→USD (ЦБ РФ)");
  if (!usd?.krwToUsd) stale.push("KRW→USD (frankfurter)");

  return {
    rates: {
      krwToRub: krwToRub ?? snapshotMarket.krwToRub,
      krwToUsd: usd?.krwToUsd ?? snapshotMarket.krwToUsd,
      rubToUsd: rubToUsd ?? snapshotMarket.rubToUsd,
      updatedAt: cbr?.asOf || usd?.date || "fallback",
    },
    stale,
  };
}

/** Никогда не бросает исключение: цена важнее точности источника. */
export async function getMarketRates(): Promise<CurrencyRates> {
  const [cbr, usd] = await Promise.all([settle(loadCbr()), settle(loadFrankfurter())]);

  const { rates, stale } = buildMarketRates(
    cbr.ok ? cbr.value : null,
    usd.ok ? usd.value : null,
  );

  if (stale.length) {
    const why = [
      !cbr.ok && `ЦБ РФ: ${reasonText(cbr.reason)}`,
      !usd.ok && `frankfurter: ${reasonText(usd.reason)}`,
    ].filter(Boolean);
    logFallback(
      "market",
      `${stale.join(", ")} из снимка, цены могут расходиться`,
      why.length ? why.join("; ") : "источник ответил без нужной валюты",
    );
  }

  return rates;
}
