import { shared } from "@/lib/fx/shared";

/**
 * frankfurter — KRW→USD для рыночного вида.
 *
 * ⚠️ RUB здесь НЕТ вообще (его нет в /v1/currencies, ответ на ?to=RUB,USD
 * приходит с одним USD). Поэтому рубль берётся у ЦБ РФ, а не отсюда: сведение
 * к одному источнику однажды уже стоило месяца рублёвых цен по константе.
 */
export const FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest?from=KRW&to=USD";

export const FRANKFURTER_FETCH_INIT = {
  next: { revalidate: 86400 },
} as const satisfies RequestInit;

export interface FrankfurterQuote {
  /** Долларов за одну вону. */
  krwToUsd: number;
  date: string;
}

export function parseFrankfurterPayload(payload: unknown): FrankfurterQuote {
  const data = payload as { rates?: { USD?: unknown }; date?: unknown } | null;
  const rate = Number(data?.rates?.USD);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("frankfurter: нет правдоподобного курса USD");
  }
  return { krwToUsd: rate, date: String(data?.date ?? "") };
}

export function loadFrankfurter(): Promise<FrankfurterQuote> {
  return shared("frankfurter", async () => {
    const res = await fetch(FRANKFURTER_URL, FRANKFURTER_FETCH_INIT);
    if (!res.ok) throw new Error(`frankfurter: HTTP ${res.status}`);
    return parseFrankfurterPayload(await res.json());
  });
}
