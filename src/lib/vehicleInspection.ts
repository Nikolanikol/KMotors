// Лист осмотра (성능점검기록부) с Encar: дата, ремонт кузова, структурные
// повреждения, двигатель и КПП, затопление/пожар, отзывные кампании.
//
// Endpoint: GET https://api.encar.com/v1/readside/inspection/vehicle/<vehicleId>.
// ⚠️ vehicleId — это `data.vehicleId` записи авто, а НЕ id страницы: у
// объявлений-дублей они разные (замер 27.11.2026: у 17 из 17 проверенных машин),
// а по id страницы Encar отвечает 404 — «листа нет» на машине, у которой он есть.
// ⚠️ Без мобильного User-Agent Encar отдаёт 404 с HTML-страницей блокировки
// (has_been_cr_blocked) — то есть выглядит как «листа нет», а это сбой.
//
// Лист есть примерно у 95% машин. Блок необязательный: при любой ошибке
// возвращаем null и просто не рендерим его — страница авто не падает.

const PRIMARY_TIMEOUT_MS = 8000;

const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

/** Код + корейская подпись, как их отдаёт Encar. Подпись на сайт не выводим. */
interface Coded {
  code?: string | null;
  title?: string | null;
}

interface RawNode {
  type?: Coded | null;
  statusType?: Coded | null;
  children?: RawNode[] | null;
}

interface RawOuter {
  type?: Coded | null;
  statusTypes?: Coded[] | null;
  attributes?: string[] | null;
}

/**
 * Сырой лист осмотра. Описаны только те поля, что нужны блоку; схему задаёт
 * внешний API, поэтому всё необязательно. Поле `accdient` — опечатка самого
 * Encar (не `accident`), оставлено как есть.
 */
export interface RawInspection {
  vehicleId?: number;
  master?: {
    accdient?: boolean | null;
    simpleRepair?: boolean | null;
    registrationDate?: string | null;
    detail?: {
      issueDate?: string | null;
      mileage?: number | null;
      waterlog?: boolean | null;
      tuning?: boolean | null;
      recall?: boolean | null;
      recallFullFillTypes?: Coded[] | null;
      seriousTypes?: Coded[] | null;
      usageChangeTypes?: Coded[] | null;
    } | null;
  } | null;
  inners?: RawNode[] | null;
  outers?: RawOuter[] | null;
}

/**
 * Не бросает исключений НИКОГДА (правило проекта для Encar). 404 без страницы
 * блокировки — «листа нет», остальное — сбой; оба случая пишем в console.warn с
 * кодом и возвращаем null. Не-200 Next в кеш данных не кладёт, так что сбой
 * не залипает на час.
 */
export async function fetchVehicleInspection(
  vehicleId: string | number | undefined,
): Promise<RawInspection | null> {
  if (!vehicleId) return null;

  try {
    const res = await fetch(
      `https://api.encar.com/v1/readside/inspection/vehicle/${vehicleId}`,
      {
        headers: { "User-Agent": MOBILE_UA, Accept: "application/json" },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(PRIMARY_TIMEOUT_MS),
      },
    );
    if (!res.ok) {
      if (res.status === 404) {
        const body = await res.text().catch(() => "");
        const blocked =
          body.includes("has_been_cr_blocked") ||
          (res.headers.get("content-type") ?? "").includes("text/html");
        console.warn(
          blocked
            ? `[vehicleInspection] ${vehicleId}: 404 со страницей блокировки Encar — это сбой, не «нет листа»`
            : `[vehicleInspection] ${vehicleId}: 404 — листа осмотра нет`,
        );
      } else {
        console.warn(`[vehicleInspection] ${vehicleId}: сбой, HTTP ${res.status}`);
      }
      return null;
    }
    const json = await res.json();
    return json && typeof json === "object" ? (json as RawInspection) : null;
  } catch (e) {
    console.warn(
      `[vehicleInspection] ${vehicleId}: сбой запроса (${e instanceof Error ? e.name : "unknown"})`,
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Нормализация: из сырого листа — нейтральная к языку модель для вывода.
// Чистая функция без сети и i18n, под неё тесты (tests/catalog/inspection.spec.ts).
// ---------------------------------------------------------------------------

export type PanelPart =
  | "hood" | "frontFender" | "frontDoor" | "rearDoor" | "trunkLid"
  | "radiatorSupport" | "quarterPanel" | "roofPanel" | "sideSill"
  | "frontPanel" | "crossMember" | "insidePanel" | "rearPanel" | "trunkFloor"
  | "pillar" | "pillarFront" | "pillarMiddle" | "pillarRear"
  | "sideMember" | "wheelHouse" | "dashPanel" | "floorPanel" | "packageTray"
  | "other";

/**
 * Кузовная часть → ключ. Названия с Encar корейские; ищем по подстроке без
 * пробелов, длинные раньше коротких. Незнакомая деталь — `other` (на сайте
 * хангыль не показываем, пустое поле лучше корейского).
 */
const PART_RULES: [string, PanelPart][] = [
  ["필러패널(중간)", "pillarMiddle"],
  ["필러패널(앞)", "pillarFront"],
  ["필러패널(뒤)", "pillarRear"],
  ["필러패널", "pillar"],
  ["프론트휀더", "frontFender"],
  ["프론트펜더", "frontFender"],
  ["프론트도어", "frontDoor"],
  ["프론트패널", "frontPanel"],
  ["리어도어", "rearDoor"],
  ["리어패널", "rearPanel"],
  ["트렁크리드", "trunkLid"],
  ["트렁크플로어", "trunkFloor"],
  ["후드", "hood"],
  ["라디에이터서포트", "radiatorSupport"],
  ["쿼터패널", "quarterPanel"],
  ["루프패널", "roofPanel"],
  ["사이드실패널", "sideSill"],
  ["크로스멤버", "crossMember"],
  ["인사이드패널", "insidePanel"],
  ["사이드멤버", "sideMember"],
  ["휠하우스", "wheelHouse"],
  ["대쉬패널", "dashPanel"],
  ["대시패널", "dashPanel"],
  ["플로어패널", "floorPanel"],
  ["패키지트레이", "packageTray"],
];

export type PanelStatus =
  | "replaced" // X 교환
  | "repaired" // W 판금/용접
  | "corrosion" // C 부식
  | "scratch" // A 흠집
  | "dent" // U 요철
  | "damage" // T 손상
  | "other";

// Условные обозначения из официальной формы 성능점검기록부.
const STATUS_BY_CODE: Record<string, PanelStatus> = {
  X: "replaced",
  W: "repaired",
  C: "corrosion",
  A: "scratch",
  U: "dent",
  T: "damage",
};

/** outer — внешние панели (1-й и 2-й ранг), frame — силовые элементы (ранги A/B/C). */
export type PanelZone = "outer" | "frame" | "unknown";

export interface InspectionPanel {
  part: PanelPart;
  side: "left" | "right" | null;
  zone: PanelZone;
  statuses: PanelStatus[];
}

export interface ComponentCheck {
  /** Самодиагностика (раздел S00): ok / issue, null — раздела или значения нет. */
  selfCheck: "ok" | "issue" | null;
  /** Число отмеченных замечаний по узлам раздела (течи, нехватка масла, неисправность). */
  marks: number;
}

export interface InspectionView {
  /** Дата выдачи листа, YYYY-MM-DD. */
  inspectedAt: string | null;
  /** Пробег на момент осмотра, км. */
  mileage: number | null;
  /** Флаг Encar `accdient`: повреждения/ремонт силовых элементов. */
  structural: boolean | null;
  /** Флаг Encar `simpleRepair`: замена/ремонт внешних панелей. */
  simpleRepair: boolean | null;
  panels: InspectionPanel[];
  engine: ComponentCheck | null;
  transmission: ComponentCheck | null;
  /** Замечания по остальным узлам (привод, рулевое, тормоза, электрика, топливо). */
  otherMarks: number | null;
  flood: boolean | null;
  fire: boolean | null;
  recall: { exists: boolean; done: boolean | null } | null;
  tuning: boolean | null;
  usageChanged: boolean | null;
}

const bool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);
const arr = <T>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : []);

/** "20260106" → "2026-01-06"; иначе null. */
function compactDate(v: string | null | undefined): string | null {
  const m = typeof v === "string" ? /^(\d{4})(\d{2})(\d{2})$/.exec(v.trim()) : null;
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** "2026-01-08T13:09:25" → "2026-01-08"; иначе null. */
function isoDate(v: string | null | undefined): string | null {
  const m = typeof v === "string" ? /^(\d{4}-\d{2}-\d{2})/.exec(v.trim()) : null;
  return m ? m[1] : null;
}

function parsePanel(o: RawOuter): InspectionPanel {
  const title = (o.type?.title ?? "").replace(/\s+/g, "");
  const sideMatch = /\((좌|우)\)$/.exec(title);
  const side = sideMatch ? (sideMatch[1] === "좌" ? "left" : "right") : null;
  const base = sideMatch ? title.slice(0, sideMatch.index) : title;
  const part = PART_RULES.find(([needle]) => base.includes(needle))?.[1] ?? "other";

  const attrs = arr(o.attributes);
  const zone: PanelZone = attrs.some((a) => /^RANK_(ONE|TWO)$/.test(a))
    ? "outer"
    : attrs.some((a) => /^RANK_[ABC]$/.test(a))
      ? "frame"
      : "unknown";

  const statuses = [
    ...new Set(arr(o.statusTypes).map((s) => STATUS_BY_CODE[s.code ?? ""] ?? "other")),
  ];
  return { part, side, zone, statuses };
}

// Коды статусов узлов (по statusItemTypes из самих листов): 1 양호, 2 적정,
// 3 없음 — норма; 4/5 течь (мелкая/течь), 6/7 течь масла, 8 нехватка, 9 избыток,
// 10 неисправность — замечание. Незнакомые коды замечанием не считаем.
const MARK_CODES = new Set(["4", "5", "6", "7", "8", "9", "10"]);

function countMarks(node: RawNode): number {
  let n = 0;
  for (const c of arr(node.children)) {
    const code = c.statusType?.code;
    if (code && MARK_CODES.has(code)) n += 1;
    n += countMarks(c);
  }
  return n;
}

function selfCheckOf(group: RawNode | undefined, partCode: string): "ok" | "issue" | null {
  const code = arr(group?.children).find((c) => c.type?.code === partCode)?.statusType?.code;
  if (code === "1") return "ok";
  if (code === "10") return "issue";
  return null;
}

/**
 * Лист → модель вывода. Возвращает null, если в ответе нет ни одного
 * осмысленного поля (блок тогда не рисуем). Ничего не вычисляет «от себя»:
 * вердикты — только флаги самого Encar.
 */
export function normalizeInspection(raw: unknown): InspectionView | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as RawInspection;
  const master = r.master;
  if (!master || typeof master !== "object") return null;
  const d = master.detail ?? {};

  const inners = arr(r.inners);
  const group = (code: string) => inners.find((g) => g.type?.code === code);
  const s00 = group("S00");
  const s01 = group("S01");
  const s02 = group("S02");

  const check = (g: RawNode | undefined, partCode: string): ComponentCheck | null => {
    const selfCheck = selfCheckOf(s00, partCode);
    if (!g && selfCheck === null) return null;
    return { selfCheck, marks: g ? countMarks(g) : 0 };
  };

  const otherGroups = inners.filter((g) => !["S00", "S01", "S02"].includes(g.type?.code ?? ""));
  const serious = arr(d.seriousTypes).map((s) => s.title ?? "");

  const waterlog = bool(d.waterlog);
  const flood = serious.some((t) => t.includes("침수")) ? true : waterlog;
  // Отдельного булева поля про пожар в листе нет: он встречается только как
  // отметка в seriousTypes. «Нет отметки» говорим лишь когда массив пришёл.
  const fire = serious.some((t) => t.includes("화재"))
    ? true
    : Array.isArray(d.seriousTypes)
      ? false
      : null;

  const recallFlag = bool(d.recall);
  const recallCode = arr(d.recallFullFillTypes)[0]?.code;
  const recall =
    recallFlag === null
      ? null
      : {
          exists: recallFlag,
          done: !recallFlag ? null : recallCode === "1" ? true : recallCode === "2" ? false : null,
        };

  const view: InspectionView = {
    inspectedAt: compactDate(d.issueDate) ?? isoDate(master.registrationDate),
    mileage: typeof d.mileage === "number" && d.mileage > 0 ? d.mileage : null,
    structural: bool(master.accdient),
    simpleRepair: bool(master.simpleRepair),
    panels: arr(r.outers).map(parsePanel),
    engine: check(s01, "s001"),
    transmission: check(s02, "s002"),
    otherMarks: otherGroups.length ? otherGroups.reduce((s, g) => s + countMarks(g), 0) : null,
    flood,
    fire,
    recall,
    tuning: bool(d.tuning),
    usageChanged: Array.isArray(d.usageChangeTypes) ? d.usageChangeTypes.length > 0 : null,
  };

  // Совсем пустой лист (ни флагов, ни узлов) показывать нечем.
  const meaningful =
    view.structural !== null ||
    view.simpleRepair !== null ||
    view.engine !== null ||
    view.transmission !== null ||
    view.flood !== null ||
    view.recall !== null ||
    view.panels.length > 0;
  return meaningful ? view : null;
}
