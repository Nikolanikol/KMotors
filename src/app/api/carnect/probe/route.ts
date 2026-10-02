// Пробный обход carnect.biz — БЕЗ записи в базу.
//
//   GET /api/carnect/probe?house=glovis              первые 2 страницы списка
//   GET /api/carnect/probe?house=glovis&pages=0      весь список площадки
//   GET /api/carnect/probe?house=glovis&lot=<lotId>  плюс страница одного лота
//   GET /api/carnect/probe?house=glovis&venue=1100   один аукционный дом (Бундан)
//
// Зачем он, пока записи нет вовсе. Источник — чужая RSC-разметка, и прежде
// чем проектировать колонки, нужно видеть на живых данных, какие поля у
// какой площадки заполнены. Ответ даёт это одной таблицей (coverage). После
// появления синка маршрут остаётся как способ проверить парсер, не трогая
// прод — тот же смысл, что у ?dry=1 у showcase.
//
// По умолчанию 2 страницы, а не весь список: проверке парсера хватает пары
// запросов, а полный обход Autobell — 61 запрос и ~3 минуты чужого сервера.
//
// Гейт тот же, что у остальных синков: x-poster-secret, fail-closed.

import { NextRequest, NextResponse } from "next/server";
import { fetchLotDetail } from "@/lib/carnect/detail";
import { ALL_HOUSES, isHouse } from "@/lib/carnect/houses";
import { fetchHouseLots } from "@/lib/carnect/list";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Доля лотов, у которых поле заполнено осмысленно. 0, пустая строка и
 * "$undefined" (уже снятый в rsc.ts) считаются пустыми: у Lotte startKrw = 0
 * у всех лотов, и таблица должна это показать, а не записать в «есть».
 */
function coverage(rows: Record<string, unknown>[]): Record<string, string> {
  const keys = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) keys.add(k);
  const out: Record<string, string> = {};
  for (const k of [...keys].sort()) {
    const filled = rows.filter((r) => {
      const v = r[k];
      return v !== undefined && v !== null && v !== "" && v !== 0 && !(Array.isArray(v) && !v.length);
    }).length;
    out[k] = `${filled}/${rows.length}`;
  }
  return out;
}

export async function GET(req: NextRequest) {
  const secret = process.env.POSTER_CRON_SECRET;
  if (!secret || req.headers.get("x-poster-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const house = sp.get("house");
  if (!isHouse(house)) {
    return NextResponse.json({ error: `house обязателен: ${ALL_HOUSES.join(" | ")}` }, { status: 400 });
  }
  // pages=0 — без ограничения (до предохранителя MAX_PAGES в list.ts).
  const pagesRaw = Number(sp.get("pages") ?? "2");
  const maxPages = Number.isInteger(pagesRaw) && pagesRaw >= 0 ? pagesRaw || undefined : 2;

  const started = Date.now();
  // venue — код аукционного дома (HOUSES[house].venues), фильтр carnect.
  const venue = sp.get("venue") || undefined;
  const list = await fetchHouseLots(house, { maxPages, venue, signal: req.signal });

  const lotId = sp.get("lot");
  const detail = lotId ? await fetchLotDetail(house, lotId, req.signal) : null;

  return NextResponse.json({
    // ok — только когда список разобрался. Ноль лотов при ok:true значит
    // «у площадки сейчас нет торгов», а не «парсер сломан» — для этого error.
    ok: !list.error,
    house,
    error: list.error ?? null,
    total: list.total,
    collected: list.lots.length,
    requests: list.requests + (detail ? 1 : 0),
    seconds: Math.round((Date.now() - started) / 1000),
    ingest: list.ingest,
    // По каким датам торгов и площадкам лежат лоты — сверять с HOUSES.
    auctionDates: [...new Set(list.lots.map((l) => `${l.auctionDate ?? "?"} ${l.venue ?? l.location ?? ""}`.trim()))],
    coverage: coverage(list.lots),
    sample: list.lots[0] ?? null,
    detail: detail && {
      status: detail.status,
      ...(detail.status === "ok" ? { coverage: coverage([detail.lot]), lot: detail.lot } : {}),
      ...(detail.status === "failed" ? { parser: detail.parser } : {}),
    },
  });
}
