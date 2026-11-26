import { logFallback, reasonText } from "@/lib/fx/log";
import { loadKb } from "@/lib/fx/sources/kb";
import { getMarketRates } from "@/lib/fx/views/market";
import type { CarRates, KbRates } from "@/lib/fx/types";

/**
 * Банковский вид для авто: телеграфный покупной курс Кукмин-банка — тот, по
 * которому банк меняет входящий перевод клиента, то есть по нему считается
 * инвойс. Подробности про колонку — в `sources/kb.ts`.
 */

/**
 * Читает таблицу KB. Возвращает `null` при любой неудаче — вызывающий решает,
 * чем заместить. Исключений не бросает никогда.
 */
export async function getKbRates(): Promise<KbRates | null> {
  try {
    return await loadKb();
  } catch (err) {
    // Тихо падать нельзя: расхождение витрины и инвойса иначе невидимо.
    logFallback("car", "курс KB недоступен, берём рыночный", reasonText(err));
    return null;
  }
}

/**
 * Курс для цен на авто: KB, а при его недоступности — рыночный.
 *
 * Рыночный курс ВЫГОДНЕЕ банковского, поэтому фолбэк занижает цену, а не
 * завышает — это осознанный выбор: лучше недосчитать 1.5% на витрине, чем
 * показать цену выше той, по которой реально считает наш банк.
 *
 * Рыночный запрашивается только после отказа KB — пока банк отвечает, лишних
 * походов к ЦБ и frankfurter нет.
 */
export async function getCarRates(): Promise<CarRates> {
  const kb = await getKbRates();
  if (kb) {
    return {
      krwToUsd: kb.krwToUsd,
      krwToRub: kb.krwToRub,
      source: "kb",
      updatedAt: kb.quotedAt,
    };
  }

  const market = await getMarketRates();
  return {
    krwToUsd: market.krwToUsd,
    krwToRub: market.krwToRub,
    source: "market",
    updatedAt: market.updatedAt,
  };
}
