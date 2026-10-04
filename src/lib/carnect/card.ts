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

import type { HeyCarDetail } from "./heydealer";
import { HEY_TYPES } from "./heydealer";
import { HOUSES, type CarnectHouse } from "./houses";
import { canonicalMake, canonicalModelGroup, heyModelGroup, normalizeFuel, normalizeTrans, positive } from "./normalize";
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
  /** Подпись по-русски; не распознали — как у источника. */
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
  checks: CheckGroup[];
  options: string[];

  /** ⚠️ Только для нас — клиенту не показывается (решение владельца 02.10.2026). */
  internal: {
    scans: { label: string; url: string }[];
    bids?: string;
    previousBids?: string;
    afterBidKrw: number | null;
    notes: string[];
    facts: Record<string, unknown>;
  };
  raw: Record<string, unknown>;
}

// ─── Словари ─────────────────────────────────────────────────────────────

const FUEL_LABEL = Object.fromEntries(FUELS.map((f) => [f.v, f.label])) as Record<string, string>;

function fuelLabel(raw: string | undefined): string | undefined {
  const f = normalizeFuel(raw);
  if (!f) return undefined;
  return FUEL_LABEL[f] ?? raw;
}

function transLabel(raw: string | undefined): string | undefined {
  const t = normalizeTrans(raw);
  return t === "manual" ? "Механика" : t === "auto" ? "Автомат" : undefined;
}

const USAGE: Record<string, string> = {
  rental: "Прокат",
  "private use": "Личная",
  personal: "Личная",
  "personal/corporate": "Личная / юрлицо",
  corporate: "Юрлицо",
  "dealer stock": "Сток дилера",
  taxi: "Такси",
  commercial: "Коммерческая",
};

function usageLabel(raw: string | undefined): string | undefined {
  const s = (raw ?? "").trim();
  if (!s || s.toLowerCase() === "none") return undefined;
  return USAGE[s.toLowerCase()] ?? s;
}

/** Узлы листа осмотра. Ключ — английское имя у источника, в нижнем регистре. */
const CHECK_NAMES: Record<string, string> = {
  engine: "Двигатель",
  transmission: "Коробка передач",
  powertrain: "Трансмиссия",
  "power train": "Трансмиссия",
  "power transmission": "Трансмиссия",
  "drive shaft": "Приводной вал",
  steering: "Рулевое",
  braking: "Тормоза",
  brakes: "Тормоза",
  electrical: "Электрика",
  "battery / electrical": "Аккумулятор и электрика",
  "charging system": "Зарядка",
  "starting system": "Запуск",
  "air conditioning": "Кондиционер",
  hvac: "Кондиционер",
  "a/c unit": "Кондиционер",
  interior: "Салон",
  "interior odour": "Запах в салоне",
  "interior trim/interior panel": "Обшивка салона",
  seat: "Сиденья",
  lighting: "Свет",
  dlr: "Ходовые огни",
  drl: "Ходовые огни",
  "headlamp/rear lamp": "Фары и фонари",
  "running gear": "Ходовая",
  "electric vehicle (ev)": "Электросистема EV",
  "cooling system": "Охлаждение",
  "operating condition": "Работа",
  "warning light": "Индикаторы на приборке",
  "body corrosion": "Коррозия кузова",
  "structural change": "Изменение конструкции",
  "illegal modification": "Незаконные переделки",
};

const CHECK_GROUPS: Record<string, string> = {
  "condition check": "Состояние узлов",
  "condition report": "Состояние узлов",
  "performance check": "Состояние узлов",
  "inspection record": "Акт техосмотра",
  "warning lights": "Индикаторы",
  "air conditioning": "Кондиционер",
};

const CHECK_STATUS: Record<string, string> = {
  good: "Хорошо",
  normal: "Норма",
  average: "Средне",
  fair: "Удовлетворительно",
  none: "Нет",
  "needs repair": "Требует ремонта",
  "needs service": "Требует обслуживания",
  "maintenance required": "Требует обслуживания",
  defect: "Неисправно",
  defective: "Неисправно",
};

/** Расшифровка в скобках: «Needs repair (Noise, Oil leak)». */
const CHECK_DETAIL: Record<string, string> = {
  "oil leak": "течь масла",
  noise: "шум",
  play: "люфт",
  impact: "удары",
  "seat defect": "дефект сидений",
  "interior panel defect": "дефект обшивки",
  // Autohub иногда оставляет корейские слова внутри английского статуса.
  지연: "задержка переключения",
  터보defect: "дефект турбины",
};

function checkStatus(raw: string): string {
  const m = /^([^(]+?)\s*(?:\((.*)\))?$/.exec(raw.trim());
  if (!m) return raw;
  const head = CHECK_STATUS[m[1].toLowerCase()] ?? m[1];
  if (!m[2]) return head;
  const tail = m[2]
    .split(",")
    .map((t) => CHECK_DETAIL[t.trim().toLowerCase()] ?? t.trim())
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

const PART_NAMES: { re: RegExp; key: string; ru: string; g: Gender; structural?: boolean }[] = [
  { re: /bonnet|hood/, key: "hood", ru: "Капот", g: "m" },
  { re: /trunk|tailgate|back door/, key: "trunk", ru: "Крышка багажника", g: "f" },
  { re: /roof/, key: "roof", ru: "Крыша", g: "f" },
  { re: /quarter/, key: "quarter", ru: "Заднее крыло", g: "n" },
  { re: /fender/, key: "fender", ru: "Крыло", g: "n" },
  { re: /door/, key: "door", ru: "Дверь", g: "f" },
  { re: /bumper/, key: "bumper", ru: "Бампер", g: "m" },
  { re: /mirror/, key: "mirror", ru: "Зеркало", g: "n" },
  { re: /windshield|front glass|windscreen/, key: "windshield", ru: "Лобовое стекло", g: "n" },
  { re: /rear glass|rear window/, key: "rear_glass", ru: "Заднее стекло", g: "n" },
  // Порог в корейском листе осмотра — внешняя панель второго ранга, не силовой каркас.
  { re: /\bsil|step|rocker/, key: "sill", ru: "Порог", g: "m" },
  { re: /pillar/, key: "pillar", ru: "Стойка", g: "f", structural: true },
  { re: /member/, key: "member", ru: "Лонжерон", g: "m", structural: true },
  { re: /wheel ?house/, key: "wheelhouse", ru: "Колёсная арка", g: "f", structural: true },
  { re: /floor/, key: "floor", ru: "Пол", g: "m", structural: true },
  { re: /dash/, key: "dash", ru: "Моторный щит", g: "m", structural: true },
  { re: /radiator/, key: "radiator", ru: "Рамка радиатора", g: "f" },
  { re: /cross/, key: "cross", ru: "Поперечина", g: "f", structural: true },
  { re: /rear panel|back panel/, key: "rear_panel", ru: "Задняя панель", g: "f", structural: true },
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
function panelOf(name: string): { panel: string | null; label: string; structural: boolean } {
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

  const words = [base];
  if (!isQuarter && end && HAS_END.has(key)) words.push(ADJ[end][g]);
  if (side) words.push(ADJ[side][g]);
  const panel = [key, isQuarter ? "" : HAS_END.has(key) ? end : "", side].filter(Boolean).join("_");
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

const PAINT_LEVEL: Record<string, string> = {
  slightly_thick: "немного повышена",
  very_thick: "сильно повышена",
  extremely_thick: "очень сильно повышена",
};

// ─── Общие куски ─────────────────────────────────────────────────────────

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);

const ACCIDENT_TAG: Record<string, string> = {
  NONE: "Без ДТП",
  ACCIDENT: "Было ДТП",
  REPLACE: "Замена деталей",
};

const HEY_ACCIDENT: Record<string, string> = {
  complete_no_accident: "Без ДТП",
  accident: "Было ДТП",
  simple_exchange_no_accident: "Простая замена, без ДТП",
};

function checkGroups(raw: unknown): CheckGroup[] {
  if (!Array.isArray(raw)) return [];
  const out: CheckGroup[] = [];
  const loose: CheckItem[] = [];
  const item = (x: Record<string, unknown>): CheckItem => ({
    name: CHECK_NAMES[String(x.name ?? "").toLowerCase()] ?? String(x.name ?? "—"),
    status: checkStatus(String(x.status ?? "")),
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
        title: CHECK_GROUPS[title.toLowerCase()] ?? CHECK_NAMES[title.toLowerCase()] ?? (title || "Осмотр"),
        items: (o.items as Record<string, unknown>[]).map(item),
      });
    } else {
      loose.push(item(o));
    }
  }
  if (loose.length) out.push({ title: "Осмотр", items: loose });
  return mergeOneLiners(out);
}

/**
 * У Autohub 13 групп по одному-двум пунктам («Двигатель → Работа»). Сводим их в
 * одну «Состояние узлов», подставляя группу в имя: иначе вместо таблицы —
 * тринадцать карточек с одной строкой.
 */
function mergeOneLiners(groups: CheckGroup[]): CheckGroup[] {
  if (groups.length < 6) return groups;
  const items = groups.flatMap((g) =>
    g.items.map((it) => ({ ...it, name: it.name === "Работа" || it.name === g.title ? g.title : `${g.title}: ${it.name}` })),
  );
  return [{ title: "Состояние узлов", items }];
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

function makeTitle(make: string | null, model: string | undefined, year: number | null): string {
  return [year, make, model].filter(Boolean).join(" ") || "Машина";
}

// ─── Переходник: лот аукциона ────────────────────────────────────────────

export function fromLot(house: CarnectHouse, lot: CarnectLotDetail): CarCard {
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
        }
      : null;

  const marks = ((lot.panelDiagram as { marks?: Record<string, unknown>[] } | undefined)?.marks ?? []).map(
    (m): BodyMark => {
      const p = panelOf(String(m.nameEn ?? m.key ?? ""));
      const when = m.when === "current" ? "current" : "past";
      return { ...p, action: markAction(String(m.code ?? ""), String(m.labelEn ?? ""), when), when };
    },
  );

  const startKrw = positive(lot.startKrw);
  const scans = lot.registrationImage ? [{ label: "Техпаспорт", url: lot.registrationImage }] : [];

  return {
    house,
    sourceLabel: HOUSES[house].name.replace(/ \(.*\)$/, ""),
    title: makeTitle(make, group ?? lot.model, year),
    grade: str(lot.grade) ?? str(lot.titleEn),
    make,
    model: str(lot.model),
    year,
    km: positive(lot.km),
    cc: positive(lot.cc),
    fuel: fuelLabel(lot.fuel),
    trans: transLabel(lot.trans),
    color: str(lot.color) === "Other" ? undefined : str(lot.color),
    body: str(raw.body) ?? str(raw.vehicleType) ?? str(raw.segment),
    seats: num(raw.seats) ?? (props.Seating ? Number(props.Seating) || null : null),
    usage: usageLabel(lot.usage),
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
      ACCIDENT_TAG[String(raw.accidentTag ?? "")] ??
      (str(raw.accidentHistory) === "No" ? "Без ДТП" : str(raw.accidentHistory) === "Yes" ? "Было ДТП" : undefined),
    legal: legalRaw ? { seizures: num(legalRaw.seizures), mortgages: num(legalRaw.mortgages) } : null,
    history,
    bodyMarks: marks,
    hasBodyData: !!lot.panelDiagram,
    inspectionSheet: str(lot.inspectionSheetImage),
    checks: checkGroups(lot.inspection),
    options: optionList(lot.options),
    internal: {
      scans,
      afterBidKrw: positive(lot.afterBidKrw),
      notes: [str(lot.notes), str(lot.notesKo)].filter((x): x is string => !!x),
      facts: {
        "статус торгов": lot.status,
        "ряд": lot.lane,
        "стоянка": raw.parkingSlot ?? raw.pkltNo,
        "id у площадки": lot.carId,
        "акт осмотра": lot.inspectionRecord,
        "осмотр действует до": raw.inspectionValidUntil ?? props["Inspection valid until"],
        "в машине": props["Stored items"],
        "код двигателя": raw.motorCode,
        "нет опций": raw.disabledOptions,
      },
    },
    raw,
  };
}

// ─── Переходник: машина HeyDealer ────────────────────────────────────────

/** Подписи строк осмотра HeyDealer (`conditionRows`). Незнакомые — как у источника. */
const HEY_ROWS: Record<string, string> = {
  tire: "Шины",
  outer_panel_scratch: "Панели с повреждениями",
  wheel_scratch: "Диски с царапинами",
  leakage: "Течи",
  dashboard_warning: "Ошибки на приборке",
  option_malfunction: "Неисправные опции",
};

function heyRow(r: Record<string, unknown>): CheckItem {
  const name = HEY_ROWS[String(r.key)] ?? String(r.label ?? r.key ?? "—");
  let status: string;
  if (r.kind === "tires") status = `остаток: перед ${r.front ?? "?"}%, зад ${r.rear ?? "?"}%`;
  else if (r.kind === "count") status = r.count ? `${r.count}` : "нет";
  else if (r.kind === "bool") status = r.ok === false ? "есть" : "нет";
  else status = typeof r.ok === "boolean" ? (r.ok ? "в порядке" : "есть замечания") : "—";
  return { name, status, ok: typeof r.ok === "boolean" ? r.ok : null };
}

export function fromHey(car: HeyCarDetail): CarCard {
  const h = car.heydealer ?? {};
  const raw = car as Record<string, unknown>;
  const type = HEY_TYPES.find((t) => t.type === (h.auctionType ?? car.auctionType));
  const make = canonicalMake(car.make, null, car.model);
  const year = positive(car.year);
  const vi = (h.vehicleInfo ?? {}) as Record<string, unknown>;
  const hist = h.history ?? {};

  const repairs: BodyMark[] = (h.accidentDiagram?.repairs ?? []).map((r) => {
    const p = panelOf(r.partKey ?? r.part ?? "");
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
    .map((m) => ({ ...panelOf(m.part ?? ""), action: "painted" as const, when: "past" as const, paintLevel: PAINT_LEVEL[m.level!] ?? m.level }))
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
    typeHint: type?.hint,
    // ⚠️ Строка модели HeyDealer уже содержит комплектацию («Torres Gasoline 1.5
    // 2WD T7»), а она же лежит в gradeEn — в заголовке была бы дважды. Берём
    // модельную группу; не распознали — строку как есть.
    title: makeTitle(make, heyModelGroup(make, car.model) ?? car.model, year),
    grade: str(car.gradeEn),
    make,
    model: str(car.model),
    year,
    km: positive(car.km),
    cc: positive(car.cc),
    fuel: fuelLabel(car.fuel),
    trans: transLabel(car.trans),
    color: str(car.color),
    interior: str(h.interior),
    body: str(vi.bodyType),
    usage: usageLabel(str(vi.purpose)),
    firstRegistration: car.regYear ? `${car.regYear}-${String(car.regMonth ?? 1).padStart(2, "0")}` : undefined,
    // ⚠️ VIN у HeyDealer обрезан (11 знаков из 17) — так отдаёт источник.
    vin: str(vi.vin),
    plate: str(h.carNumber),
    price: krw && !car.priceOnRequest ? { kind: "fixed", krw } : { kind: "none", krw: null },
    newPriceKrw: positive(car.originPriceKrw ?? h.msrpKrw),
    endAt: str(car.endAt ?? h.endAt),
    photos,
    accident: HEY_ACCIDENT[String(h.accidentGrade ?? "")] ?? str(h.accidentSummary),
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
    checks: h.conditionRows?.length
      ? [{ title: "Осмотр HeyDealer", items: h.conditionRows.map((r) => heyRow(r as Record<string, unknown>)) }]
      : [],
    options: optionList(car.options),
    internal: {
      scans: [],
      bids: car.bidCount != null || h.maxBids ? `${car.bidCount ?? 0}${h.maxBids ? ` из ${h.maxBids}` : ""}` : undefined,
      previousBids: prev?.count ? `${prev.count} ставок, максимум $${(prev.maxUsd ?? 0).toLocaleString("ru-RU")}` : undefined,
      afterBidKrw: null,
      notes: [...(h.conditionItems ?? []), ...(h.conditionNotes ?? []), ...(h.inspectorNotes ?? []), ...(h.sellerNotes ?? [])].filter(
        (s) => s && s.trim() && s.trim() !== ".",
      ),
      facts: {
        "статус": h.status ?? car.status,
        "регион": car.region,
        "оплата": h.payment,
        "выставлена": car.listedAt,
        "одобрена": h.approvedAt,
        "код двигателя": vi.motorCode,
        "регистрация": vi.registrationType,
      },
    },
    raw,
  };
}
