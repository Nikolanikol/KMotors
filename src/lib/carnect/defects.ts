// Замечания площадки (`notes` лота) → список дефектов по-русски или по-английски
// (язык карточки — lang.ts).
//
// Решение владельца 04.10.2026: дефекты, найденные площадкой, клиент ВИДИТ.
// Это самое ценное в данных лота — у Lotte K8 там «течь масла, течь антифриза,
// сильно погнуто днище», а без них клиент видел одну оценку «F/F».
//
// Формат у площадок общий: фразы через запятую, у K Car — несколько кусков
// через « · », и первые из них — юридический текст площадки для дилеров
// («старше 6 лет, претензии не принимаются»). Его клиенту не показываем: в
// таком виде он читается как «машина с подвохом», хотя это стандартный договор.
//
// Перевод — «узел: состояние» («Днище: сильно погнуто»), а не склонением во
// фразу: два словаря вместо словаря всех сочетаний, и новое сочетание знакомых
// слов переводится само. Незнакомая фраза остаётся по-английски — лучше, чем
// промолчать о дефекте. Фраза с хангылем выбрасывается: корейский клиенту не
// показываем (то же правило, что у Encar, CLAUDE.md).

import { pick, type CardLang, type Pair } from "./lang";

/** Куски с юридическим текстом и служебными пометками площадки — не дефекты. */
const BOILERPLATE =
  /claim|dealer stock|transferred to a dealer|deregistration|see photos|inspect the actual|before bidding|vehicle location|sub-grade/i;

/** Не дефекты, а комплектность — клиенту шум. Ключи разбираются отдельно. */
const NEUTRAL = /manual|first[- ]aid|tool ?kit|warning triangle/i;

/** Состояние — окончание фразы. Длинные раньше коротких: «needs repair» до «repair». */
const CONDITIONS: [RegExp, Pair][] = [
  [/\bbent severe$/i, ["сильно погнуто", "badly bent"]],
  [/\bbent$/i, ["погнуто", "bent"]],
  [/\bneeds? repair$/i, ["требует ремонта", "needs repair"]],
  [/\bneeds? replacement$/i, ["требует замены", "needs replacement"]],
  [/\bnot working$/i, ["не работает", "not working"]],
  [/\bnoise\/leak$/i, ["шум и течь", "noise and leak"]],
  [/\bleak$/i, ["течь", "leak"]],
  [/\bnoise$/i, ["шум", "noise"]],
  [/\bfault$/i, ["неисправность", "fault"]],
  [/\bdefect(ive)?$/i, ["дефект", "defect"]],
  [/\bdamaged?$/i, ["повреждение", "damaged"]],
  [/\bcorrosion$/i, ["коррозия", "corrosion"]],
  [/\brust$/i, ["ржавчина", "rust"]],
  [/\bscratch(es)?$/i, ["царапины", "scratches"]],
  [/\bdent(s)?$/i, ["вмятины", "dents"]],
  [/\bcrack(ed|s)?$/i, ["трещина", "crack"]],
  [/\bworn$/i, ["износ", "worn"]],
  [/\bdust$/i, ["загрязнение", "dirty"]],
  [/\bwarning( light)?$/i, ["горит ошибка", "warning light on"]],
];

/** Узел — начало фразы, в нижнем регистре. */
const SUBJECTS: Record<string, Pair> = {
  engine: ["Двигатель", "Engine"],
  "engine oil": ["Моторное масло", "Engine oil"],
  oil: ["Масло", "Oil"],
  coolant: ["Охлаждающая жидкость", "Coolant"],
  transmission: ["Коробка передач", "Transmission"],
  "transmission oil": ["Масло КПП", "Transmission oil"],
  turbo: ["Турбина", "Turbo"],
  "belt/bearing": ["Ремень / подшипник", "Belt / bearing"],
  belt: ["Ремень", "Belt"],
  "exhaust line": ["Выхлопная система", "Exhaust"],
  exhaust: ["Выхлопная система", "Exhaust"],
  underbody: ["Днище", "Underbody"],
  undercover: ["Защита днища", "Underbody cover"],
  ps: ["Гидроусилитель руля", "Power steering"],
  "power steering": ["Гидроусилитель руля", "Power steering"],
  steering: ["Рулевое управление", "Steering"],
  brake: ["Тормоза", "Brakes"],
  brakes: ["Тормоза", "Brakes"],
  suspension: ["Подвеска", "Suspension"],
  "shock absorber": ["Амортизатор", "Shock absorber"],
  battery: ["Аккумулятор", "Battery"],
  electrical: ["Электрика", "Electrical"],
  "a/c": ["Кондиционер", "A/C"],
  aircon: ["Кондиционер", "A/C"],
  heater: ["Отопитель", "Heater"],
  airbag: ["Подушка безопасности", "Airbag"],
  seat: ["Сиденье", "Seat"],
  seats: ["Сиденья", "Seats"],
  "interior trim": ["Отделка салона", "Interior trim"],
  interior: ["Салон", "Interior"],
  headliner: ["Потолок салона", "Headliner"],
  dashboard: ["Приборная панель", "Dashboard"],
  cluster: ["Приборная панель", "Instrument cluster"],
  "hi pass": ["Транспондер Hi-Pass", "Hi-Pass transponder"],
  navigation: ["Навигация", "Navigation"],
  sunroof: ["Люк", "Sunroof"],
  camera: ["Камера", "Camera"],
  "rear camera": ["Камера заднего вида", "Rear camera"],
  sensor: ["Датчик", "Sensor"],
  "parking sensor": ["Парктроник", "Parking sensor"],
  "smart key": ["Смарт-ключ", "Smart key"],
  headlight: ["Фара", "Headlight"],
  headlights: ["Фары", "Headlights"],
  lamp: ["Фонарь", "Lamp"],
  windshield: ["Лобовое стекло", "Windshield"],
  glass: ["Стекло", "Glass"],
  mirror: ["Зеркало", "Mirror"],
  door: ["Дверь", "Door"],
  wheel: ["Диски", "Wheels"],
  wheels: ["Диски", "Wheels"],
  tire: ["Шины", "Tires"],
  tires: ["Шины", "Tires"],
  body: ["Кузов", "Body"],
  paint: ["Лакокрасочное покрытие", "Paint"],
};

const HANGUL = /[ㄱ-힝]/;

/** Склейки у источника: «PSfault», «A/Cneeds repair». */
function unglue(s: string): string {
  return s.replace(/^(PS|A\/C)(?=[a-z])/i, "$1 ").replace(/\s+/g, " ").trim();
}

/**
 * Одна фраза → «Узел: состояние». Незнакомая — исходной строкой с known: false
 * (по таким пополняют словарь, их видно в служебной панели). С хангылем — null.
 */
export function translateDefect(phrase: string, lang: CardLang = "ru"): { text: string; known: boolean } | null {
  const p = unglue(phrase);
  if (!p) return null;

  // «Wheel scratches 4EA» → «Диски: царапины (4)».
  const counted = /^(.*?)\s*(\d+)\s*EA$/i.exec(p);
  const body = counted ? counted[1] : p;
  const count = counted ? ` (${counted[2]})` : "";

  for (const [re, cond] of CONDITIONS) {
    const m = re.exec(body);
    if (!m) continue;
    const subject = SUBJECTS[body.slice(0, m.index).trim().toLowerCase()];
    if (subject) return { text: `${pick(lang, subject)}: ${pick(lang, cond)}${count}`, known: true };
    break;
  }
  return HANGUL.test(p) ? null : { text: p, known: false };
}

export interface PlatformNotes {
  /** Дефекты на языке карточки, без дублей, в порядке площадки. */
  defects: string[];
  /** «Keys 1EA» у K Car — число ключей. */
  keys: number | null;
  /** Фразы, которых нет в словаре (и с хангылем) — для служебной панели. */
  unknown: string[];
}

/** Разбирает `notes` лота. Пустые и чисто служебные заметки дают пустой список. */
export function parseNotes(notes: string | undefined | null, lang: CardLang = "ru"): PlatformNotes {
  const out: PlatformNotes = { defects: [], keys: null, unknown: [] };
  if (!notes) return out;
  for (const chunk of notes.split(/\s+·\s+|★/)) {
    if (!chunk.trim() || BOILERPLATE.test(chunk)) continue;
    for (const raw of chunk.split(/,\s*/)) {
      const phrase = raw.replace(/^[*\s]+/, "").trim();
      if (!phrase) continue;
      const keys = /^(?:smart )?keys?\s*(\d+)\s*EA$/i.exec(phrase);
      if (keys) {
        out.keys = Number(keys[1]);
        continue;
      }
      if (NEUTRAL.test(phrase)) continue;
      const t = translateDefect(phrase, lang);
      if (!t || !t.known) out.unknown.push(phrase);
      if (t && !out.defects.includes(t.text)) out.defects.push(t.text);
    }
  }
  return out;
}
