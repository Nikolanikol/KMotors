import { NextRequest, NextResponse } from "next/server";
import { EMS_NUMBER_RE, normalizeEmsNumber, trackEms, type EmsTrackingResult } from "@/lib/emsTracking";

/**
 * Отслеживание посылки Korea Post EMS: /api/ems/track?number=UE005086520KR
 *
 * ⚠️ Путь НЕ /api/track — там сидит приёмник first-party аналитики из middleware.
 *
 * ⚠️ Ручка публичная и ходит на ЧУЖОЙ сервер, поэтому закрыта с двух сторон:
 * маска номера отсекает перебор до похода наружу, а память инстанса держит
 * ответ минуту и не даёт одному номеру бомбить Korea Post при F5.
 */

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 60_000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 20;

const cache = new Map<string, { result: EmsTrackingResult; at: number }>();
const hits = new Map<string, { count: number; windowStart: number }>();

function pruneExpired(now: number) {
  for (const [key, entry] of cache) {
    if (now - entry.at > CACHE_TTL_MS) cache.delete(key);
  }
  for (const [key, entry] of hits) {
    if (now - entry.windowStart > RATE_WINDOW_MS) hits.delete(key);
  }
}

function isRateLimited(ip: string, now: number): boolean {
  const entry = hits.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

export async function GET(request: NextRequest) {
  const now = Date.now();
  pruneExpired(now);

  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown";

  if (isRateLimited(ip, now)) {
    return NextResponse.json({ status: "rate_limited" }, { status: 429 });
  }

  const number = normalizeEmsNumber(request.nextUrl.searchParams.get("number") || "");

  if (!EMS_NUMBER_RE.test(number)) {
    return NextResponse.json(
      { number, status: "invalid" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const cached = cache.get(number);
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return NextResponse.json(cached.result, {
      headers: { "Cache-Control": "no-store", "X-Ems-Cache": "hit" },
    });
  }

  const result = await trackEms(number);

  // Сбой апстрима не кешируем: клиент нажмёт «обновить» и должен получить
  // настоящую попытку, а не минуту старой ошибки.
  if (result.status !== "upstream_error") {
    cache.set(number, { result, at: now });
  }

  return NextResponse.json(result, {
    // Ответ содержит маскированные имена — общий кеш на нём не нужен,
    // свежесть держит память инстанса.
    headers: { "Cache-Control": "no-store", "X-Ems-Cache": "miss" },
  });
}
