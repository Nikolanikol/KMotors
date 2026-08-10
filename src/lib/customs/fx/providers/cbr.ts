import {
  TRACKED_CURRENCIES,
  type CurrencyCode,
  type ProviderRates,
} from "@/lib/customs/fx/types";

/**
 * ЦБ РФ — резервный провайдер.
 *
 * Отдаёт KRW, USD, EUR, GEL, AMD, KGS, но **не отдаёт албанский лек**.
 * Поэтому он именно резервный: Албанию он закрыть не может, а остальные
 * страны — вполне. Курсы приходят в рублях за `Nominal` единиц, доллар
 * есть в том же списке, так что «единиц за 1 USD» считается кроссом.
 */
export const CBR_URL = "https://www.cbr-xml-daily.ru/daily_json.js";

/** ЦБ обновляет курсы раз в сутки — тот же интервал, что у основного провайдера. */
export const CBR_REVALIDATE_SECONDS = 21600;

interface CbrValute {
  Value: number;
  Nominal: number;
}

function readValute(raw: Record<string, unknown>, code: string): number | null {
  const entry = raw[code];
  if (typeof entry !== "object" || entry === null) return null;
  const { Value, Nominal } = entry as Partial<CbrValute>;
  if (typeof Value !== "number" || !Number.isFinite(Value) || Value <= 0) {
    return null;
  }
  if (typeof Nominal !== "number" || !Number.isFinite(Nominal) || Nominal <= 0) {
    return null;
  }
  return Value / Nominal;
}

export function parseCbr(payload: unknown): ProviderRates {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("ЦБ РФ: ответ не объект");
  }
  const body = payload as Record<string, unknown>;

  if (typeof body.Valute !== "object" || body.Valute === null) {
    throw new Error("ЦБ РФ: нет поля Valute");
  }
  const valute = body.Valute as Record<string, unknown>;

  // Без доллара кросс не построить — считаем ответ негодным целиком.
  const rubPerUsd = readValute(valute, "USD");
  if (!rubPerUsd) {
    throw new Error("ЦБ РФ: в ответе нет курса USD, кросс не построить");
  }

  const perUsd: Partial<Record<CurrencyCode, number>> = { USD: 1 };
  for (const code of TRACKED_CURRENCIES) {
    if (code === "USD") continue;
    const rubPerUnit = readValute(valute, code);
    if (rubPerUnit) perUsd[code] = rubPerUsd / rubPerUnit;
  }

  return {
    source: "cbr",
    asOf: typeof body.Date === "string" ? body.Date.slice(0, 10) : "",
    perUsd,
  };
}

export async function fetchCbr(): Promise<ProviderRates> {
  const response = await fetch(CBR_URL, {
    cache: "force-cache",
    next: { revalidate: CBR_REVALIDATE_SECONDS },
  });
  if (!response.ok) {
    throw new Error(`ЦБ РФ: HTTP ${response.status}`);
  }
  return parseCbr(await response.json());
}
