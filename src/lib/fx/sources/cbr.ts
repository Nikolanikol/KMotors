import { shared } from "@/lib/fx/shared";

/**
 * ЦБ РФ — ОДНА загрузка на весь сайт.
 *
 * Ответ содержит сразу все валюты, поэтому из него берутся и KRW→RUB, и
 * RUB→USD рыночного вида, и кроссы к доллару таможенного. Второго похода к ЦБ
 * быть не должно: раньше рыночный и таможенный модули ходили сюда каждый со
 * своими опциями fetch, и Next не мог схлопнуть их в один запрос.
 *
 * Отдаёт KRW, USD, EUR, GEL, AMD, KGS, KZT, UZS, но НЕ отдаёт албанский лек.
 * Рубль у ЦБ — база, отдельной записи в `Valute` для него нет.
 */
export const CBR_URL = "https://www.cbr-xml-daily.ru/daily_json.js";

/** ЦБ обновляет курсы раз в сутки; 6 часов — общий TTL для всех видов. */
export const CBR_REVALIDATE_SECONDS = 21600;

/**
 * Опции запроса — одной константой. Одинаковые URL и опции = Next схлопывает
 * запросы в рендере и делит одну запись кеша данных.
 *
 * `force-cache` обязателен: кеш fetch в Next 15 — opt-in, одного `revalidate`
 * недостаточно, он задаёт только TTL.
 */
export const CBR_FETCH_INIT = {
  cache: "force-cache",
  next: { revalidate: CBR_REVALIDATE_SECONDS },
} as const satisfies RequestInit;

/** Разобранный ответ ЦБ: рублей за ОДНУ единицу каждой валюты. */
export interface CbrQuote {
  /** ISO-дата «2026-08-08» либо пустая строка, если ЦБ её не прислал. */
  asOf: string;
  /** Рублей за единицу валюты (`Value / Nominal`). Битые записи отброшены. */
  rubPerUnit: Partial<Record<string, number>>;
}

function readValute(entry: unknown): number | null {
  if (typeof entry !== "object" || entry === null) return null;
  const { Value, Nominal } = entry as { Value?: unknown; Nominal?: unknown };
  if (typeof Value !== "number" || !Number.isFinite(Value) || Value <= 0) return null;
  if (typeof Nominal !== "number" || !Number.isFinite(Nominal) || Nominal <= 0) return null;
  return Value / Nominal;
}

/**
 * Разбор ответа отделён от запроса, чтобы проверять его тестами без сети.
 * Бросает только когда ответ негоден целиком; отсутствие отдельной валюты —
 * норма, решает вид, который её читает.
 */
export function parseCbrPayload(payload: unknown): CbrQuote {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("ЦБ РФ: ответ не объект");
  }
  const body = payload as Record<string, unknown>;
  if (typeof body.Valute !== "object" || body.Valute === null) {
    throw new Error("ЦБ РФ: нет поля Valute");
  }

  const rubPerUnit: Partial<Record<string, number>> = {};
  for (const [code, entry] of Object.entries(body.Valute as Record<string, unknown>)) {
    const value = readValute(entry);
    if (value) rubPerUnit[code] = value;
  }

  return {
    asOf: typeof body.Date === "string" ? body.Date.slice(0, 10) : "",
    rubPerUnit,
  };
}

/** Бросает при сетевой ошибке и битом ответе — ловит вид. */
export function loadCbr(): Promise<CbrQuote> {
  return shared("cbr", async () => {
    const response = await fetch(CBR_URL, CBR_FETCH_INIT);
    if (!response.ok) throw new Error(`ЦБ РФ: HTTP ${response.status}`);
    return parseCbrPayload(await response.json());
  });
}
