// Наполнение и проверка cars_seen — источника сайтмапа каталога. Одна задача `cars`
// в Coolify (раз в сутки, `0 6 * * *`) делает ДВЕ вещи подряд:
//
//   1. листинг: обходит верхушку выдачи Encar и записывает снимки (carsSync.ts);
//   2. проверка живости: спрашивает Encar про самые давно не подтверждённые машины
//      ИЗ ОКНА САЙТМАПА и помечает проданные строгим 404 (carsLiveness.ts).
//
//   GET /api/cars/sync               оба шага с настройками по умолчанию
//   GET /api/cars/sync?dry=1         то же БЕЗ записи; проверка живости — до 30 машин
//   GET /api/cars/sync?limit=5000    разовый большой залив листинга (например после простоя)
//   GET /api/cars/sync?check=0       только листинг, без проверки живости
//   GET /api/cars/sync?check=2000    больше проверок за запуск (потолок 3 000)
//
// ─── Что регулирует LIMIT (изменено 27.11.2026) ──────────────────────────────
// Раньше LIMIT регулировал СРОК ЖИЗНИ адреса: окно сайтмапа скользило («5 000 новейших»),
// и каждая добавленная машина вытесняла старую. Теперь окно липкое (20 000 самых ранних из
// подтверждённо живых, catalogSitemapDb.ts), и приток на срок жизни адреса почти не влияет:
// живая машина из карты не уходит. LIMIT задаёт другое — сколько новых кандидатов ждут
// освободившихся мест в очереди и насколько свежи подтверждения (last_seen_at двигает и
// листинг). По умолчанию 3 000 в сутки: окно из 20 000 при сроке жизни объявления в
// несколько недель освобождает сотни мест в сутки, очереди хватает с запасом.
//
// ⚠️ ВРЕМЯ. Напрямую Encar отдаёт 200 строк за ~0,2 с — 3 000 строк это секунды. Через
// прокси Render (на проде прямой доступ раньше не отвечал, замер 02.10.2026) — по 20 строк
// за ~2 с, и 3 000 строк заняли бы 5 минут, поэтому у листинга бюджет 90 с (LISTING_BUDGET_MS):
// успели — записали, остальное в следующий раз. Проверке живости отведено ещё до ~150 с.
// Итого ≲ 260 с при таймауте задачи в Coolify по умолчанию 300 с; рекомендуется поставить
// таймаут 600 (как у carnect-заданий) — тогда запуск не оборвётся на медленном прокси.

import { NextRequest, NextResponse } from "next/server";
import { syncCarsFromListing } from "@/lib/carsSync";
import { checkLiveCars, parseCheckLimit } from "@/lib/carsLivenessDb";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DEFAULT_LIMIT = 3_000;
// Глубже Encar клампит offset'ы (~50k), да и смысла нет: новые объявления лежат на
// верхушке выдачи, а окно сайтмапа держится проверкой живости, не листингом.
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
  const dry = req.nextUrl.searchParams.get("dry") === "1";
  const checkLimit = parseCheckLimit(req.nextUrl.searchParams.get("check"));

  try {
    const result = await syncCarsFromListing({ limit, dry });
    // Проверка идёт ПОСЛЕ листинга: его первые id — свежие, заведомо живые, и служат
    // канарейкой. Упавший листинг проверку не отменяет (канарейка тогда из окна).
    const liveness = await checkLiveCars({
      limit: checkLimit,
      dry,
      canaryIds: result.sampleIds,
    });
    // `ok` верхнего уровня — про листинг, как и раньше. `liveness.ok:false` раннер тоже
    // видит (регулярка по всему телу) и красит прогон: проверка упёрлась в блокировку или
    // не получила канарейку, и ничего не пометила. Бюджет времени сам по себе — не сбой.
    return NextResponse.json({ ...result, liveness });
  } catch (err) {
    // обе функции не бросают, но ручка обязана держать и неожиданное:
    // 500 в истории крона лучше, чем необработанный реджект в логе контейнера.
    console.error("[carsSync] route:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
