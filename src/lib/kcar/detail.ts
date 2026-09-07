// Добор полей, которых нет в публичном API аукциона: VIN, лист осмотра
// кузова и вся фотогалерея.
//
// ⚠️ ЭТО ВНЕШНЯЯ ЗАВИСИМОСТЬ, И ОНА ХРУПКАЯ. Данные берутся со страницы лота
// на сторонней витрине (KCAR_DETAIL_ORIGIN). У той витрины есть членский
// доступ к аукциону, и она публикует эти поля открыто; сам аукцион отдаёт их
// только авторизованным членам (депозит 3 млн вон, экспортёры освобождены от
// дилерской лицензии). Пока своего членства нет — это единственный путь.
//
// Из этого следуют два правила:
//   1. Модуль обязан деградировать. Витрина сменит разметку, закроется или
//      отстанет по лотам — синхронизация всё равно проходит, просто без VIN
//      и осмотра. Лот без этих полей полезен, отсутствие лота — нет.
//   2. Ключ склейки — CAR_ID аукциона, а не идентификатор витрины. Он лежит
//      в пути к фотографиям (…/CAR/2038/CA20389939/…), потому что витрина
//      ставит прямые ссылки на kcarauction. Когда появится своё членство,
//      источник деталей меняется, а таблицы и связи остаются.
//
// Разбираем ровно три вещи, и все три — машинные, а не отрисованный текст:
//   JSON-LD schema.org  → спецификация (объём, кузов, места, привод)
//   "images":[…]        → полная галерея
//   "reports":[…]       → повреждённые узлы (целые в ответ не приходят)

import { INSPECTION_NODES, INSPECTION_STATUS, frameLabel } from "./dict";
import type { LotDetail } from "./types";

const ORIGIN = process.env.KCAR_DETAIL_ORIGIN ?? "https://motors.wasigroupsa.com";
const LIST_PATH = "/ru/cars?sellType=auction";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** Витрина отдаёт по 30 карточек на страницу и игнорирует limit. */
const PAGE_SIZE = 30;
const DELAY_MS = 1200;
const MAX_PAGES = 80;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getHtml(url: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Собирает идентификаторы карточек аукционного раздела витрины. */
export async function collectDetailIds(signal?: AbortSignal): Promise<string[]> {
  const seen = new Set<string>();
  let total = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const html = await getHtml(`${ORIGIN}${LIST_PATH}&page=${page}`, signal);
    if (!html) break;

    if (!total) {
      const m = /total.{0,3}:(\d+)/.exec(html);
      total = m ? Number(m[1]) : 0;
    }
    const before = seen.size;
    for (const m of html.matchAll(/\/ru\/car\/(\d+)/g)) seen.add(m[1]);
    if (seen.size === before) break;                       // страницы кончились
    if (total && page * PAGE_SIZE >= total + PAGE_SIZE) break;

    await sleep(DELAY_MS);
  }
  return [...seen];
}

interface LdCar {
  vehicleEngine?: { name?: string };
  seatingCapacity?: number | string;
  bodyType?: string;
  driveWheelConfiguration?: string;
}

function parseJsonLd(html: string): LdCar {
  for (const m of html.matchAll(
    /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  )) {
    let doc: unknown;
    try {
      doc = JSON.parse(m[1]);
    } catch {
      continue;
    }
    const nodes: unknown[] = Array.isArray(doc)
      ? doc
      : ((doc as { "@graph"?: unknown[] })?.["@graph"] ?? [doc]);
    for (const n of nodes) {
      const t = (n as { "@type"?: unknown })?.["@type"];
      if (t === "Car" || (Array.isArray(t) && t.includes("Car"))) return n as LdCar;
    }
  }
  return {};
}

function toInt(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? Math.round(n) : null;
}

/** Разбирает страницу лота. Возвращает null, если это не лот K Car. */
export function parseDetail(html: string): LotDetail | null {
  // В RSC-разметке кавычки экранированы — раскрываем один раз для всех разборов.
  const u = html.split('\\"').join('"');

  const provider = /"provider":"(\w+)"/.exec(u)?.[1];
  if (provider !== "kcar") return null;                    // lotte / sk — не наши

  // Галерея и идентификатор лота аукциона.
  let photos: string[] = [];
  const imagesBlock = /"images":(\[[\s\S]*?\}\])/.exec(u);
  if (imagesBlock) {
    try {
      const arr = JSON.parse(imagesBlock[1]) as { url?: string }[];
      photos = arr.map((x) => x.url).filter((x): x is string => !!x);
    } catch {
      /* ниже сработает запасной разбор */
    }
  }
  if (!photos.length) {
    photos = [...u.matchAll(/https:\/\/www\.kcarauction\.com\/auction\/IMAGE_UPLOAD\/[^"\s\\]+/g)]
      .map((m) => m[0]);
  }
  photos = [...new Set(photos)];

  const carId = /IMAGE_UPLOAD\/CAR\/\d+\/(CA\d+)\//.exec(photos.join(" "))?.[1];
  if (!carId) return null;                                  // без ключа склейки бесполезно

  // VIN — 17 знаков в отрисованном тексте.
  let vin: string | null = null;
  for (const m of u.matchAll(/"children":"([A-HJ-NPR-Z0-9]{17})"/g)) {
    if (/\d/.test(m[1]) && /[A-Z]/.test(m[1])) {
      vin = m[1];
      break;
    }
  }

  // Лист осмотра: приходят ТОЛЬКО повреждённые узлы.
  const inspection: Record<string, string> = {};
  const reports = /"reports":(\[[\s\S]*?\])/.exec(u);
  if (reports) {
    try {
      for (const r of JSON.parse(reports[1]) as { part?: string; status?: string }[]) {
        if (!r.part) continue;
        const label = INSPECTION_NODES[r.part] ?? frameLabel(r.part) ?? r.part;
        inspection[label] = INSPECTION_STATUS[r.status ?? ""] ?? r.status ?? "повреждено";
      }
    } catch {
      /* пустой лист лучше кривого */
    }
  }

  // Схема повреждений — картинка из акта осмотра.
  const diagramUrl = /"accidentImages":\[\{"url":"([^"]+)"/.exec(u)?.[1] ?? null;

  // Обратная ссылка на карточку аукциона (в ней же код торгов AUC_CD).
  const sourceUrl =
    /href":"(https:\/\/www\.kcarauction\.com\/kcar\/auction\/[^"]+)"/
      .exec(u)?.[1]
      ?.split("\\u0026")
      .join("&") ?? null;

  const ld = parseJsonLd(html);
  return {
    carId,
    vin,
    engineCc: toInt(ld.vehicleEngine?.name),
    bodyType: ld.bodyType ?? null,
    seats: toInt(ld.seatingCapacity),
    drive: ld.driveWheelConfiguration ?? null,
    inspection,
    photos,
    diagramUrl,
    sourceUrl,
  };
}

/**
 * Обходит карточки и возвращает детали по CAR_ID.
 * `wanted` ограничивает работу лотами, которые реально есть в торгах.
 */
export async function fetchDetails(
  wanted: Set<string>,
  signal?: AbortSignal,
): Promise<{ details: Map<string, LotDetail>; scanned: number; failed: number }> {
  const details = new Map<string, LotDetail>();
  let scanned = 0;
  let failed = 0;

  const ids = await collectDetailIds(signal);
  for (const id of ids) {
    if (details.size >= wanted.size) break;                 // всё нужное собрано
    const html = await getHtml(`${ORIGIN}/ru/car/${id}`, signal);
    scanned++;
    if (!html) {
      failed++;
    } else {
      const d = parseDetail(html);
      if (d && wanted.has(d.carId)) details.set(d.carId, d);
    }
    await sleep(DELAY_MS);
  }
  return { details, scanned, failed };
}
