// Синхронизация одной ленты carnect в carnect_lots. Дёргается кроном Coolify
// через scripts/cron/run.mjs (задания carnect-*).
//
//   GET /api/carnect/sync?feed=auctions          пять аукционов
//   GET /api/carnect/sync?feed=hey-zero          HeyDealer Zero (и hey-self, hey-instant)
//   GET /api/carnect/sync?feed=hey-zero&dry=1    то же БЕЗ записи — проверить парсер
//
// Почему ленты отдельные, а не один обход всего — в шапке src/lib/carnect/sync.ts.
//
// Код ответа 200 и при ok:false — раннер разводит их сам по полю ok
// (код возврата 2), как у остальных синков: иначе в истории заданий был бы
// ровный ряд зелёных галочек над упавшим обходом.
//
// Гейт тот же, что у остальных синков: x-poster-secret, fail-closed.

import { NextRequest, NextResponse } from "next/server";

import { FEEDS, isFeed, syncFeed } from "@/lib/carnect/sync";

export const dynamic = "force-dynamic";
// На self-hosted Next это не ограничение, а подсказка: самый длинный обход
// (hey-zero) идёт ~10 минут. Таймаут держит раннер (CRON_TIMEOUT_MS, 30 мин).
export const maxDuration = 1800;

export async function GET(req: NextRequest) {
  const secret = process.env.POSTER_CRON_SECRET;
  if (!secret || req.headers.get("x-poster-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feed = req.nextUrl.searchParams.get("feed");
  if (!isFeed(feed)) {
    return NextResponse.json({ error: `feed обязателен: ${Object.keys(FEEDS).join(" | ")}` }, { status: 400 });
  }

  try {
    const result = await syncFeed(feed, { dry: req.nextUrl.searchParams.get("dry") === "1", signal: req.signal });
    return NextResponse.json(result);
  } catch (err) {
    // syncFeed не бросает; сюда попадём только при ошибке вне его try.
    console.error("[carnect] sync route:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
