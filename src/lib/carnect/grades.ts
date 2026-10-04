// Расшифровка оценок площадок (insp_grade) для клиента.
//
// Шкалы у площадок РАЗНЫЕ, и без расшифровки буквы клиенту ничего не говорят
// (решение владельца 02.10.2026). Форматы по живым данным 04.10.2026:
//   Lotte, SK   «A/C»  — две буквы через слэш;
//   Autohub     «AC»   — две буквы слитно;
//   Autobell, K Car «A» — одна буква.
//
// ⚠️ Расшифровываем ТОЛЬКО то, что подтверждено источником (решение владельца
// 04.10.2026). Это описание состояния машины: выдуманная легенда — прямой
// обман клиента. У SK и K Car источника не нашлось — у них буква без
// пояснения, пока не появится легенда площадки. Формат SK совпадает с Lotte,
// но это ещё не значит, что совпадают шкалы.
//
// Источники (04.10.2026):
//   • Lotte — разбор дилеров на clien.net (cm_car/11925989) и сводка шкалы
//     Lotte Auto Auction; первая буква — ДТП/каркас, вторая — внешние панели,
//     которые требуют ремонта СЕЙЧАС (A — ни одной … F — 10 и больше);
//   • Autohub — та же схема у AJ Sellcar, вошедшей в Autohub Auction (там же
//     и cardcarcare.com);
//   • Autobell (Hyundai Glovis) — исходно «A9»: буква — ДТП/каркас (A — без
//     ДТП), цифра — внешний вид 9…1. carnect отдаёт ТОЛЬКО букву.
// Официальной публикации шкалы у самих площадок не нашли — при первой
// возможности сверить с их легендой (FAQ Lotte отсылает к «운영방식», текста нет).

import type { CarnectHouse } from "./houses";
import { pick, type CardLang, type Pair } from "./lang";

/** Первая буква: история ДТП и ремонта каркаса. */
const ACCIDENT_LOTTE: Record<string, Pair> = {
  A: ["без ДТП, каркас не менялся", "no accidents, frame untouched"],
  B: [
    "замена внешних элементов каркаса (панели, стойки, заднего крыла, порога)",
    "outer frame parts replaced (panels, pillar, quarter panel, side sill)",
  ],
  C: ["замена внутренней панели или пола багажника", "inner panel or trunk floor replaced"],
  D: ["замена колёсной арки или несколько ремонтов каркаса", "wheelhouse replaced or several frame repairs"],
  E: ["серьёзный ремонт каркаса", "major frame repair"],
  F: [
    "тяжёлый ремонт каркаса (моторный щит, пол, крыша) или особая история — утопленник, тотал",
    "severe frame repair (dash, floor, roof) or special history — flood, total loss",
  ],
};

const ACCIDENT_AUTOHUB: Record<string, Pair> = {
  A: ["без ДТП", "no accidents"],
  B: ["менялись внешние панели, каркас цел", "outer body panels replaced, frame intact"],
  C: ["ремонт каркаса", "frame repair"],
  D: ["ремонт каркаса, серьёзнее C", "frame repair, heavier than C"],
  E: ["серьёзный ремонт каркаса", "major frame repair"],
  F: ["особая история — утопленник, тотал", "special history — flood, total loss"],
};

const ACCIDENT_AUTOBELL: Record<string, Pair> = {
  A: ["без ДТП", "no accidents"],
  B: ["было ДТП — лёгкое", "accident history — light"],
  C: ["было ДТП — среднее", "accident history — moderate"],
  D: ["было ДТП — серьёзное", "accident history — serious"],
  F: ["было ДТП — тяжёлое, с ремонтом каркаса", "accident history — severe, frame repaired"],
};

/** Вторая буква у Lotte и Autohub: сколько внешних панелей требует ремонта сейчас. */
const EXTERIOR: Record<string, Pair> = {
  A: ["внешние панели ремонта не требуют", "no body panels need repair"],
  B: ["1–3 панели требуют ремонта", "1–3 panels need repair"],
  C: ["4–6 панелей требуют ремонта", "4–6 panels need repair"],
  D: ["7–9 панелей требуют ремонта", "7–9 panels need repair"],
  F: ["10 и больше панелей требуют ремонта", "10+ panels need repair"],
};

const T = {
  accident: ["История ДТП", "Accident history"],
  exterior: ["Кузов сейчас", "Body now"],
  scaleOf: ["Шкала площадки", "Grading scale of"],
  autobellNote: [
    "Площадка оценивает и внешний вид цифрой, но в данных её нет.",
    "The auction also grades the exterior with a number, which is not in the data.",
  ],
} satisfies Record<string, Pair>;

export interface GradePart {
  label: string;
  letter: string;
  text: string;
}

export interface GradeInfo {
  /** Оценка как у площадки: «A/C». */
  grade: string;
  parts: GradePart[];
  /** «Grading scale of Lotte Auto Auction» и оговорки. */
  note: string;
}

/**
 * Оценка → расшифровка. null — площадка без подтверждённой шкалы (SK, K Car,
 * HeyDealer) или строка не по формату: тогда показывается голая буква.
 */
export function gradeInfo(
  house: CarnectHouse | "heydealer",
  grade: string | null | undefined,
  lang: CardLang,
  houseName: string,
): GradeInfo | null {
  const g = (grade ?? "").trim().toUpperCase();
  const part = (label: Pair, letter: string, dict: Record<string, Pair>): GradePart | null =>
    dict[letter] ? { label: pick(lang, label), letter, text: pick(lang, dict[letter]) } : null;
  const scale = `${pick(lang, T.scaleOf)} ${houseName}.`;

  let parts: (GradePart | null)[] = [];
  let note = scale;
  if (house === "lotte" || house === "autohub") {
    const m = house === "lotte" ? /^([A-F])\/([A-F])$/.exec(g) : /^([A-F])([A-F])$/.exec(g);
    if (!m) return null;
    const acc = house === "lotte" ? ACCIDENT_LOTTE : ACCIDENT_AUTOHUB;
    parts = [part(T.accident, m[1], acc), part(T.exterior, m[2], EXTERIOR)];
  } else if (house === "glovis") {
    const m = /^([A-F])$/.exec(g);
    if (!m) return null;
    parts = [part(T.accident, m[1], ACCIDENT_AUTOBELL)];
    note = `${scale} ${pick(lang, T.autobellNote)}`;
  } else {
    return null;
  }
  // Незнакомая буква в любой позиции — не расшифровываем вовсе: половина
  // расшифровки рядом с непонятной буквой читается как полная.
  if (parts.some((p) => !p)) return null;
  return { grade: g, parts: parts as GradePart[], note };
}
