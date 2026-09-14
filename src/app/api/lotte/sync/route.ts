// Синхронизация каталога Lotte. Дёргается кроном с VPS, как и kcar.
//
//   GET /api/lotte/sync          обойти витрину и записать лоты
//   GET /api/lotte/sync?dry=1    то же, но БЕЗ записи — проверить парсер
//
// Режим dry существует не для удобства: источник — чужая RSC-разметка, и
// проверять, что она ещё разбирается, нужно уметь не трогая прод.

import { NextRequest, NextResponse } from "next/server";
import { syncLotte } from "@/lib/lotte/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const secret = process.env.POSTER_CRON_SECRET;
  if (!secret || req.headers.get("x-poster-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncLotte({ dry: req.nextUrl.searchParams.get("dry") === "1" });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[lotte] sync route:", err);
    return NextResponse.json({ error: "Internal server error", details: String(err) }, { status: 500 });
  }
}
