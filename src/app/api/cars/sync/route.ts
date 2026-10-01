// Наполнение cars_seen из листинга Encar — источника сайтмапа каталога.
//
//   GET /api/cars/sync             обойти верхушку листинга и записать снимки
//   GET /api/cars/sync?dry=1       то же БЕЗ записи — проверить, что Encar отдаёт
//   GET /api/cars/sync?limit=2000  разовый большой залив (например после простоя)
//
// ⚠️ LIMIT — это не «сколько успеем», а регулятор СРОКА ЖИЗНИ адреса в сайтмапе.
// Потолок сайтмапа 5 000 машин (CATALOG_SITEMAP_MAX), сортировка по first_seen_at
// от новых к старым, значит каждая добавленная машина вытесняет самую старую.
// При 500 за сутки адрес лежит в сайтмапе около десяти дней — этого Google
// хватает на обход. Залив по 2 000 четыре раза в сутки сменил бы весь набор за
// день, и мы вернулись бы ровно к той болезни, от которой уходим: URL исчезает
// раньше, чем до него доходит краулер.
//
// Поэтому по умолчанию 500 и раз в сутки. Подгонять по замеру: в ответе лежат
// unique/written, в истории прогонов Coolify видно динамику.

import { NextRequest, NextResponse } from "next/server";
import { syncCarsFromListing } from "@/lib/carsSync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DEFAULT_LIMIT = 500;
// Глубже Encar клампит offset'ы, да и смысла нет: потолок сайтмапа 5 000.
const MAX_LIMIT = 5_000;

export async function GET(req: NextRequest) {
  // Гейт fail-closed: нет секрета в окружении — закрыто, а не открыто.
  const secret = process.env.POSTER_CRON_SECRET;
  if (!secret || req.headers.get("x-poster-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = Number(req.nextUrl.searchParams.get("limit"));
  // Number("abc") это NaN, и без проверки он уехал бы в арифметику обхода.
  const limit = Number.isFinite(raw) && raw > 0 ? Math.min(raw, MAX_LIMIT) : DEFAULT_LIMIT;

  try {
    const result = await syncCarsFromListing({
      limit,
      dry: req.nextUrl.searchParams.get("dry") === "1",
    });
    return NextResponse.json(result);
  } catch (err) {
    // syncCarsFromListing не бросает, но ручка обязана держать и неожиданное:
    // 500 в истории крона лучше, чем необработанный реджект в логе контейнера.
    console.error("[carsSync] route:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
