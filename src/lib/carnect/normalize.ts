// Нормализация полей carnect для общего фильтра по всем источникам.
//
// Зачем. Фильтр «Hyundai Grandeur, 2019+, дизель» должен находить машину на
// любой площадке и в HeyDealer одним запросом. Для этого марка, модельная
// группа, топливо и коробка обязаны быть записаны ОДИНАКОВО, а источники
// пишут их по-разному. Здесь — единственное место, где разное сводится к
// одному. Правила сняты с живых данных 02.10.2026; к каждому — пример,
// откуда оно взялось.
//
// Что уже сделал за нас carnect. Модельные группы аукционов приходят
// латиницей и почти без расхождений («Grandeur» на всех пяти площадках) —
// словарь моделей писать не нужно. Остаются мелочи (регистр, BMW, марки) и
// HeyDealer, у которого модельной группы нет вовсе.
//
// ⚠️ Нормализованные значения уходят в колонки фильтра (carnect_lots.make,
// model_group, fuel), а сырьё — в raw. Поменяли правило — пересчитать можно
// из raw, не обходя источник заново.

/** Ключ сравнения: нижний регистр, только буквы и цифры. «Gv80» и «GV80» → «gv80». */
export const keyOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// ─── Марка ───────────────────────────────────────────────────────────────

/**
 * Варианты одной марки у разных источников → одно имя.
 * «Chevrolet (Daewoo)» у Autobell, «Chevrolet (GM Daewoo)» у HeyDealer,
 * «Chevrolet» у K Car — это одна марка, и фильтр обязан видеть её одной.
 * Ключ — keyOf(варианта).
 */
const MAKE_ALIASES: Record<string, string> = {
  chevroletdaewoo: "Chevrolet",
  chevroletgmdaewoo: "Chevrolet",
  gmdaewoo: "Chevrolet",
  daewoo: "Chevrolet",
  kgm: "KGM",
  kgmobility: "KGM",
  kgmobilityssangyong: "KGM",
  ssangyong: "KGM",
  renault: "Renault Korea",
  renaultkorea: "Renault Korea",
  renaultsamsung: "Renault Korea",
  renaultkoreasamsung: "Renault Korea",
  samsung: "Renault Korea",
  mercedes: "Mercedes-Benz",
  mercedesbenz: "Mercedes-Benz",
  benz: "Mercedes-Benz",
  vw: "Volkswagen",
  landrover: "Land Rover",
};

/**
 * Модельная группа → марка. Нужна HeyDealer: у ~10% его машин марка пустая
 * («| Torres Gasoline 1.5 2WD T7»), и восстановить её можно только по модели.
 * Покрывает корейские марки — пустая марка встречалась именно у них;
 * импортные распознаются по первому слову названия (FOREIGN_FIRST_WORD).
 */
const MODEL_MAKE: Record<string, string> = Object.fromEntries(
  Object.entries({
    Hyundai: ["Avante", "Accent", "Aslan", "Casper", "Elantra", "Genesis", "Grandeur", "Grand Starex", "I30", "I40",
      "Ioniq", "Ioniq 5", "Ioniq 6", "Kona", "Maxcruz", "Nexo", "Palisade", "Porter", "Santa Fe", "Solati", "Sonata",
      "Starex", "Staria", "Tucson", "Veloster", "Venue", "Veracruz", "Verna", "Equus", "Mighty"],
    Kia: ["Bongo", "Carens", "Carnival", "EV6", "EV9", "Forte", "K3", "K5", "K7", "K8", "K9", "Lotze", "Mohave",
      "Morning", "Niro", "Pride", "Ray", "Rei", "Seltos", "Sorento", "Soul", "Sportage", "Stinger", "Stonic"],
    Genesis: ["G70", "G80", "G90", "GV60", "GV70", "GV80", "EQ900"],
    KGM: ["Actyon", "Korando", "Musso", "Rexton", "Tivoli", "Torres"],
    Chevrolet: ["Aveo", "Captiva", "Cruze", "Damas", "Equinox", "Labo", "Malibu", "Matiz", "Orlando", "Spark",
      "Trailblazer", "Traverse", "Trax"],
    "Renault Korea": ["QM3", "QM6", "SM3", "SM5", "SM6", "SM7", "XM3"],
  }).flatMap(([make, models]) => models.map((m) => [keyOf(m), make])),
);

/** Импортные машины HeyDealer без марки: марка первым словом названия («LEXUS NX350h»). */
const FOREIGN_FIRST_WORD: Record<string, string> = {
  lexus: "Lexus", bentley: "Bentley", toyota: "Toyota", honda: "Honda", nissan: "Nissan", infiniti: "Infiniti",
  porsche: "Porsche", maserati: "Maserati", ferrari: "Ferrari", lamborghini: "Lamborghini", jaguar: "Jaguar",
  volvo: "Volvo", ford: "Ford", jeep: "Jeep", cadillac: "Cadillac", lincoln: "Lincoln", peugeot: "Peugeot",
  tesla: "Tesla", bmw: "BMW", audi: "Audi", mini: "MINI", polestar: "Polestar",
};

/**
 * Марка в общем написании. Пустая — пробуем восстановить по модельной группе,
 * затем по первому слову названия. Не вышло — null: машина найдётся только
 * без фильтра по марке, и это честнее, чем угадать.
 *
 * ⚠️ «Vw/Audi» — так SK пишет ОБЕ марки одним словом. Разводим по модели:
 * у Audi модели начинаются с A/Q/S/R/RS/E-Tron, у Volkswagen — нет.
 */
export function canonicalMake(raw: string | undefined, modelGroup: string | null, title?: string): string | null {
  const k = keyOf(raw ?? "");
  if (k === "vwaudi") {
    return modelGroup && /^(a\d|q\d|s\d|r\d|rs|e-?tron)/i.test(modelGroup) ? "Audi" : "Volkswagen";
  }
  if (k) return MAKE_ALIASES[k] ?? raw!.trim();
  if (modelGroup && MODEL_MAKE[keyOf(modelGroup)]) return MODEL_MAKE[keyOf(modelGroup)];
  const first = keyOf((title ?? "").trim().split(/\s+/)[0] ?? "");
  return FOREIGN_FIRST_WORD[first] ?? null;
}

// ─── Модельная группа ────────────────────────────────────────────────────

/**
 * Модельная группа в одном написании.
 *
 * Расхождения, снятые с фасетов пяти площадок 02.10.2026 (171 группа):
 *   • регистр: «GV80» / «Gv80», «QM6» / «Qm6», «EQ900» / «Eq900»,
 *     «GLC-Class» / «Glc-Class» — буквенно-цифровые коды поднимаем целиком;
 *   • BMW одной серией трижды: «5 Series», «5-Series», «Series 5» → «5 Series».
 */
export function canonicalModelGroup(raw: string | undefined | null): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const series = /^(?:series\s*-?\s*(\d)|(\d)\s*-?\s*series)$/i.exec(s);
  if (series) return `${series[1] ?? series[2]} Series`;
  const cls = /^([a-z]{1,3})-class$/i.exec(s);
  if (cls) return `${cls[1].toUpperCase()}-Class`;
  // Код из букв и цифр («Gv80», «Qm6», «Xm3», «Ev6», «Eq900»), а также
  // «Cr-v» / «Hr-v» — целиком в верхний регистр.
  if (/^[a-z]{1,3}\d{1,4}[a-z]?$/i.test(s) || /^[a-z]{2}-[a-z]$/i.test(s)) return s.toUpperCase();
  return s;
}

/**
 * Известные модельные группы — снимок фасетов всех пяти аукционов
 * (02.10.2026, 171 запись до склейки регистров). Нужен HeyDealer: у него
 * модельной группы нет, и мы ищем эти названия внутри его строки модели.
 * Новая модель на аукционах сюда не попадёт сама — у HeyDealer она будет
 * нераспознанной (model_group NULL), пока её не допишут. Отчёт синка
 * показывает долю нераспознанных, по нему и видно, когда пора.
 */
const KNOWN_GROUPS_RAW = [
  "2-Series", "2008", "3008", "5 Series", "A3", "A4", "A6", "A7", "A8", "Accent", "Accord", "Actyon", "Alpheon",
  "Altima", "Amg Gt", "Arteon", "Aslan", "Avante", "Aveo", "Bongo", "C-Class", "CLA-Class", "Camry", "Captiva",
  "Carens", "Carnival", "Casper", "Cayenne", "Cherokee", "Civic", "Clio", "CLS-Class", "Cooper", "CR-V", "Cruze",
  "Damas", "Discovery", "E-Class", "E-Tron Gt", "EQ900", "ES", "EV6", "Equinox", "Equus", "Escape", "Explorer",
  "Forte", "G70", "G80", "G90", "GLB-Class", "GLE-Class", "GLS-Class", "GLC-Class", "GV60", "GV70", "GV80",
  "Genesis", "Ghibli", "Golf", "Gran Turismo", "Grand Starex", "Grandeur", "HR-V", "I30", "I40", "Ioniq",
  "Ioniq 5", "Ioniq 6", "Jetta", "K3", "K5", "K7", "K8", "K9", "Kona", "Korando", "Leaf", "Lotze", "M-Class",
  "M3", "Malibu", "Master", "Matiz", "Maxcruz", "MKC", "MKZ", "Model 3", "Model S", "Model Y", "Mohave",
  "Morning", "Musso", "Nexo", "Niro", "Orlando", "Palisade", "Passat", "Polestar 2", "Polo", "Porter", "Pride",
  "Prius", "Q5", "Q7", "Q70", "QM3", "QM6", "QX60", "Range Rover", "Range Rover Evoque", "Ray", "Rei", "Renegade",
  "Rexton", "S-Class", "S4", "S80", "S90", "SM3", "SM5", "SM6", "SM7", "SQ5", "Santa Fe", "Seltos", "3 Series",
  "Solati", "Sonata", "Sorento", "Soul", "Spark", "Sportage", "Starex", "Staria", "Stinger", "Stonic", "Taurus",
  "Tiguan", "Tivoli", "Torres", "Touareg", "Trailblazer", "Traverse", "Trax", "Tucson", "V60", "Veloster", "Venue",
  "Veracruz", "Verna", "Wrangler", "X6", "XC90", "XM3", "Zoe",
  // Нет на аукционах в день замера, но встречается у HeyDealer.
  "Elantra", "EV9", "Labo", "Mighty", "Lacetti", "B-Class",
];

/**
 * Группы для поиска внутри строки: в ключе пробелы на месте разделителей,
 * чтобы «santa fe» не нашлась в «xsanta fey», а «ray» — в «gray». Длинные
 * первыми: «Range Rover Evoque» должна победить «Range Rover», «Grand
 * Starex» — «Starex».
 */
const GROUP_MATCHERS = [...new Set(KNOWN_GROUPS_RAW.map((g) => canonicalModelGroup(g)!))]
  .map((g) => ({ group: g, needle: ` ${g.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} ` }))
  .filter((m) => m.needle.trim().length >= 2)
  .sort((a, b) => b.needle.length - a.needle.length);

/**
 * Модельная группа HeyDealer из свободной строки модели.
 * «GRANDEUR HG HG240 Luxury» → Grandeur, «The New SANTA FE DIESEL» → Santa Fe.
 *
 * ⚠️ Mercedes HeyDealer пишет КОДОМ модели, а не классом: «E300 4MATIC»,
 * «GLC350e», «S350L», «CLS55 AMG». Класс — это буквы перед цифрами:
 * E300 → E-Class, GLC350e → GLC-Class. Без этого правила Mercedes был
 * главным источником нераспознанных (10 из 15 промахов на выборке 142).
 */
export function heyModelGroup(make: string | null, model: string | undefined): string | null {
  const text = (model ?? "").trim();
  if (!text) return null;
  if (make === "Mercedes-Benz") {
    const m = /^(?:(?:the|all)\s+new\s+)?(?:amg\s+)?([a-z]{1,3})\s?\d{2,3}/i.exec(text);
    if (m) return `${m[1].toUpperCase()}-Class`;
  }
  // ⚠️ BMW у HeyDealer: «7 SERIES (G11) 740Li», «4 Series (F32) 420d»,
  // «6 Series GT (G32)» — серия цифрой; «X5 (G05) xDrive», «X4 (F26) M40i»,
  // «i4 M50», «M2 (F87)» — код модели первым словом. Аукционы пишут так же:
  // «5 Series», «X6», «M3». Серия → «N Series», код → как есть, в верхнем
  // регистре (i4 → I4 — так же, как канонизатор поднимает «Gv80»).
  if (make === "BMW") {
    const series = /^(\d)\s*-?\s*series\b/i.exec(text);
    if (series) return `${series[1]} Series`;
    const code = /^(x\d|z\d|i\d|ix\d?|m\d)\b/i.exec(text);
    if (code) return code[1].toUpperCase();
  }
  const hay = ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
  return GROUP_MATCHERS.find((m) => hay.includes(m.needle))?.group ?? null;
}

// ─── Топливо и коробка ───────────────────────────────────────────────────

export type Fuel = "gasoline" | "diesel" | "hybrid" | "electric" | "lpg" | "hydrogen" | "other";

/**
 * Топливо одним из семи значений. Варианты источников (02.10.2026):
 * «Hybrid (Gasoline)» (K Car), «Plug-in Hybrid» (HeyDealer) — гибрид;
 * «Bi-fuel», «가솔린+LPG» — газ; «Hydrogen / Electric» — водород.
 * Пусто — null (у HeyDealer ~12% без топлива): «неизвестно», а не «other».
 */
export function normalizeFuel(raw: string | undefined): Fuel | null {
  const s = (raw ?? "").toLowerCase();
  if (!s.trim()) return null;
  if (s.includes("hydrogen") || s.includes("수소")) return "hydrogen";
  if (s.includes("hybrid") || s.includes("하이브리드")) return "hybrid";
  if (s.includes("electric") || s.includes("전기")) return "electric";
  if (s.includes("diesel") || s.includes("디젤")) return "diesel";
  if (s.includes("lpg") || s.includes("bi-fuel") || s.includes("가스")) return "lpg";
  if (s.includes("gasoline") || s.includes("petrol") || s.includes("가솔린") || s.includes("휘발유")) return "gasoline";
  return "other";
}

/** «A/T» и «Automatic» — одно и то же; «M/T» и «Manual» — тоже. Пусто — null. */
export function normalizeTrans(raw: string | undefined): "auto" | "manual" | null {
  const s = (raw ?? "").toLowerCase().trim();
  if (!s) return null;
  if (s.startsWith("m") || s.includes("manual") || s.includes("수동")) return "manual";
  return "auto";
}

/** Целое > 0 или null. Источники пишут «нет значения» нулём — в фильтр ноль идти не должен. */
export function positive(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : null;
}
