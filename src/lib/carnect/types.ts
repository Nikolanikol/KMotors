// Формы данных carnect.biz — КАК ОНИ ПРИХОДЯТ, без нашей нормализации.
//
// Почему сырые. Ядро парсера отвечает за одно: надёжно достать их объекты и
// честно сказать, если не вышло. Перевод в наши колонки (auction_lots), словари
// значений и выбор, что показывать клиенту, — отдельный слой поверх, его
// будем писать вместе с интерфейсом. Смешаем — любая правка витрины потянет
// за собой парсер.
//
// Поля сняты с живых ответов 02.10.2026 по всем пяти площадкам. Набор у
// площадок РАЗНЫЙ (у K Car есть afterBidKrw и startAt, у Autobell — usage и
// accidentHistory), поэтому всё, кроме идентификатора, необязательное, а
// индексная сигнатура сохраняет поля, которых мы ещё не знаем: новые поля
// carnect не должны теряться только потому, что их нет в этом файле.

/** Лот в списке площадки (/auctions/<house>). */
export interface CarnectListLot {
  /** "Glovis" | "KCar" | "Lotte" | "SK" | "Autohub" — подпись carnect. */
  source?: string;
  /**
   * Ключ лота у carnect, он же хвост адреса /lot/<house>/<lotId>.
   * Формат у каждой площадки свой: "SA~SA202609080018~3" (Lotte),
   * "1134.20.2100.NLliCN…" (Autobell), "AC20261001-CA20393111" (K Car).
   * ⚠️ Содержит "~", "." и base64 — в адрес только через encodeURIComponent.
   */
  lotId: string;
  /** Номер лота на торгах ("1001") — то, что называют в зале. */
  lotNo?: string;
  /** Идентификатор машины у самой площадки (Lotte: SA202609080018, K Car: CA20393111). */
  carId?: string;
  roundNo?: number;
  roundId?: string;
  /** День торгов, YYYY-MM-DD. */
  auctionDate?: string;
  /** Точное начало торгов, есть у K Car и Autohub. Время корейское, без зоны. */
  startAt?: string;
  lane?: string;
  location?: string;
  venue?: string;
  venueCode?: string;
  /** Статус торгов текстом площадки: "No Bid", "Entry closed", иногда по-корейски. */
  status?: string;
  make?: string;
  modelGroup?: string;
  model?: string;
  subModel?: string;
  grade?: string;
  titleEn?: string;
  titleKo?: string;
  year?: number;
  km?: number;
  cc?: number;
  fuel?: string;
  trans?: string;
  color?: string;
  usage?: string;
  /**
   * Стартовая цена в ВОНАХ — исходная валюта аукциона.
   * ⚠️ У Lotte всегда 0 (проверено на всех 1 321 лоте 02.10.2026): carnect
   * её не отдаёт. 0 здесь значит «неизвестно», а не «бесплатно».
   */
  startKrw?: number;
  /** Пересчёт carnect по их курсу. Не используем — правило проекта про чужую валюту. */
  startUsd?: number;
  /** Цена после торгов (K Car, Autohub). */
  afterBidKrw?: number;
  /** Оценка осмотра площадки: "A", "A/C", "F/F", "AB". Шкалы у площадок разные. */
  inspGrade?: string;
  vehicleNo?: string;
  /** Главное фото — лежит на CDN САМОЙ площадки, не у carnect. */
  photo?: string;
  [extra: string]: unknown;
}

/** Страница списка: сами лоты и счётчики carnect. */
export interface CarnectListPage {
  items: CarnectListLot[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Состояние ИХ синхронизации с площадкой — лежит рядом со списком.
 *
 * ⚠️ Это главный инструмент бережного обхода: если lastIngestAt не изменился
 * с нашего прошлого прогона, данные у carnect те же и обходить остальные
 * страницы незачем — хватило одного запроса.
 */
export interface CarnectIngest {
  lastIngestAt: string | null;
  lastStatus: string | null;
  /** Сколько лотов они реально забрали у площадки… */
  lastIngestCount: number | null;
  /** …и сколько площадка обещала. Расхождение — недобор у них, а не у нас. */
  lastIngestExpected: number | null;
}

/**
 * Лот на своей странице (/lot/<house>/<lotId>): всё из списка плюс детали.
 * Набор деталей у площадок разный — перечислены те, что видели.
 */
export interface CarnectLotDetail extends CarnectListLot {
  vin?: string;
  photos?: string[];
  options?: unknown[];
  /** Лист осмотра узлов: [{groupEn, items:[{name, status, ok}]}] или плоский список. */
  inspection?: unknown[];
  damages?: unknown[];
  /** Arrest/залог: {seizures, mortgages}. Autobell — legalStatus, K Car — legal. */
  legalStatus?: { seizures?: number; mortgages?: number };
  legal?: { seizures?: number; mortgages?: number };
  firstRegistrationDate?: string;
  /** Скан техпаспорта (Autobell). Лежит на CDN площадки. */
  registrationImage?: string;
  /** Скан листа осмотра (Autobell). */
  inspectionSheetImage?: string;
  /** Акт осмотра K Car: номер, дата, число окрашенных панелей. */
  inspectionRecord?: Record<string, unknown>;
  panelDiagram?: Record<string, unknown>;
  notes?: string;
  notesKo?: string;
}
