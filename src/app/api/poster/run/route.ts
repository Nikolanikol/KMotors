// POST /api/poster/run — один тик автопостинга авто с Encar в Telegram-канал.
//
// Дёргается по расписанию (systemd timer на VPS) с секретом в заголовке:
//   curl -X POST -H "x-poster-secret: $POSTER_CRON_SECRET" https://www.kmotors.shop/api/poster/run
//
// Для ручной отладки: ?dry=1 (собрать пост, не отправляя), ?preset=N (форс пресета).
// Секрет обязателен всегда.

import { NextRequest, NextResponse } from "next/server";
import { runOnce } from "@/lib/poster/run";
import { todayCount } from "@/lib/poster/store";
import { POST_CONFIG, withinPostingWindow } from "@/lib/poster/config";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const secret = process.env.POSTER_CRON_SECRET;
  if (!secret || req.headers.get("x-poster-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry") === "1";
  // force=1 — ручной пост в обход окна/лимита (админский «пост сейчас»); дедуп сохраняется
  const force = url.searchParams.get("force") === "1";
  const presetParam = url.searchParams.get("preset");
  const presetIndex = presetParam !== null ? Number(presetParam) : undefined;

  // Окно и дневной лимит (кроме dry-run и ручного force)
  if (!dryRun && !force) {
    if (!withinPostingWindow()) {
      return NextResponse.json({ posted: false, reason: "вне окна публикации (9–21 KST)" });
    }
    const today = await todayCount();
    if (today >= POST_CONFIG.maxPostsPerDay) {
      return NextResponse.json({
        posted: false,
        reason: `дневной лимит достигнут (${today}/${POST_CONFIG.maxPostsPerDay})`,
      });
    }
  }

  try {
    const r = await runOnce({ dryRun, presetIndex });
    return NextResponse.json({
      posted: r.posted,
      preset: r.preset,
      vehicleId: r.listing?.id ?? null,
      scanned: r.scanned,
      reason: r.reason ?? null,
      rejected: r.rejected.slice(0, 15),
      ...(dryRun ? { caption: r.caption, photos: r.photos } : {}),
    });
  } catch (e) {
    console.error("poster/run error:", e);
    return NextResponse.json(
      { error: "poster failed", details: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
