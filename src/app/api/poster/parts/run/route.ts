// POST /api/poster/parts/run — один тик автопостинга запчастей в тему группы.
//
// Дёргается по расписанию (хостовый cron) с секретом:
//   curl -X POST -H "x-poster-secret: $POSTER_CRON_SECRET" https://www.kmotors.shop/api/poster/parts/run
//
// ?dry=1 — собрать пост без отправки; ?force=1 — в обход окна/лимита (ручной пост).

import { NextRequest, NextResponse } from "next/server";
import { runPartsOnce, todayPartsCount } from "@/lib/poster/parts";
import { PARTS_CONFIG, withinPostingWindow } from "@/lib/poster/config";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const secret = process.env.POSTER_CRON_SECRET;
  if (!secret || req.headers.get("x-poster-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry") === "1";
  const force = url.searchParams.get("force") === "1";

  if (!dryRun && !force) {
    if (!withinPostingWindow()) {
      return NextResponse.json({ posted: false, reason: "вне окна публикации (9–21 KST)" });
    }
    const today = await todayPartsCount();
    if (today >= PARTS_CONFIG.maxPostsPerDay) {
      return NextResponse.json({
        posted: false,
        reason: `дневной лимит достигнут (${today}/${PARTS_CONFIG.maxPostsPerDay})`,
      });
    }
  }

  try {
    const r = await runPartsOnce({ dryRun });
    return NextResponse.json({
      posted: r.posted,
      partId: r.part?.id ?? null,
      partNumber: r.part?.part_number ?? null,
      hasImage: !!r.image,
      reason: r.reason ?? null,
      ...(dryRun ? { caption: r.caption, image: r.image } : {}),
    });
  } catch (e) {
    console.error("poster/parts/run error:", e);
    return NextResponse.json(
      { error: "parts poster failed", details: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
