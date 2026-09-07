// Приведение сырого ответа аукциона к строкам таблиц.
//
// ⚠️ ЕДИНИЦЫ ЦЕН. У площадки в одном ответе живут две разные единицы:
//   AUC_STRT_PRC / AUC_STRT_HOPE — воны       (14500000)
//   SCSBID_PRC                   — 만원, ×10 000 (1490 = 14 900 000 ₩)
// Это ровно тот класс ошибки, что стоил проекту двух дефектов на ценах Encar
// (см. CLAUDE.md, «Цены и курсы»): там строку и число трактовали по-разному.
// Здесь нормализация одна и живёт только тут — в остальном коде цены уже
// в вонах, и множителей быть не должно.
//
// ⚠️ ПУСТОТА. Площадка отдаёт незаполненное поле и как "", и как "0", и как 0.
// Поэтому num() возвращает null для нуля: год 0 или пробег 0 — это «неизвестно»,
// а не «ноль километров».

import { DEFECT_PARTS, FUEL, MAKERS, TRANSMISSION, USAGE, COLORS, tr, translateModel } from "./dict";
import { parseRemarks } from "./remarks";
import type { KcarLot, KcarSale, LotDetail, RawLot } from "./types";

/** 만원 → воны. */
const MANWON = 10_000;

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) && n !== 0 ? Math.round(n) : null;
}

function str(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

/** «20260903» → «2026-09-03». Иначе null: кривую дату в date-колонку не пишем. */
function ymd(v: unknown): string | null {
  const s = String(v ?? "").trim();
  if (!/^\d{8}$/.test(s)) return null;
  const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

function parts(v: unknown): string[] {
  return String(v ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => DEFECT_PARTS[p] ?? p);
}

function site(v: unknown): string | null {
  const s = String(v ?? "");
  if (s.includes("오산")) return "Осан";
  if (s.includes("세종")) return "Седжон";
  return str(v);
}

function trim(raw: RawLot): string | null {
  const t = [raw.GRD_LCSF_NM, raw.GRD_SCSF_NM].map((x) => str(x)).filter(Boolean).join(" ");
  return t || null;
}

/** Сырой лот + детали (если добрались) → строка kcar_lots. */
export function toLot(
  raw: RawLot & { _lane?: string },
  session: number | null,
  detail?: LotDetail,
): KcarLot | null {
  const carId = str(raw.CAR_ID);
  if (!carId) return null;                       // без ключа строка бессмысленна

  const rem = parseRemarks(raw.UNQUS);
  const photos = detail?.photos ?? [];

  return {
    car_id: carId,
    session,
    lane: str(raw._lane),
    auction_code: str(raw.AUC_CD),
    auction_date: ymd(raw.AUC_STRT_DT),
    auction_window: str(raw.AUC_STRT_END_DATETIME),
    site: site(raw.AUC_PLC_NM),
    lot_no: num(raw.EXBIT_SEQ),
    plate: str(raw.CNO),

    maker: tr(MAKERS, raw.MNUFTR_NM),
    maker_ko: str(raw.MNUFTR_NM),
    model: translateModel(raw.MODEL_NM),
    model_ko: str(raw.MODEL_NM),
    trim: trim(raw),
    name_ko: str(raw.CAR_NM),

    year: num(raw.FORM_YR),
    first_reg: ymd(raw.FST_REG_DT),
    mileage_km: num(raw.MILG),
    fuel: tr(FUEL, raw.FUEL_TYPE_NM),
    transmission: tr(TRANSMISSION, raw.TRANS_MISSION_NM),
    color: tr(COLORS, raw.EXTERIOR_COLOR_NM),
    usage: tr(USAGE, raw.CAR_USE_NM),

    grade_ext: str(raw.CAR_POINT),
    grade_int: str(raw.CAR_POINT2),
    defect_count: num(raw.EX_CNT),
    defect_parts: parts(raw.JINDAN_EX_LIST),
    mortgages: num(raw.MOGE_CNT) ?? 0,
    seizures: num(raw.SZR_CNT) ?? 0,

    start_price_krw: num(raw.AUC_STRT_PRC),
    reserve_price_krw: num(raw.AUC_STRT_HOPE),
    status: str(raw.AUC_STAT_NM),

    remarks: str(raw.UNQUS),
    notices: rem.notices,
    conditions: rem.conditions,
    blocked_export: rem.blockedExport,
    doc_days: rem.docDays,

    vin: detail?.vin ?? null,
    engine_cc: detail?.engineCc ?? null,
    body_type: detail?.bodyType ?? null,
    seats: detail?.seats ?? null,
    drive: detail?.drive ?? null,
    inspection: detail ? detail.inspection : null,
    photos,
    photo_count: photos.length,
    diagram_url: detail?.diagramUrl ?? null,
    source_url: detail?.sourceUrl ?? null,

    updated_at: new Date().toISOString(),
  };
}

/** Сырой лот из результатов торгов → строка kcar_sales. */
export function toSale(raw: RawLot & { _lane?: string }, session: number): KcarSale | null {
  const carId = str(raw.CAR_ID);
  if (!carId) return null;

  const hammerManwon = num(raw.SCSBID_PRC);
  return {
    car_id: carId,
    session,
    lane: str(raw._lane),
    auction_date: ymd(raw.AUC_STRT_DT),
    site: site(raw.AUC_PLC_NM),

    maker: tr(MAKERS, raw.MNUFTR_NM),
    model: translateModel(raw.MODEL_NM),
    trim: trim(raw),
    year: num(raw.FORM_YR),
    mileage_km: num(raw.MILG),
    fuel: tr(FUEL, raw.FUEL_TYPE_NM),
    transmission: tr(TRANSMISSION, raw.TRANS_MISSION_NM),
    usage: tr(USAGE, raw.CAR_USE_NM),

    grade_ext: str(raw.CAR_POINT),
    grade_int: str(raw.CAR_POINT2),
    defect_count: num(raw.EX_CNT),

    start_price_krw: num(raw.AUC_STRT_PRC),
    reserve_price_krw: num(raw.AUC_STRT_HOPE),
    hammer_price_krw: hammerManwon != null ? hammerManwon * MANWON : null,
    sold: hammerManwon != null,
  };
}
