// Замечания площадки (`notes` лота) → список дефектов по-русски.
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

/** Куски с юридическим текстом и служебными пометками площадки — не дефекты. */
const BOILERPLATE =
  /claim|dealer stock|transferred to a dealer|deregistration|see photos|inspect the actual|before bidding|vehicle location|sub-grade/i;

/** Не дефекты, а комплектность — клиенту шум. Ключи разбираются отдельно. */
const NEUTRAL = /manual|first[- ]aid|tool ?kit|warning triangle/i;

/** Состояние — окончание фразы. Длинные раньше коротких: «needs repair» до «repair». */
const CONDITIONS: [RegExp, string][] = [
  [/\bbent severe$/i, "сильно погнуто"],
  [/\bbent$/i, "погнуто"],
  [/\bneeds? repair$/i, "требует ремонта"],
  [/\bneeds? replacement$/i, "требует замены"],
  [/\bnot working$/i, "не работает"],
  [/\bnoise\/leak$/i, "шум и течь"],
  [/\bleak$/i, "течь"],
  [/\bnoise$/i, "шум"],
  [/\bfault$/i, "неисправность"],
  [/\bdefect(ive)?$/i, "дефект"],
  [/\bdamaged?$/i, "повреждение"],
  [/\bcorrosion$/i, "коррозия"],
  [/\brust$/i, "ржавчина"],
  [/\bscratch(es)?$/i, "царапины"],
  [/\bdent(s)?$/i, "вмятины"],
  [/\bcrack(ed|s)?$/i, "трещина"],
  [/\bworn$/i, "износ"],
  [/\bdust$/i, "загрязнение"],
  [/\bwarning( light)?$/i, "горит ошибка"],
];

/** Узел — начало фразы, в нижнем регистре. */
const SUBJECTS: Record<string, string> = {
  engine: "Двигатель",
  "engine oil": "Моторное масло",
  oil: "Масло",
  coolant: "Охлаждающая жидкость",
  transmission: "Коробка передач",
  "transmission oil": "Масло КПП",
  turbo: "Турбина",
  "belt/bearing": "Ремень / подшипник",
  belt: "Ремень",
  "exhaust line": "Выхлопная система",
  exhaust: "Выхлопная система",
  underbody: "Днище",
  undercover: "Защита днища",
  ps: "Гидроусилитель руля",
  "power steering": "Гидроусилитель руля",
  steering: "Рулевое управление",
  brake: "Тормоза",
  brakes: "Тормоза",
  suspension: "Подвеска",
  "shock absorber": "Амортизатор",
  battery: "Аккумулятор",
  electrical: "Электрика",
  "a/c": "Кондиционер",
  aircon: "Кондиционер",
  heater: "Отопитель",
  airbag: "Подушка безопасности",
  seat: "Сиденье",
  seats: "Сиденья",
  "interior trim": "Отделка салона",
  interior: "Салон",
  headliner: "Потолок салона",
  dashboard: "Приборная панель",
  cluster: "Приборная панель",
  "hi pass": "Транспондер Hi-Pass",
  navigation: "Навигация",
  sunroof: "Люк",
  camera: "Камера",
  "rear camera": "Камера заднего вида",
  sensor: "Датчик",
  "parking sensor": "Парктроник",
  "smart key": "Смарт-ключ",
  headlight: "Фара",
  headlights: "Фары",
  lamp: "Фонарь",
  windshield: "Лобовое стекло",
  glass: "Стекло",
  mirror: "Зеркало",
  door: "Дверь",
  wheel: "Диски",
  wheels: "Диски",
  tire: "Шины",
  tires: "Шины",
  body: "Кузов",
  paint: "Лакокрасочное покрытие",
};

const HANGUL = /[ㄱ-힝]/;

/** Склейки у источника: «PSfault», «A/Cneeds repair». */
function unglue(s: string): string {
  return s.replace(/^(PS|A\/C)(?=[a-z])/i, "$1 ").replace(/\s+/g, " ").trim();
}

/** Одна фраза → «Узел: состояние», либо исходная, если узел незнаком. */
export function translateDefect(phrase: string): string | null {
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
    if (subject) return `${subject}: ${cond}${count}`;
    break;
  }
  return HANGUL.test(p) ? null : p;
}

export interface PlatformNotes {
  /** Дефекты по-русски, без дублей, в порядке площадки. */
  defects: string[];
  /** «Keys 1EA» у K Car — число ключей. */
  keys: number | null;
}

/** Разбирает `notes` лота. Пустые и чисто служебные заметки дают пустой список. */
export function parseNotes(notes: string | undefined | null): PlatformNotes {
  const out: PlatformNotes = { defects: [], keys: null };
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
      const t = translateDefect(phrase);
      if (t && !out.defects.includes(t)) out.defects.push(t);
    }
  }
  return out;
}
