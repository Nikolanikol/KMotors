// POST /api/seo/publish — Фаза 5: публикация всех одобренных предложений.
//
// Обычно публикация происходит сразу по апруву в Telegram. Этот эндпоинт —
// backstop/cron: добивает approved, что почему-то не опубликовались.
//
//   curl -X POST -H "x-seo-secret: $SEO_CRON_SECRET" https://www.kmotors.shop/api/seo/publish

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { publishApproved } from "@/lib/seo-publish";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const secret = process.env.SEO_CRON_SECRET;
  if (!secret || req.headers.get("x-seo-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  try {
    const result = await publishApproved(supabase, {}); // все approved
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: "Publish failed", detail: String(e) }, { status: 500 });
  }
}
