import {
  TRACKED_CURRENCIES,
  type CurrencyCode,
  type ProviderRates,
} from "@/lib/customs/fx/types";

/**
 * open.er-api.com — основной провайдер.
 *
 * Единственный из проверенных, кто котирует албанский лек, и при этом отдаёт
 * все остальные нужные валюты одним запросом с базой USD. Ключ не требуется.
 * Проверено 09.08.2026: в ответе есть ALL, KRW, GEL, AMD, KGS, EUR.
 */
export const ERAPI_URL = "https://open.er-api.com/v6/latest/USD";

/** Кэш на 6 часов: провайдер обновляется раз в сутки, около 00:02 UTC. */
export const ERAPI_REVALIDATE_SECONDS = 21600;

/**
 * Разбор ответа отделён от запроса, чтобы его можно было проверить тестами
 * без сети — в том числе на битом и неполном JSON.
 */
export function parseErApi(payload: unknown): ProviderRates {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("open.er-api: ответ не объект");
  }
  const body = payload as Record<string, unknown>;

  if (body.result !== "success") {
    throw new Error(`open.er-api: result=${String(body.result)}`);
  }
  if (typeof body.rates !== "object" || body.rates === null) {
    throw new Error("open.er-api: нет поля rates");
  }

  const raw = body.rates as Record<string, unknown>;
  const perUsd: Partial<Record<CurrencyCode, number>> = {};
  for (const code of TRACKED_CURRENCIES) {
    const value = raw[code];
    // Ноль и отрицательные отбрасываем наравне с отсутствием: делить на такое
    // нельзя, а тихо пропустить хуже, чем взять курс из другого источника.
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      perUsd[code] = value;
    }
  }

  if (Object.keys(perUsd).length === 0) {
    throw new Error("open.er-api: ни одной нужной валюты в ответе");
  }

  return {
    source: "erapi",
    asOf: parseUpdateDate(body.time_last_update_utc),
    perUsd,
  };
}

/** «Sun, 09 Aug 2026 00:02:31 +0000» → «2026-08-09». Битую дату не выдумываем. */
function parseUpdateDate(value: unknown): string {
  if (typeof value !== "string") return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

export async function fetchErApi(): Promise<ProviderRates> {
  const response = await fetch(ERAPI_URL, {
    // Кэш в Next 16 — opt-in: без force-cache запрос уходил бы к провайдеру
    // на каждый рендер. Одного revalidate недостаточно, он задаёт только TTL.
    cache: "force-cache",
    next: { revalidate: ERAPI_REVALIDATE_SECONDS },
  });
  if (!response.ok) {
    throw new Error(`open.er-api: HTTP ${response.status}`);
  }
  return parseErApi(await response.json());
}
