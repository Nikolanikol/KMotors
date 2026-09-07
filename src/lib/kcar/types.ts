// Типы модуля аукционов.
//
// Разделены на три слоя, и это не формальность:
//   RawLot      — что реально приходит от площадки (236 полей, все строками)
//   LotDetail   — VIN, лист осмотра и галерея, которых в списочном API нет
//   AuctionLot  — нормализованная запись, которая ложится в auction_lots
// Смешивать их нельзя: у площадки цена молотка приходит в 만원, стартовая —
// в вонах, а пустое значение выглядит как "" и как "0" одновременно.

/** Ответ getAuctionCarList_ajax.do. Полей 236, здесь только заполняемые. */
export interface RawLot {
  CAR_ID?: string;
  AUC_CD?: string;
  AUC_PLC_NM?: string;
  AUC_STRT_DT?: string;
  AUC_STRT_END_DATETIME?: string;
  AUC_STAT_NM?: string;
  AUC_RESULT?: string;
  EXBIT_SEQ?: string | number;
  CNO?: string;

  MNUFTR_NM?: string;
  MODEL_NM?: string;
  GRD_LCSF_NM?: string;
  GRD_SCSF_NM?: string;
  CAR_NM?: string;
  FORM_YR?: string | number;
  FST_REG_DT?: string;
  MILG?: string | number;
  FUEL_TYPE_NM?: string;
  TRANS_MISSION_NM?: string;
  EXTERIOR_COLOR_NM?: string;
  CAR_USE_NM?: string;

  CAR_POINT?: string | number;
  CAR_POINT2?: string;
  EX_CNT?: string | number;
  JINDAN_EX_LIST?: string;
  MOGE_CNT?: string | number;
  SZR_CNT?: string | number;

  /** Стартовая цена — в ВОНАХ. */
  AUC_STRT_PRC?: string | number;
  /** Резерв продавца — в ВОНАХ. */
  AUC_STRT_HOPE?: string | number;
  /** ⚠️ Цена молотка — в 만원, то есть ×10 000. Нормализуется в normalize.ts. */
  SCSBID_PRC?: string | number;

  UNQUS?: string;
  THUMBNAIL?: string;
}

/** Что удалось добрать из карточки лота: VIN, осмотр, вся галерея. */
export interface LotDetail {
  carId: string;
  vin: string | null;
  engineCc: number | null;
  bodyType: string | null;
  seats: number | null;
  drive: string | null;
  /** Только повреждённые узлы: {"капот": "заменено"}. Остальные целы. */
  inspection: Record<string, string>;
  photos: string[];
  diagramUrl: string | null;
  sourceUrl: string | null;
}

/** Разобранное примечание аукциониста. */
export interface ParsedRemarks {
  /** Условия сделки и история: прокат, изменённая конструкция, запрет экспорта. */
  notices: { text: string; level: NoticeLevel }[];
  /** Опись состояния: «стук по днищу», «ключей: 2», «коррозия днища». */
  conditions: string[];
  /** Ставки экспортёрам запрещены (수출회원 입찰금지). */
  blockedExport: boolean;
  /** Срок оформления документов в днях. */
  docDays: number | null;
}

export type NoticeLevel = "block" | "bad" | "warn" | "info";

/** Площадки. Пока подключён только KCar, но ключ и схема рассчитаны на все. */
export type AuctionSource = "kcar" | "lotte" | "sk";

/** Строка auction_lots. */
export interface AuctionLot {
  source: AuctionSource;
  external_id: string;
  session: number | null;
  lane: string | null;
  auction_code: string | null;
  auction_date: string | null;
  auction_window: string | null;
  site: string | null;
  lot_no: number | null;
  plate: string | null;

  maker: string | null;
  maker_ko: string | null;
  model: string | null;
  model_ko: string | null;
  trim: string | null;
  name_ko: string | null;

  year: number | null;
  first_reg: string | null;
  mileage_km: number | null;
  fuel: string | null;
  transmission: string | null;
  color: string | null;
  usage: string | null;

  grade_ext: string | null;
  grade_int: string | null;
  defect_count: number | null;
  defect_parts: string[];
  mortgages: number | null;
  seizures: number | null;

  start_price_krw: number | null;
  reserve_price_krw: number | null;
  hammer_price_krw: number | null;
  status: string | null;

  remarks: string | null;
  notices: ParsedRemarks["notices"];
  conditions: string[];
  blocked_export: boolean;
  doc_days: number | null;

  vin: string | null;
  engine_cc: number | null;
  body_type: string | null;
  seats: number | null;
  drive: string | null;
  inspection: Record<string, string> | null;
  photos: string[];
  photo_count: number;
  diagram_url: string | null;
  source_url: string | null;

  updated_at: string;
}

/** Строка auction_results. Цены уже приведены к вонам. */
export interface AuctionResult {
  source: AuctionSource;
  external_id: string;
  session: number;
  lane: string | null;
  auction_date: string | null;
  site: string | null;

  maker: string | null;
  model: string | null;
  trim: string | null;
  year: number | null;
  mileage_km: number | null;
  fuel: string | null;
  transmission: string | null;
  usage: string | null;

  grade_ext: string | null;
  grade_int: string | null;
  defect_count: number | null;

  start_price_krw: number | null;
  reserve_price_krw: number | null;
  hammer_price_krw: number | null;
  sold: boolean;
}

export interface SyncResult {
  ok: boolean;
  kind: "lots" | "sales";
  fetched: number;
  upserted: number;
  enriched: number;
  error?: string;
  notes?: Record<string, unknown>;
}
