/**
 * Разовый бэкфилл таблицы cars_seen (sql/035_cars_seen.sql).
 *
 * Запуск:  npx tsx --env-file=.env scripts/backfill-cars-seen.ts
 * Сухой прогон (ничего не пишет в базу):  DRY_RUN=1 npx tsx --env-file=.env scripts/backfill-cars-seen.ts
 *
 * Зачем нужен: снимки копятся сами, при каждом рендере карточки (см.
 * src/lib/carsSeen.ts), и этого достаточно — чтобы страница попала в поиск,
 * Google должен был её обойти, а обход это рендер. Дыра ровно одна: машины,
 * проиндексированные ДО внедрения записи снимков, которые успеют продаться
 * раньше следующего обхода. Этот скрипт её закрывает.
 *
 * Объём маленький и это не случайность: индексируем мы 2 000 машин
 * (CATALOG_MAX_CARS в src/app/sitemap.xml/route.ts), а не все 154 тысячи с
 * Encar. 2 000 / 200 за запрос = 10 запросов.
 *
 * Идемпотентен: пишет через upsert по encar_id, можно гонять сколько угодно раз.
 *
 * Переменные окружения:
 *   LIMIT     сколько машин забрать (по умолчанию 2000 — потолок сайтмапа)
 *   DELAY_MS  пауза между запросами к Encar (по умолчанию 300)
 *   DRY_RUN   1 — только показать, что получилось, без записи
 */

import { saveCarSnapshots, snapshotFromListing, type CarSnapshot } from "@/lib/carsSeen";

// Тот же запрос, что у сайтмапа каталога, — бэкфиллим ровно то, что индексируем.
const QUERY = "(And.Hidden.N._.CarType.Y.)";
// Encar отдаёт до 200 записей за запрос (проверено). Прокси на Render режет
// до 20 независимо от запрошенного — отсюда 10 запросов против 100 на фолбэке.
const PAGE = 200;
const PROXY_PAGE = 20;
const ENCAR_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

const LIMIT = Number(process.env.LIMIT ?? 2000);
const DELAY_MS = Number(process.env.DELAY_MS ?? 300);
const DRY_RUN = process.env.DRY_RUN === "1";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPage(offset: number, size: number): Promise<any[]> {
  const sr = `%7CModifiedDate%7C${offset}%7C${size}`;
  const url = `https://api.encar.com/search/car/list/premium?count=true&q=${encodeURIComponent(QUERY)}&sr=${sr}`;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": ENCAR_UA },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`encar ${res.status}`);
    return (await res.json())?.SearchResults ?? [];
  } catch (e) {
    console.warn(`  offset ${offset}: Encar не ответил (${(e as Error).message}), пробую прокси`);
    try {
      const res = await fetch(
        `https://encar-proxy-main.onrender.com/api/catalog?count=true&q=${encodeURIComponent(QUERY)}&sr=%7CModifiedDate%7C${offset}%7C${PROXY_PAGE}`,
        { signal: AbortSignal.timeout(40_000) }
      );
      if (!res.ok) throw new Error(`proxy ${res.status}`);
      return (await res.json())?.SearchResults ?? [];
    } catch (e2) {
      console.error(`  offset ${offset}: и прокси тоже (${(e2 as Error).message}) — пропускаю`);
      return [];
    }
  }
}

async function main() {
  console.log(`Бэкфилл cars_seen: до ${LIMIT} машин, по ${PAGE} за запрос${DRY_RUN ? " (СУХОЙ ПРОГОН)" : ""}`);

  // Порядок выдачи Encar нестабилен (сортировка по ModifiedDate пересобирается
  // при каждом переподнятии объявления), поэтому страницы частично
  // перекрываются. Дедуп по Id обязателен, иначе часть upsert'ов холостая.
  const byId = new Map<string, CarSnapshot>();
  let fetched = 0;

  for (let offset = 0; offset < LIMIT; offset += PAGE) {
    const rows = await fetchPage(offset, Math.min(PAGE, LIMIT - offset));
    fetched += rows.length;
    for (const row of rows) {
      const snap = snapshotFromListing(row);
      if (snap) byId.set(snap.encar_id, snap);
    }
    console.log(`  offset ${offset}: получено ${rows.length}, уникальных всего ${byId.size}`);
    if (rows.length === 0) break;
    await sleep(DELAY_MS);
  }

  const snapshots = [...byId.values()];
  console.log(`\nПолучено строк ${fetched}, уникальных машин ${snapshots.length}, дублей ${fetched - snapshots.length}`);

  if (DRY_RUN) {
    console.log("Сухой прогон — в базу ничего не пишу. Пример снимка:");
    console.log(snapshots[0]);
    return;
  }

  let written = 0;
  for (let i = 0; i < snapshots.length; i += 500) {
    written += await saveCarSnapshots(snapshots.slice(i, i + 500));
  }
  console.log(`Записано в cars_seen: ${written}`);
}

main().catch((e) => {
  console.error("Бэкфилл упал:", e);
  process.exit(1);
});
