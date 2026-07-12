// POST /api/seo/generate  — Фаза 3: генерация SEO-черновиков для карточек запчастей.
//
// Берёт N кандидатов (карточки с показами, ещё не улучшенные), гонит через Gemini,
// складывает draft в seo_suggestions. В прод/на сайт НИЧЕГО не публикует —
// только копит черновики на Telegram-гейт (Фаза 4).
//
//   curl -X POST -H "x-seo-secret: $SEO_CRON_SECRET" \
//        "https://www.kmotors.shop/api/seo/generate?limit=25"

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generatePartSuggestions } from "@/lib/seo-generate";
import { sendSeoDigest } from "@/lib/seo-telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100; // предохранитель против случайного прогона на весь каталог

export async function POST(req: NextRequest) {
  const secret = process.env.SEO_CRON_SECRET;
  if (!secret || req.headers.get("x-seo-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limitParam = Number(req.nextUrl.searchParams.get("limit"));
  const limit = Math.min(
    MAX_LIMIT,
    Number.isFinite(limitParam) && limitParam > 0 ? limitParam : DEFAULT_LIMIT
  );

  const supabase = createServerClient();

  try {
    const result = await generatePartSuggestions(supabase, limit);
    // Есть новые черновики → сразу шлём дайджест на ревью в Telegram
    let digest = { sent: false, count: 0 };
    if (result.created > 0 && result.batch_id) {
      digest = await sendSeoDigest(supabase, result.batch_id);
    }
    return NextResponse.json({ ok: true, limit, ...result, digestSent: digest.sent });
  } catch (e) {
    return NextResponse.json({ error: "Generation failed", detail: String(e) }, { status: 500 });
  }
}
