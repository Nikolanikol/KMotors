/**
 * Разовый залив таблицы cars_seen (sql/035_cars_seen.sql) с локальной машины.
 *
 * Запуск:  npx tsx --env-file=.env scripts/backfill-cars-seen.ts
 * Сухой прогон (ничего не пишет в базу):
 *          DRY_RUN=1 npx tsx --env-file=.env scripts/backfill-cars-seen.ts
 *
 * ⚠️ Это НЕ основной путь наполнения. С 10.2026 таблицу по расписанию наполняет
 * ручка /api/cars/sync (задание `cars` в планировщике Coolify), потому что
 * cars_seen стала источником сайтмапа каталога и обновляться обязана сама.
 * Скрипт остался для двух случаев: разом залить много машин после простоя
 * (LIMIT больше суточной нормы) и проверить обход, не трогая прод (DRY_RUN).
 *
 * Логика обхода общая с ручкой — src/lib/carsSync.ts. Второй копии здесь нет
 * НАМЕРЕННО: она бы разошлась с боевой при первой же правке.
 *
 * Идемпотентен: upsert по encar_id, first_seen_at на конфликте не
 * перезаписывается и остаётся честным lastmod'ом сайтмапа.
 *
 * Переменные окружения:
 *   LIMIT     сколько машин забрать (по умолчанию 2000)
 *   DELAY_MS  пауза между запросами к Encar (по умолчанию 300)
 *   DRY_RUN   1 — только показать, что получилось, без записи
 */

import { syncCarsFromListing } from "@/lib/carsSync";

const LIMIT = Number(process.env.LIMIT ?? 2000);
const DELAY_MS = Number(process.env.DELAY_MS ?? 300);
const DRY_RUN = process.env.DRY_RUN === "1";

async function main() {
  console.log(
    `Залив cars_seen: до ${LIMIT} машин${DRY_RUN ? " (СУХОЙ ПРОГОН)" : ""}`
  );
  const r = await syncCarsFromListing({ limit: LIMIT, delayMs: DELAY_MS, dry: DRY_RUN });
  console.log(
    `Запросов ${r.pages} (не отдалось ${r.failedPages}), строк ${r.fetched}, ` +
      `уникальных машин ${r.unique}, записано ${r.written}`
  );
  if (!r.ok) {
    console.error("Прогон считается неудачным: записать не удалось ничего.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Залив упал:", e);
  process.exit(1);
});
