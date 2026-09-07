// Синхронизация аукциона K Car. Дёргается кроном с VPS.
//
// Почему работа идёт здесь, а не скриптом на VPS: на машине НЕТ рабочей копии
// репозитория, прод собирается Coolify в Docker (см. шапку
// scripts/rss-sync-cron.sh). Крон умеет только один curl, вся логика —
// в Next-процессе, результат ложится в Supabase. Тот же приём, что у
// /api/rss-sync и /api/blog-generate.
//
//   GET /api/kcar/sync                      лоты ближайших торгов
//   GET /api/kcar/sync?enrich=1             + VIN, лист осмотра, галерея (долго)
//   GET /api/kcar/sync?sessions=995         результаты одной сессии
//   GET /api/kcar/sync?sessions=975-995     догнать историю диапазоном
//
// ⚠️ Обход с добором деталей идёт по ~1700 страницам сторонней витрины с
// паузой 1.2 с — это порядка 35 минут. Он НЕ должен стоять в ежедневном
// расписании рядом с обычным прогоном: ставить отдельной, редкой задачей и
// с запасом по таймауту на стороне curl.

import { NextRequest, NextResponse } from "next/server";
import { parseSessions, syncLots, syncSales } from "@/lib/kcar/sync";

// Долгий сетевой обход — статикой это быть не может.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  // Тот же гейт, что у /api/rss-sync и /api/poster/run: fail-closed.
  // Нет переменной — 401, а не молча открытый роут.
  const secret = process.env.POSTER_CRON_SECRET;
  if (!secret || req.headers.get("x-poster-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessions = parseSessions(searchParams.get("sessions"));
  const enrich = searchParams.get("enrich") === "1";

  try {
    const result = sessions.length
      ? await syncSales(sessions)
      : await syncLots({ enrich });

    // 200 даже при ok:false — крон в логе увидит тело ответа и причину,
    // а не только код. Падаем 500 только на неожиданном исключении.
    return NextResponse.json(result);
  } catch (err) {
    console.error("[kcar] sync route:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 },
    );
  }
}
