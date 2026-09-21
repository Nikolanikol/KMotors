// Клиент публичного эндпоинта аукциона K Car.
//
//   POST https://www.kcarauction.com/kcar/auction/getAuctionCarList_ajax.do
//
// Авторизация не нужна, ключа нет, ограничений по частоте на момент
// подключения (09.2026) не замечено.
//
// ⚠️ ГЛАВНАЯ ЛОВУШКА: на сервере Spring-биндинг, и если пропустить ХОТЬ ОДИН
// из 32 параметров формы, ответом будет 404 от Tomcat, а не ошибка валидации.
// Именно поэтому BASE_PARAMS перечисляет все поля, включая заведомо пустые:
// «лишние» пустые строки здесь не мусор, а условие работы запроса. Сокращать
// список нельзя — эндпоинт молча превратится в «не найдено».
//
// ⚠️ Второй параметр, который легко потерять: AUC_TYPE. Для недельных торгов
// он "weekly", для дневных "daily", для ожидающих распределения "sncar".
// С неверным AUC_TYPE ответ 200 и пустой CAR_LIST — выглядит как «лотов нет».
//
// Это чужой сайт без контракта, поэтому модуль обязан деградировать, а не
// падать: не ответил / сменил формат / отдал бессмыслицу — возвращаем пустой
// список и ЛОГИРУЕМ. Правило то же, что у kbFx.ts и вызовов Encar.

import type { RawLot } from "./types";

const ENDPOINT = "https://www.kcarauction.com/kcar/auction/getAuctionCarList_ajax.do";
const REFERER = "https://www.kcarauction.com/kcar/auction/weekly_auction/colAuction.do";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** Сервер отдаёт максимум 100 записей за запрос. */
const PAGE_SIZE = 100;
/** Пауза между страницами — не долбим чужой сервер. */
const PAGE_DELAY_MS = 400;
/** Потолок страниц на один вызов: защита от бесконечного цикла при странном ответе. */
const MAX_PAGES = 60;

const BASE_PARAMS: Record<string, string> = {
  AUC_TYPE: "", MNUFTR_CD: "", MODEL_GRP_CD: "", MODEL_CD: "",
  PAGE_CNT: String(PAGE_SIZE), START_RNUM: "1", ORDER: "1", OPTION_CD: "",
  FORM_YR_ST: "", FORM_YR_ED: "", AUC_START_PRC_ST: "", AUC_START_PRC_ED: "",
  MILG_ST: "", MILG_ED: "", CNO: "", FUEL_CD: "", GBOX_DCD: "", COLOR_CD: "",
  SRC_OPT: "", CAR_TYPE: "", CARMD_CD: "", PAGE_TYPE: "", LANE_TYPE: "A",
  TO_DATE: "", FROM_DATE: "", CAR_STAT_CD: "", AUC_SEQ: "", TODAY: "",
  IPTCAR_DCD: "", START_DATE: "", END_DATE: "", AUC_PLC_CD: "",
};

/** Режимы выборки. */
export type PageType =
  | "wCfm"   // выставлены на ближайшие недельные торги (стартовые цены)
  | "wRst"   // результаты прошедших недельных торгов (цена молотка)
  | "wAft"   // непроданные, доступны для послеаукционных переговоров
  | "dCfm"   // дневные торги
  | "wait";  // ожидают распределения по сессиям

export const LANES = ["A", "B", "C", "D"] as const;
export type Lane = (typeof LANES)[number];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callOnce(params: Record<string, string>, signal?: AbortSignal): Promise<RawLot[]> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": UA,
      Referer: REFERER,
    },
    body: new URLSearchParams({ ...BASE_PARAMS, ...params }).toString(),
    signal,
    cache: "no-store",
  });

  if (!res.ok) {
    // 404 здесь почти всегда означает пропущенный параметр формы, а не
    // отсутствующий эндпоинт — см. предупреждение в шапке файла.
    throw new Error(`kcar: HTTP ${res.status}${res.status === 404 ? " (проверь набор параметров)" : ""}`);
  }

  const data: unknown = await res.json();
  if (!data || typeof data !== "object" || !Array.isArray((data as { CAR_LIST?: unknown }).CAR_LIST)) {
    throw new Error("kcar: в ответе нет CAR_LIST — формат изменился");
  }
  return (data as { CAR_LIST: RawLot[] }).CAR_LIST;
}

/** Тянет весь список постранично. Ошибка сети не роняет вызов — вернём что успели. */
export async function fetchLots(
  opts: {
    pageType: PageType;
    aucType: "weekly" | "daily" | "sncar";
    lane?: Lane;
    session?: number | string;
    signal?: AbortSignal;
  },
): Promise<{ lots: RawLot[]; error?: string }> {
  const params: Record<string, string> = {
    AUC_TYPE: opts.aucType,
    SRC_OPT: opts.aucType === "sncar" ? "sncar" : opts.aucType,
    PAGE_TYPE: opts.pageType,
    LANE_TYPE: opts.lane ?? "A",
    AUC_SEQ: opts.session != null ? String(opts.session) : "",
  };

  const out: RawLot[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    let chunk: RawLot[];
    try {
      chunk = await callOnce({ ...params, START_RNUM: String(page) }, opts.signal);
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error(`[kcar] ${opts.pageType}/${params.LANE_TYPE} стр.${page}: ${error}`);
      return { lots: out, error };
    }
    out.push(...chunk);
    if (chunk.length < PAGE_SIZE) break;
    await sleep(PAGE_DELAY_MS);
  }
  return { lots: out };
}

/** Все полосы одной недельной сессии. Пустые полосы (C/D) отсеиваются сами. */
export async function fetchWeekly(
  pageType: Extract<PageType, "wCfm" | "wRst" | "wAft">,
  session?: number | string,
  signal?: AbortSignal,
): Promise<{ lots: (RawLot & { _lane: Lane })[]; errors: string[] }> {
  const lots: (RawLot & { _lane: Lane })[] = [];
  const errors: string[] = [];
  for (const lane of LANES) {
    const r = await fetchLots({ pageType, aucType: "weekly", lane, session, signal });
    if (r.error) errors.push(`${lane}: ${r.error}`);
    lots.push(...r.lots.map((l) => ({ ...l, _lane: lane })));
    await sleep(PAGE_DELAY_MS);
  }
  return { lots, errors };
}
