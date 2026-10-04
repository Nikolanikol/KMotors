// Единая карточка машины поверх шести источников carnect.
//
// Зачем. Площадки отдают РАЗНОЕ и называют одно и то же по-разному: арест и
// залог у Autobell лежат в `legalStatus`, у K Car в `legal`; страховая история
// у Autobell — `insuranceHistory` со snake_case, у Autohub — `insurance`, у
// HeyDealer — `heydealer.history`; повреждения кузова у K Car и Autohub —
// `panelDiagram.marks`, у HeyDealer — `accidentDiagram.repairs` плюс толщиномер.
// Если страница будет знать про каждую форму, любая правка у источника потянет
// за собой вёрстку.
//
// Поэтому: ОДНА модель (`CarCard`) и по переходнику на источник (`fromLot`,
// `fromHey`). Страница рисует только карточку; блок без данных просто не
// показывается. Новое поле у carnect — правка одного переходника.
//
// Формы полей сняты с живых ответов 02.10.2026 — по 4 лота на площадку и по
// 3–4 машины на тип HeyDealer. Сводка — docs/carnect-fields.md.
//
// ⚠️ Деление «видит клиент» / «только мы» зашито В МОДЕЛЬ, а не в вёрстку:
// всё служебное лежит в `internal`. Публичная витрина возьмёт ту же карточку и
// просто не станет рисовать `internal` — решить, что показывать клиенту, второй
// раз будет негде (решения владельца 02.10.2026, docs/carnect-fields.md).
//
// Язык клиентской части — аргумент переходника (lang.ts): витрина на
// английском, служебный каталог на русском (решение владельца 04.10.2026).
// Словари клиентских полей поэтому — пары [ru, en]. `internal` только русский.

import { CARNECT_ORIGIN } from "./client";
import { parseNotes } from "./defects";
import type { HeyCarDetail } from "./heydealer";
import { HEY_TYPES } from "./heydealer";
import { HOUSES, type CarnectHouse } from "./houses";
import { canonicalMake, canonicalModelGroup, heyModelGroup, normalizeFuel, normalizeTrans, positive } from "./normalize";
import { look, pick, type CardLang, type Pair } from "./lang";
import { FUELS } from "./query";
import type { CarnectLotDetail } from "./types";

// ─── Модель ──────────────────────────────────────────────────────────────

/** Что сделали с панелью. Порядок — по тяжести для покупателя. */
export type BodyAction =
  | "replaced" // замена
  | "welded" // рихтовка / сварка
  | "painted" // окрас (по толщиномеру)
  | "adjusted" // регулировка (K Car «Adjusted»)
  | "need_replace" // нужна замена — сейчас
  | "need_repair" // нужен ремонт — сейчас
  | "other";

export interface BodyMark {
  /** Наш ключ панели (`fender_front_left`) или null — не распознали. */
  panel: string | null;
  /** Подпись на языке карточки; не распознали — как у источника. */
  label: string;
  action: BodyAction;
  /**
   * past — ремонт уже был (история машины); current — нужен сейчас (будущие
   * расходы покупателя). Смешивать нельзя: на схеме это разные цвета.
   */
  when: "past" | "current";
  /** Силовой элемент: стойка, лонжерон, пол, порог. Главное для покупателя. */
  structural: boolean;
  /** Толщиномер HeyDealer: уровень, если отметка оттуда. */
  paintLevel?: string;
}

export interface CheckItem {
  name: string;
  status: string;
  /** false — узел требует внимания. */
  ok: boolean | null;
}

export interface CheckGroup {
  title: string;
  items: CheckItem[];
}

export interface CarCard {
  /** Площадка или HeyDealer. */
  house: CarnectHouse | "heydealer";
  sourceLabel: string;
  /** Тип торгов HeyDealer (Self / Zero / Instant) и что он значит. */
  typeLabel?: string;
  typeHint?: string;

  title: string;
  /** Комплектация. */
  grade?: string;
  make: string | null;
  /**
   * Модельная группа в нашей нормализации (normalize.ts) — та же, что в колонке
   * carnect_lots.model_group. По ней подбираются похожие машины (similar.ts).
   */
  modelGroup: string | null;
  model?: string;
  year: number | null;
  km: number | null;
  cc: number | null;
  fuel?: string;
  trans?: string;
  color?: string;
  interior?: string;
  body?: string;
  seats?: number | null;
  usage?: string;
  firstRegistration?: string;
  vin?: string;
  plate?: string;

  price: { kind: "start" | "fixed" | "none"; krw: number | null };
  /** Цена новой машины (HeyDealer). */
  newPriceKrw: number | null;

  /** Торги аукциона: день (YYYY-MM-DD) и точное время, если есть. */
  auctionDate?: string;
  startAt?: string;
  /** Окончание торгов HeyDealer, ISO с +09:00. */
  endAt?: string;
  venue?: string;
  lotNo?: string;

  photos: string[];
  /** Оценка осмотра площадки. Шкалы разные — расшифровка отдельной задачей. */
  inspGrade?: string;
  /** Итог по ДТП одной строкой. */
  accident?: string;
  legal: { seizures: number | null; mortgages: number | null } | null;
  history: {
    owners?: number | null;
    plateChanges?: number | null;
    myClaims?: number | null;
    myClaimsKrw?: number | null;
    otherClaims?: number | null;
    otherClaimsKrw?: number | null;
    /** Сумма ущерба диапазоном, как пишет Autobell («~₩1M»). */
    damageRange?: string;
    totalLoss?: number | null;
    flood?: number | null;
    theft?: number | null;
    /** Периоды без страховки (Autohub): ДТП за это время в истории не видно. */
    uninsured?: number | null;
  } | null;
  bodyMarks: BodyMark[];
  /** Источник отдаёт структуру кузова (иначе есть только скан листа). */
  hasBodyData: boolean;
  /**
   * Скан листа осмотра площадки (Lotte, SK, Autobell). Клиенту ПОКАЗЫВАЕМ
   * (решение владельца 02.10.2026): у этих площадок схема кузова есть только на
   * нём. Скан техпаспорта при этом остаётся у нас (`internal.scans`).
   */
  inspectionSheet?: string;
  /**
   * Видео со звуком работающего двигателя (HeyDealer, `engineSound.url`).
   * Клиенту ПОКАЗЫВАЕМ плеером (решение владельца 04.10.2026); до этого
   * ссылка лежала голой строкой в служебных фактах. У аукционов такого поля
   * в разборе нет.
   */
  engineSound?: string;
  /**
   * Дефекты, найденные площадкой (`notes`), по-русски — defects.ts. Клиент
   * ВИДИТ (решение владельца 04.10.2026). Юридический текст площадки отсечён.
   */
  defects: string[];
  /** Состояние со слов продавца — HeyDealer Self, где осмотра нет. */
  sellerSays: string[];
  /** Ключи: «2», «1», «есть запасной». */
  keys?: string;
  /** Код двигателя (CRT, D4HB) — по нему ищут запчасти. */
  engineCode?: string;
  /** Дата производства (HeyDealer), отличается от даты регистрации. */
  manufactured?: string;
  /** Официальный акт осмотра площадки: «№ 2651068214 от 2026-09-18, K Car Sejong Auction». */
  inspectionAct?: string;
  checks: CheckGroup[];
  options: string[];

  /** ⚠️ Только для нас — клиенту не показывается (решение владельца 02.10.2026). */
  internal: {
    /** Страница машины у carnect — первоисточник в один клик. */
    sourceUrl: string;
    scans: { label: string; url: string }[];
    /** Торги и сделка: статус, ставки, цена после торгов, место на площадке. */
    deal: InternalRow[];
    /** Документы для экспорта: что приложено и чего нет. */
    documents: { have: string[]; missing: string[] };
    /** Прочее полезное: что лежит в машине, срок техосмотра, отсутствующие опции. */
    facts: InternalRow[];
    /** Что проверить до ставки: противоречия и тревожные признаки. */
    flags: { text: string; warn: boolean }[];
    /** Замечания в оригинале, по источнику — сверять с нашим переводом. */
    notes: { label: string; lines: string[] }[];
    /** Фразы замечаний, которых нет в словаре defects.ts, — по ним его пополняют. */
    unknownPhrases: string[];
  };
  /**
   * Ключи сырых данных, которые уже стоят на карточке клиента (через точку для
   * вложенных: «heydealer.history»). В таблице «Все поля» по ним видно, что из
   * данных ещё не выведено.
   */
  shownKeys: string[];
  raw: Record<string, unknown>;
}

export interface InternalRow {
  label: string;
  value: string | null | undefined;
}

/** Строка/число → текст для служебной строки; пустое — null (строка не рисуется). */
function txt(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return v.toLocaleString("ru-RU");
  if (typeof v === "string") return v.trim() || null;
  return JSON.stringify(v);
}

/** «a, b, c» → [a, b, c]; строка без запятых — один пункт (у Autobell список склеен пробелами). */
function listOf(v: unknown): string[] {
  const s = txt(v);
  if (!s) return [];
  return s.includes(",") ? s.split(/,\s*/).filter(Boolean) : [s];
}

const LOT_SHOWN = [
  "make", "modelGroup", "model", "grade", "titleEn", "year", "km", "cc", "fuel", "trans", "color",
  "body", "vehicleType", "segment", "seats", "usage", "firstRegistrationDate", "vin", "vehicleNo",
  "startKrw", "auctionDate", "startAt", "venue", "location", "lotNo", "photos", "photo", "inspGrade",
  "accidentTag", "accidentHistory", "legalStatus", "legal", "insuranceHistory", "insuranceDamage",
  "insurance", "panelDiagram", "inspectionSheetImage", "inspection", "options", "notes", "motorCode",
  "inspectionRecord", "properties.Seating", "properties.Stored items", "properties.engine_model",
];

const HEY_SHOWN = [
  "make", "model", "year", "km", "cc", "fuel", "trans", "color", "krw", "endAt", "photos", "photo",
  "gradeEn", "options", "originPriceKrw", "heydealer.auctionType", "heydealer.accidentGrade",
  "heydealer.accidentDiagram", "heydealer.history", "heydealer.conditionRows", "heydealer.conditionItems",
  "heydealer.paint", "heydealer.interior", "heydealer.carNumber", "heydealer.vehicleInfo",
  "heydealer.engineSound", "heydealer.imageGroups", "heydealer.msrpKrw",
];

// ─── Словари ─────────────────────────────────────────────────────────────

const FUEL_LABEL = Object.fromEntries(FUELS.map((f) => [f.v, [f.label, f.en] as Pair])) as Record<string, Pair>;

function fuelLabel(raw: string | undefined, lang: CardLang): string | undefined {
  const f = normalizeFuel(raw);
  if (!f) return undefined;
  return look(FUEL_LABEL, f, lang) ?? raw;
}

function transLabel(raw: string | undefined, lang: CardLang): string | undefined {
  const t = normalizeTrans(raw);
  return t === "manual" ? pick(lang, ["Механика", "Manual"]) : t === "auto" ? pick(lang, ["Автомат", "Automatic"]) : undefined;
}

const USAGE: Record<string, Pair> = {
  rental: ["Прокат", "Rental"],
  "private use": ["Личная", "Private"],
  personal: ["Личная", "Private"],
  "personal/corporate": ["Личная / юрлицо", "Private / company"],
  corporate: ["Юрлицо", "Company"],
  "dealer stock": ["Сток дилера", "Dealer stock"],
  taxi: ["Такси", "Taxi"],
  commercial: ["Коммерческая", "Commercial"],
};

function usageLabel(raw: string | undefined, lang: CardLang): string | undefined {
  const s = (raw ?? "").trim();
  if (!s || s.toLowerCase() === "none") return undefined;
  return look(USAGE, s.toLowerCase(), lang) ?? s;
}

/** Узлы листа осмотра. Ключ — английское имя у источника, в нижнем регистре. */
const CHECK_NAMES: Record<string, Pair> = {
  engine: ["Двигатель", "Engine"],
  transmission: ["Коробка передач", "Transmission"],
  powertrain: ["Трансмиссия", "Powertrain"],
  "power train": ["Трансмиссия", "Powertrain"],
  "power transmission": ["Трансмиссия", "Powertrain"],
  "drive shaft": ["Приводной вал", "Drive shaft"],
  steering: ["Рулевое", "Steering"],
  braking: ["Тормоза", "Brakes"],
  brakes: ["Тормоза", "Brakes"],
  electrical: ["Электрика", "Electrical"],
  "battery / electrical": ["Аккумулятор и электрика", "Battery and electrical"],
  "charging system": ["Зарядка", "Charging"],
  "starting system": ["Запуск", "Starting"],
  "air conditioning": ["Кондиционер", "Air conditioning"],
  hvac: ["Кондиционер", "Air conditioning"],
  "a/c unit": ["Кондиционер", "Air conditioning"],
  interior: ["Салон", "Interior"],
  "interior odour": ["Запах в салоне", "Interior odour"],
  "interior trim/interior panel": ["Обшивка салона", "Interior trim"],
  seat: ["Сиденья", "Seats"],
  lighting: ["Свет", "Lighting"],
  dlr: ["Ходовые огни", "Daytime running lights"],
  drl: ["Ходовые огни", "Daytime running lights"],
  "headlamp/rear lamp": ["Фары и фонари", "Head and rear lamps"],
  "running gear": ["Ходовая", "Running gear"],
  "electric vehicle (ev)": ["Электросистема EV", "EV system"],
  "cooling system": ["Охлаждение", "Cooling"],
  "operating condition": ["Работа", "Operation"],
  "warning light": ["Индикаторы на приборке", "Dashboard warning lights"],
  "body corrosion": ["Коррозия кузова", "Body corrosion"],
  "structural change": ["Изменение конструкции", "Structural modification"],
  "illegal modification": ["Незаконные переделки", "Illegal modification"],
};

const CHECK_GROUPS: Record<string, Pair> = {
  "condition check": ["Состояние узлов", "Component condition"],
  "condition report": ["Состояние узлов", "Component condition"],
  "performance check": ["Состояние узлов", "Component condition"],
  "inspection record": ["Акт техосмотра", "Roadworthiness record"],
  "warning lights": ["Индикаторы", "Warning lights"],
  "air conditioning": ["Кондиционер", "Air conditioning"],
};

const CHECK_STATUS: Record<string, Pair> = {
  good: ["Хорошо", "Good"],
  normal: ["Норма", "Normal"],
  average: ["Средне", "Average"],
  fair: ["Удовлетворительно", "Fair"],
  none: ["Нет", "None"],
  "needs repair": ["Требует ремонта", "Needs repair"],
  "needs service": ["Требует обслуживания", "Needs service"],
  "maintenance required": ["Требует обслуживания", "Needs service"],
  defect: ["Неисправно", "Defective"],
  defective: ["Неисправно", "Defective"],
};

/** Расшифровка в скобках: «Needs repair (Noise, Oil leak)». */
const CHECK_DETAIL: Record<string, Pair> = {
  "oil leak": ["течь масла", "oil leak"],
  noise: ["шум", "noise"],
  play: ["люфт", "play"],
  impact: ["удары", "knocking"],
  "seat defect": ["дефект сидений", "seat defect"],
  "interior panel defect": ["дефект обшивки", "trim defect"],
  // Autohub иногда оставляет корейские слова внутри английского статуса.
  지연: ["задержка переключения", "delayed shifting"],
  터보defect: ["дефект турбины", "turbo defect"],
};

function checkStatus(raw: string, lang: CardLang): string {
  const m = /^([^(]+?)\s*(?:\((.*)\))?$/.exec(raw.trim());
  if (!m) return raw;
  const head = look(CHECK_STATUS, m[1].toLowerCase(), lang) ?? m[1];
  if (!m[2]) return head;
  const tail = m[2]
    .split(",")
    .map((t) => look(CHECK_DETAIL, t.trim().toLowerCase(), lang) ?? t.trim())
    .join(", ");
  return `${head} (${tail})`;
}

/**
 * Узел не в порядке. У площадок `ok` уже посчитан; где его нет — по словам
 * статуса. «Average» / «Fair» нормой считаем: так площадки пишут обычный износ.
 */
function checkOk(it: { ok?: unknown; status?: unknown }): boolean | null {
  if (typeof it.ok === "boolean") return it.ok;
  const s = String(it.status ?? "").toLowerCase();
  if (!s) return null;
  return !/repair|defect|service|maintenance|점등/.test(s);
}

// ─── Панели кузова ───────────────────────────────────────────────────────
//
// Словарь строится не по кодам источников, а по АНГЛИЙСКИМ названиям: коды у
// всех свои («0407» у K Car, «EX_FRONT_BUMPER» у Autohub, «fender_front_driver»
// у HeyDealer), а названия читаются одним разбором. Сторона: Корея — левый
// руль, значит driver = левая сторона, passenger = правая.

type Gender = "m" | "f" | "n";

const PART_NAMES: { re: RegExp; key: string; ru: string; en: string; g: Gender; structural?: boolean }[] = [
  { re: /bonnet|hood/, key: "hood", ru: "Капот", en: "Hood", g: "m" },
  { re: /trunk|tailgate|back door/, key: "trunk", ru: "Крышка багажника", en: "Trunk lid", g: "f" },
  { re: /roof/, key: "roof", ru: "Крыша", en: "Roof", g: "f" },
  { re: /quarter/, key: "quarter", ru: "Заднее крыло", en: "Quarter panel", g: "n" },
  { re: /fender/, key: "fender", ru: "Крыло", en: "Fender", g: "n" },
  { re: /door/, key: "door", ru: "Дверь", en: "Door", g: "f" },
  { re: /bumper/, key: "bumper", ru: "Бампер", en: "Bumper", g: "m" },
  { re: /mirror/, key: "mirror", ru: "Зеркало", en: "Mirror", g: "n" },
  { re: /windshield|front glass|windscreen/, key: "windshield", ru: "Лобовое стекло", en: "Windshield", g: "n" },
  { re: /rear glass|rear window/, key: "rear_glass", ru: "Заднее стекло", en: "Rear glass", g: "n" },
  // Порог в корейском листе осмотра — внешняя панель второго ранга, не силовой каркас.
  { re: /\bsil|step|rocker/, key: "sill", ru: "Порог", en: "Side sill", g: "m" },
  { re: /pillar/, key: "pillar", ru: "Стойка", en: "Pillar", g: "f", structural: true },
  { re: /member/, key: "member", ru: "Лонжерон", en: "Side member", g: "m", structural: true },
  { re: /wheel ?house/, key: "wheelhouse", ru: "Колёсная арка", en: "Wheelhouse", g: "f", structural: true },
  { re: /floor/, key: "floor", ru: "Пол", en: "Floor panel", g: "m", structural: true },
  { re: /dash/, key: "dash", ru: "Моторный щит", en: "Dash panel", g: "m", structural: true },
  { re: /radiator/, key: "radiator", ru: "Рамка радиатора", en: "Radiator support", g: "f" },
  { re: /cross/, key: "cross", ru: "Поперечина", en: "Cross member", g: "f", structural: true },
  { re: /rear panel|back panel/, key: "rear_panel", ru: "Задняя панель", en: "Rear panel", g: "f", structural: true },
];

/** Окончания прилагательных по роду: передн-ий / -яя / -ее, лев-ый / -ая / -ое. */
const ADJ: Record<string, Record<Gender, string>> = {
  front: { m: "передний", f: "передняя", n: "переднее" },
  rear: { m: "задний", f: "задняя", n: "заднее" },
  left: { m: "левый", f: "левая", n: "левое" },
  right: { m: "правый", f: "правая", n: "правое" },
};

/** Детали, у которых «перед / зад» — часть названия, а не уточнение. */
const HAS_END = new Set(["fender", "door", "bumper", "pillar", "member", "wheelhouse"]);

/** «Front Fender (Right)», «fender_front_driver», «Quarter panel (R)» → наш ключ и подпись. */
function panelOf(name: string, lang: CardLang): { panel: string | null; label: string; structural: boolean } {
  const s = name.toLowerCase().replace(/_/g, " ");
  const part = PART_NAMES.find((p) => p.re.test(s));
  if (!part) return { panel: null, label: name || "—", structural: false };

  const end = /\bfront\b/.test(s) ? "front" : /\brear\b/.test(s) ? "rear" : "";
  const side = /\(l\)|\bleft\b|\bdriver\b/.test(s) ? "left" : /\(r\)|\bright\b|\bpassenger\b/.test(s) ? "right" : "";

  // «fender_rear_…» у HeyDealer и «Rear Fender» у Autohub — это заднее крыло,
  // то же, что «Quarter panel» у K Car. Сводим к одному ключу.
  const isQuarter = part.key === "quarter" || (part.key === "fender" && end === "rear");
  const key = isQuarter ? "quarter" : part.key;
  const base = isQuarter ? "Заднее крыло" : part.ru;
  const g: Gender = isQuarter ? "n" : part.g;
  const withEnd = !isQuarter && end && HAS_END.has(key) ? end : "";
  const panel = [key, withEnd, side].filter(Boolean).join("_");

  // По-английски прилагательные идут перед словом и рода не знают:
  // «Left front door», «Right quarter panel».
  if (lang === "en") {
    const en = [side, withEnd, (isQuarter ? "Quarter panel" : part.en).toLowerCase()].filter(Boolean).join(" ");
    return { panel, label: en[0].toUpperCase() + en.slice(1), structural: !!part.structural };
  }
  const words = [base];
  if (withEnd) words.push(ADJ[withEnd][g]);
  if (side) words.push(ADJ[side][g]);
  return { panel, label: words.join(" "), structural: !!part.structural };
}

/** Коды панелей K Car и Autohub. Расшифровка в labelEn есть не всегда. */
function markAction(code: string, label: string, when: string): BodyAction {
  const c = code.toUpperCase();
  const l = label.toLowerCase();
  if (when === "current") {
    if (c === "X" || l.includes("exchange")) return "need_replace";
    return "need_repair";
  }
  if (c === "X" || c === "XX" || l.includes("exchang")) return "replaced";
  if (c === "W" || l.includes("weld") || l.includes("beaten")) return "welded";
  if (c === "G" || l.includes("adjust")) return "adjusted";
  if (l.includes("paint")) return "painted";
  return "other";
}

const PAINT_LEVEL: Record<string, Pair> = {
  slightly_thick: ["немного повышена", "slightly above factory"],
  very_thick: ["сильно повышена", "well above factory"],
  extremely_thick: ["очень сильно повышена", "far above factory"],
};

// ─── Общие куски ─────────────────────────────────────────────────────────

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);

const ACCIDENT_TAG: Record<string, Pair> = {
  NONE: ["Без ДТП", "No accidents"],
  ACCIDENT: ["Было ДТП", "Accident history"],
  REPLACE: ["Замена деталей", "Parts replaced"],
};

const HEY_ACCIDENT: Record<string, Pair> = {
  complete_no_accident: ["Без ДТП", "No accidents"],
  accident: ["Было ДТП", "Accident history"],
  simple_exchange_no_accident: ["Простая замена, без ДТП", "Simple part swap, no accident"],
};

/**
 * Оценка HeyDealer по коду (`complete_no_accident` → «No accidents»). В каталоге
 * она лежит в insp_grade строкой-кодом; незнакомый код — как есть.
 */
export function heyGradeLabel(code: string, lang: CardLang): string {
  return look(HEY_ACCIDENT, code, lang) ?? code;
}

const INSPECTION: Pair = ["Осмотр", "Inspection"];
const CONDITION: Pair = ["Состояние узлов", "Component condition"];

function checkGroups(raw: unknown, lang: CardLang): CheckGroup[] {
  if (!Array.isArray(raw)) return [];
  const out: CheckGroup[] = [];
  const loose: CheckItem[] = [];
  const item = (x: Record<string, unknown>): CheckItem => ({
    name: look(CHECK_NAMES, String(x.name ?? "").toLowerCase(), lang) ?? String(x.name ?? "—"),
    status: checkStatus(String(x.status ?? ""), lang),
    ok: checkOk(x),
  });
  for (const g of raw) {
    if (!g || typeof g !== "object") continue;
    const o = g as Record<string, unknown>;
    if (Array.isArray(o.items)) {
      const title = String(o.groupEn ?? o.title ?? "");
      // Внешние панели K Car уже есть в схеме кузова — второй раз списком не нужны.
      if (title.toLowerCase() === "exterior panels") continue;
      out.push({
        title:
          look(CHECK_GROUPS, title.toLowerCase(), lang) ??
          look(CHECK_NAMES, title.toLowerCase(), lang) ??
          (title || pick(lang, INSPECTION)),
        items: (o.items as Record<string, unknown>[]).map(item),
      });
    } else {
      loose.push(item(o));
    }
  }
  if (loose.length) out.push({ title: pick(lang, INSPECTION), items: loose });
  return mergeOneLiners(out, lang);
}

/**
 * У Autohub 13 групп по одному-двум пунктам («Двигатель → Работа»). Сводим их в
 * одну «Состояние узлов», подставляя группу в имя: иначе вместо таблицы —
 * тринадцать карточек с одной строкой.
 */
function mergeOneLiners(groups: CheckGroup[], lang: CardLang): CheckGroup[] {
  if (groups.length < 6) return groups;
  const operation = look(CHECK_NAMES, "operating condition", lang);
  const items = groups.flatMap((g) =>
    g.items.map((it) => ({ ...it, name: it.name === operation || it.name === g.title ? g.title : `${g.title}: ${it.name}` })),
  );
  return [{ title: pick(lang, CONDITION), items }];
}

function optionList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const o of raw) {
    if (typeof o === "string") out.push(o);
    else if (o && typeof o === "object" && Array.isArray((o as { items?: unknown }).items)) {
      // HeyDealer: [{category, items:[{ko, en}]}]
      for (const it of (o as { items: { en?: string; ko?: string }[] }).items) {
        const s = it.en ?? it.ko;
        if (s) out.push(s);
      }
    }
  }
  return [...new Set(out)];
}

function makeTitle(make: string | null, model: string | undefined, year: number | null, lang: CardLang): string {
  return [year, make, model].filter(Boolean).join(" ") || pick(lang, ["Машина", "Car"]);
}

const krwText = (v: unknown) => (positive(v) ? `₩${positive(v)!.toLocaleString("ru-RU")}` : null);

/** Что проверить до ставки. warn — красным, остальное — справка. */
function lotFlags(
  lot: CarnectLotDetail,
  raw: Record<string, unknown>,
  props: Record<string, unknown>,
  history: CarCard["history"],
  legal: { seizures?: number; mortgages?: number } | undefined,
): { text: string; warn: boolean }[] {
  const out: { text: string; warn: boolean }[] = [];
  // Пробег по реестру (Autohub): обычно это запись прошлого техосмотра и она
  // МЕНЬШЕ пробега лота — норма. Больше — повод заподозрить скрутку.
  const ledger = Number(String(props["Ledger mileage"] ?? "").replace(/\D/g, "")) || null;
  const km = positive(lot.km);
  if (ledger && km) {
    out.push(
      ledger > km
        ? { text: `Пробег по реестру ${ledger.toLocaleString("ru-RU")} км БОЛЬШЕ пробега лота ${km.toLocaleString("ru-RU")} км — проверить на скрутку`, warn: true }
        : { text: `Пробег по реестру ${ledger.toLocaleString("ru-RU")} км (лот ${km.toLocaleString("ru-RU")} км) — старая запись, норма`, warn: false },
    );
  }
  // Autobell: метка площадки и страховая история говорят о разном.
  if (raw.accidentTag === "ACCIDENT" && str(raw.accidentHistory) === "No") {
    out.push({ text: "Метка площадки «ДТП», а страховых случаев нет — вероятно, ремонт кузова без страховой", warn: true });
  }
  if (history?.uninsured) out.push({ text: `Периоды без страховки: ${history.uninsured}`, warn: true });
  if (history?.totalLoss) out.push({ text: `Тотал по страховой: ${history.totalLoss}`, warn: true });
  if (history?.flood) out.push({ text: `Утопленник по страховой: ${history.flood}`, warn: true });
  if (legal?.seizures) out.push({ text: `Аресты: ${legal.seizures}`, warn: true });
  if (legal?.mortgages) out.push({ text: `Залоги: ${legal.mortgages}`, warn: true });
  if (/rental|taxi|lease/i.test(String(lot.usage ?? ""))) out.push({ text: `Использование: ${lot.usage}`, warn: false });
  if (listOf(props.documents_missing).length) out.push({ text: "Не хватает документов — см. «Документы»", warn: true });
  return out;
}

// ─── Переходник: лот аукциона ────────────────────────────────────────────

export function fromLot(house: CarnectHouse, lot: CarnectLotDetail, lang: CardLang = "ru"): CarCard {
  const raw = lot as Record<string, unknown>;
  const group = canonicalModelGroup(lot.modelGroup);
  const make = canonicalMake(lot.make, group, lot.titleEn);
  const year = positive(lot.year);
  const legalRaw = lot.legalStatus ?? lot.legal;
  const props = (raw.properties ?? {}) as Record<string, unknown>;

  // Страховая история: Autobell — insuranceHistory (snake_case) + insuranceDamage,
  // Autohub — insurance. У остальных площадок её нет.
  const ih = raw.insuranceHistory as Record<string, unknown> | undefined;
  const ins = raw.insurance as Record<string, unknown> | undefined;
  const special = (ih?.special_accidents ?? {}) as Record<string, unknown>;
  const history: CarCard["history"] = ih
    ? {
        owners: num(ih.owner_changes),
        plateChanges: num(ih.plate_changes),
        damageRange: str(raw.insuranceDamage),
        totalLoss: num(special.total_loss),
        flood: (num(special.flood_total) ?? 0) + (num(special.flood_partial) ?? 0),
        theft: num(special.theft),
      }
    : ins
      ? {
          owners: num(ins.ownerChanges),
          plateChanges: num(ins.plateChanges),
          myClaims: num(ins.selfClaims),
          myClaimsKrw: num(ins.selfClaimKrw),
          otherClaims: num(ins.otherClaims),
          otherClaimsKrw: num(ins.otherClaimKrw),
          totalLoss: num(ins.totalLoss),
          flood: num(ins.floodLoss),
          theft: num(ins.stolen),
          uninsured: num(ins.uninsuredSpells),
        }
      : null;

  const marks = ((lot.panelDiagram as { marks?: Record<string, unknown>[] } | undefined)?.marks ?? []).map(
    (m): BodyMark => {
      const p = panelOf(String(m.nameEn ?? m.key ?? ""), lang);
      const when = m.when === "current" ? "current" : "past";
      return { ...p, action: markAction(String(m.code ?? ""), String(m.labelEn ?? ""), when), when };
    },
  );

  const notes = parseNotes(str(lot.notes), lang);
  const rec = (lot.inspectionRecord ?? {}) as Record<string, unknown>;
  const act = [
    rec.recordNo != null ? `${pick(lang, ["№", "No."])} ${rec.recordNo}` : null,
    str(rec.inspectedOn) ? `${pick(lang, ["от", "dated"])} ${str(rec.inspectedOn)}` : null,
  ].filter(Boolean).join(" ");
  // Ключи: «Keys 1EA» в заметках K Car или «Smart key2(inside)» у Lotte.
  const stored = str(props["Stored items"]);
  const storedKeys = stored && /key\s*(\d+)/i.exec(stored)?.[1];

  const startKrw = positive(lot.startKrw);
  const scans = lot.registrationImage ? [{ label: "Техпаспорт", url: lot.registrationImage }] : [];

  return {
    house,
    sourceLabel: HOUSES[house].name.replace(/ \(.*\)$/, ""),
    title: makeTitle(make, group ?? lot.model, year, lang),
    grade: str(lot.grade) ?? str(lot.titleEn),
    make,
    modelGroup: group,
    model: str(lot.model),
    year,
    km: positive(lot.km),
    cc: positive(lot.cc),
    fuel: fuelLabel(lot.fuel, lang),
    trans: transLabel(lot.trans, lang),
    color: str(lot.color) === "Other" ? undefined : str(lot.color),
    body: str(raw.body) ?? str(raw.vehicleType) ?? str(raw.segment),
    seats: num(raw.seats) ?? (props.Seating ? Number(props.Seating) || null : null),
    usage: usageLabel(lot.usage, lang),
    firstRegistration: str(lot.firstRegistrationDate),
    vin: str(lot.vin),
    plate: str(lot.vehicleNo),
    price: startKrw ? { kind: "start", krw: startKrw } : { kind: "none", krw: null },
    newPriceKrw: null,
    auctionDate: str(lot.auctionDate),
    startAt: str(lot.startAt),
    venue: str(lot.venue) ?? str(lot.location),
    lotNo: str(lot.lotNo),
    photos: lot.photos?.length ? lot.photos : lot.photo ? [lot.photo] : [],
    inspGrade: str(lot.inspGrade),
    accident:
      look(ACCIDENT_TAG, String(raw.accidentTag ?? ""), lang) ??
      (str(raw.accidentHistory) === "No"
        ? look(ACCIDENT_TAG, "NONE", lang)
        : str(raw.accidentHistory) === "Yes"
          ? look(ACCIDENT_TAG, "ACCIDENT", lang)
          : undefined),
    legal: legalRaw ? { seizures: num(legalRaw.seizures), mortgages: num(legalRaw.mortgages) } : null,
    history,
    bodyMarks: marks,
    hasBodyData: !!lot.panelDiagram,
    inspectionSheet: str(lot.inspectionSheetImage),
    defects: notes.defects,
    sellerSays: [],
    keys: notes.keys != null ? String(notes.keys) : storedKeys || undefined,
    engineCode: str(raw.motorCode) ?? str(props.engine_model),
    inspectionAct: act ? [act, str(rec.recordIssuer)].filter(Boolean).join(", ") : undefined,
    checks: checkGroups(lot.inspection, lang),
    options: optionList(lot.options),
    internal: {
      sourceUrl: `${CARNECT_ORIGIN}/lot/${house}/${encodeURIComponent(lot.lotId)}`,
      scans,
      deal: [
        { label: "Статус торгов", value: txt(lot.status) ?? txt(raw.bidStatus) },
        { label: "Цена после торгов", value: krwText(lot.afterBidKrw) },
        { label: "Ряд", value: txt(lot.lane) },
        { label: "Стоянка", value: txt(raw.parkingSlot) ?? txt(raw.pkltNo) ?? txt(props.lot_position) },
        { label: "Раунд", value: txt(lot.roundId) },
        { label: "Id у площадки", value: txt(lot.carId) },
      ],
      documents: {
        have: listOf(props.Documents ?? props.documents_complete),
        missing: listOf(props.documents_missing),
      },
      facts: [
        { label: "В машине", value: txt(props["Stored items"]) ?? txt(props.storage_items) },
        { label: "Техосмотр действует до", value: txt(raw.inspectionValidUntil) ?? txt(props["Inspection valid until"]) },
        { label: "Пробег по реестру", value: txt(props["Ledger mileage"]) },
        { label: "Тип товара", value: txt(props.product_type) },
        { label: "Нет опций", value: Array.isArray(raw.disabledOptions) ? (raw.disabledOptions as string[]).join(", ") : null },
      ],
      flags: lotFlags(lot, raw, props, history, legalRaw),
      notes: [
        { label: "Площадка (английский)", lines: str(lot.notes) ? [str(lot.notes)!] : [] },
        { label: "Площадка (корейский)", lines: str(lot.notesKo) ? [str(lot.notesKo)!] : [] },
      ].filter((n) => n.lines.length),
      unknownPhrases: notes.unknown,
    },
    shownKeys: LOT_SHOWN,
    raw,
  };
}

// ─── Переходник: машина HeyDealer ────────────────────────────────────────

/** Подписи строк осмотра HeyDealer (`conditionRows`). Незнакомые — как у источника. */
const HEY_ROWS: Record<string, Pair> = {
  tire: ["Шины", "Tires"],
  outer_panel_scratch: ["Панели с повреждениями", "Damaged panels"],
  wheel_scratch: ["Диски с царапинами", "Scratched wheels"],
  leakage: ["Течи", "Leaks"],
  dashboard_warning: ["Ошибки на приборке", "Dashboard warnings"],
  option_malfunction: ["Неисправные опции", "Faulty options"],
};

function heyRow(r: Record<string, unknown>, lang: CardLang): CheckItem {
  const name = look(HEY_ROWS, String(r.key), lang) ?? String(r.label ?? r.key ?? "—");
  const none = pick(lang, ["нет", "none"]);
  let status: string;
  if (r.kind === "tires") {
    const [f, b] = [r.front ?? "?", r.rear ?? "?"];
    status = lang === "en" ? `tread left: front ${f}%, rear ${b}%` : `остаток: перед ${f}%, зад ${b}%`;
  } else if (r.kind === "count") status = r.count ? `${r.count}` : none;
  else if (r.kind === "bool") status = r.ok === false ? pick(lang, ["есть", "yes"]) : none;
  else status = typeof r.ok === "boolean" ? pick(lang, r.ok ? ["в порядке", "OK"] : ["есть замечания", "issues noted"]) : "—";
  return { name, status, ok: typeof r.ok === "boolean" ? r.ok : null };
}

/** Строки «Body Panel : None» у HeyDealer Self — подписи и частые значения. */
const SELLER_LABEL: Record<string, Pair> = {
  "body panel": ["Кузовные панели", "Body panels"],
  tire: ["Шины", "Tires"],
  tires: ["Шины", "Tires"],
  "wheel scratch": ["Царапины на дисках", "Wheel scratches"],
  "spare key": ["Запасной ключ", "Spare key"],
};
const SELLER_VALUE: Record<string, Pair> = {
  none: ["нет", "none"],
  "all good": ["в порядке", "all good"],
  present: ["есть", "yes"],
  absent: ["нет", "no"],
};

/** «Wheel Scratch : 1 wheel» → «Царапины на дисках: 1 wheel». Незнакомое — как есть, с хангылем — выкидываем. */
function sellerLine(line: string, lang: CardLang): string | null {
  const m = /^\s*([^:]+?)\s*:\s*(.+)$/.exec(line);
  if (!m) return /[\u3131-\uD79D]/.test(line) ? null : line.trim() || null;
  const label = look(SELLER_LABEL, m[1].toLowerCase(), lang) ?? m[1];
  const value = look(SELLER_VALUE, m[2].trim().toLowerCase(), lang) ?? m[2].trim().replace(/^(\d+) wheels?$/i, "$1");
  const out = `${label}: ${value}`;
  return /[\u3131-\uD79D]/.test(out) ? null : out;
}

export function fromHey(car: HeyCarDetail, lang: CardLang = "ru"): CarCard {
  const h = car.heydealer ?? {};
  const raw = car as Record<string, unknown>;
  const type = HEY_TYPES.find((t) => t.type === (h.auctionType ?? car.auctionType));
  const make = canonicalMake(car.make, null, car.model);
  const year = positive(car.year);
  const vi = (h.vehicleInfo ?? {}) as Record<string, unknown>;
  const hist = h.history ?? {};

  const repairs: BodyMark[] = (h.accidentDiagram?.repairs ?? []).map((r) => {
    const p = panelOf(r.partKey ?? r.part ?? "", lang);
    const rep = String(r.repair ?? "").toLowerCase();
    return {
      ...p,
      action: rep.includes("exchange") ? "replaced" : rep.includes("weld") ? "welded" : "other",
      when: "past",
    };
  });
  // Толщиномер: окрас по панели, где ремонт не заявлен. Где заявлена замена
  // или сварка, окрас подразумевается — второй отметкой не дублируем.
  const repaired = new Set(repairs.map((r) => r.panel));
  const paint: BodyMark[] = ((h.paint as { measurements?: { part?: string; level?: string }[] } | undefined)
    ?.measurements ?? [])
    .filter((m) => m.level && m.level !== "normal")
    .map((m) => ({
      ...panelOf(m.part ?? "", lang),
      action: "painted" as const,
      when: "past" as const,
      paintLevel: look(PAINT_LEVEL, m.level!, lang) ?? m.level,
    }))
    .filter((m) => !repaired.has(m.panel));

  const krw = positive(car.krw);
  const prev = h.previousBids as { maxUsd?: number; count?: number } | undefined;
  const photos =
    car.photos?.map((p) => p.url) ??
    h.imageGroups?.flatMap((g) => g.urls ?? []) ??
    (car.photo ? [car.photo] : []);

  return {
    house: "heydealer",
    sourceLabel: "HeyDealer",
    typeLabel: type?.label,
    typeHint: type && pick(lang, [type.hint, type.hintEn]),
    // ⚠️ Строка модели HeyDealer уже содержит комплектацию («Torres Gasoline 1.5
    // 2WD T7»), а она же лежит в gradeEn — в заголовке была бы дважды. Берём
    // модельную группу; не распознали — строку как есть.
    title: makeTitle(make, heyModelGroup(make, car.model) ?? car.model, year, lang),
    grade: str(car.gradeEn),
    make,
    modelGroup: heyModelGroup(make, car.model),
    model: str(car.model),
    year,
    km: positive(car.km),
    cc: positive(car.cc),
    fuel: fuelLabel(car.fuel, lang),
    trans: transLabel(car.trans, lang),
    color: str(car.color),
    interior: str(h.interior),
    body: str(vi.bodyType),
    usage: usageLabel(str(vi.purpose), lang),
    firstRegistration: car.regYear ? `${car.regYear}-${String(car.regMonth ?? 1).padStart(2, "0")}` : undefined,
    // ⚠️ VIN у HeyDealer обрезан (11 знаков из 17) — так отдаёт источник.
    vin: str(vi.vin),
    plate: str(h.carNumber),
    price: krw && !car.priceOnRequest ? { kind: "fixed", krw } : { kind: "none", krw: null },
    newPriceKrw: positive(car.originPriceKrw ?? h.msrpKrw),
    endAt: str(car.endAt ?? h.endAt),
    photos,
    accident: look(HEY_ACCIDENT, String(h.accidentGrade ?? ""), lang) ?? str(h.accidentSummary),
    legal: null,
    history: Object.keys(hist).length
      ? {
          owners: num(hist.ownerChanges),
          myClaims: num(hist.myAccidents),
          myClaimsKrw: num(hist.myAccidentCostKrw),
          otherClaims: num(hist.otherAccidents),
          otherClaimsKrw: num(hist.otherAccidentCostKrw),
          totalLoss: num(hist.totalLoss),
          flood: num(hist.floodLoss),
          theft: num(hist.stolen),
        }
      : null,
    bodyMarks: [...repairs, ...paint],
    // У Self осмотра нет: кузов только со слов продавца.
    hasBodyData: !!h.accidentDiagram || !!h.paint,
    engineSound: str((h.engineSound as { url?: unknown } | undefined)?.url),
    defects: [],
    // Со слов продавца — только у Self: у Zero и Instant есть настоящий осмотр
    // инспектора (checks), и строки продавца рядом с ним только путают.
    sellerSays:
      (h.auctionType ?? car.auctionType) === "self"
        ? (h.conditionItems ?? []).map((l) => sellerLine(l, lang)).filter((x): x is string => !!x)
        : [],
    keys: (h.conditionItems ?? []).some((l) => /spare key\s*:\s*present/i.test(l)) ? pick(lang, ["есть запасной", "spare key included"]) : undefined,
    engineCode: str(vi.motorCode),
    manufactured: str(vi.manufacturedDate)?.slice(0, 10),
    checks: h.conditionRows?.length
      ? [
          {
            title: pick(lang, ["Осмотр HeyDealer", "HeyDealer inspection"]),
            items: h.conditionRows.map((r) => heyRow(r as Record<string, unknown>, lang)),
          },
        ]
      : [],
    options: optionList(car.options),
    internal: {
      sourceUrl: `${CARNECT_ORIGIN}/car/heydealer/${encodeURIComponent(car.id)}`,
      scans: [],
      deal: [
        { label: "Статус", value: txt(h.status ?? car.status) },
        {
          label: "Ставок",
          value: car.bidCount != null || h.maxBids ? `${car.bidCount ?? 0}${h.maxBids ? ` из ${h.maxBids}` : ""}` : null,
        },
        {
          label: "Прошлые торги",
          value: prev?.count ? `${prev.count} ставок, максимум $${(prev.maxUsd ?? 0).toLocaleString("ru-RU")}` : null,
        },
        { label: "Выставлена", value: txt(car.listedAt)?.replace("T", " ").slice(0, 16) },
        { label: "Одобрена", value: txt(h.approvedAt)?.replace("T", " ").slice(0, 16) },
        { label: "Регион продавца", value: txt(car.region) },
        { label: "Оплата", value: txt(h.payment) },
      ],
      documents: { have: [], missing: [] },
      facts: [
        { label: "Тип регистрации", value: txt(vi.registrationType) },
        { label: "Техосмотр действует до", value: txt(vi.inspectionValidUntil)?.slice(0, 10) },
      ],
      flags: [
        ...((h.auctionType ?? car.auctionType) === "self"
          ? [{ text: "Self: осмотра HeyDealer нет, всё со слов продавца", warn: true }]
          : []),
        ...(hist.totalLoss ? [{ text: `Тотал по страховой: ${hist.totalLoss}`, warn: true }] : []),
        ...(hist.floodLoss ? [{ text: `Утопленник по страховой: ${hist.floodLoss}`, warn: true }] : []),
      ],
      notes: [
        { label: "Состояние (HeyDealer)", lines: h.conditionItems ?? [] },
        { label: "Заметки к осмотру", lines: h.conditionNotes ?? [] },
        { label: "Инспектор", lines: h.inspectorNotes ?? [] },
        { label: "Продавец", lines: h.sellerNotes ?? [] },
      ]
        .map((n) => ({ ...n, lines: n.lines.filter((l) => l && l.trim() && l.trim() !== ".") }))
        .filter((n) => n.lines.length),
      unknownPhrases: [],
    },
    shownKeys: HEY_SHOWN,
    raw,
  };
}
