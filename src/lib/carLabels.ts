// Локализованные подписи характеристик для title/H1/description карточки авто.
//
// Зачем отдельный модуль: generateMetadata — серверная функция, инстанса i18next
// там нет (см. CLAUDE.md: i18n поднимается per-request), а Encar отдаёт кузов,
// КПП и топливо по-корейски («세단 4도어», «오토», «LPG(일반인 구입)»).
// Без перевода эти строки утекли бы прямо в сниппет Google.
//
// Правило безопасности: если слово не нашлось в словаре и содержит хангыль —
// поле выбрасывается целиком. Пустое поле в сниппете лучше корейского.

const HANGUL = /[ㄱ-힝]/;

// Разделитель разрядов у пробега: в ru принят пробел, в остальных локалях —
// запятая. Раньше здесь был жёстко зашит ru-RU, и в английском сниппете
// оказывалось «144 877 km» вместо «144,877 km».
const NUMBER_LOCALE: Record<string, string> = {
  ru: "ru-RU",
  en: "en-US",
  ka: "en-US",
  ar: "en-US",
};

export type CarsDict = Record<string, string>;

// Encar склеивает марку с историческим названием и отдаёт это как «английское»
// имя: ChevroletGMDaewoo, Renault-KoreaSamsung, KG_Mobility_Ssangyong.
// В таком виде оно попадало в H1, title, описание и brand в JSON-LD.
const BRAND_ALIASES: Record<string, string> = {
  ChevroletGMDaewoo: "Chevrolet",
  "Renault-KoreaSamsung": "Renault Korea",
  KG_Mobility_Ssangyong: "KG Mobility",
};

/** Человеческое имя марки для заголовков и разметки. */
export function normalizeBrand(raw: string | null | undefined): string {
  if (!raw) return "";
  return BRAND_ALIASES[raw] ?? raw;
}

/** Словарь cars.json нужного языка. Динамический импорт — чтобы в серверный
 *  бандл не тянулись все четыре локали разом. */
export async function loadCarsDict(lang: string): Promise<CarsDict> {
  try {
    switch (lang) {
      case "en":
        return (await import("@/locales/en/cars.json")).default as CarsDict;
      case "ka":
        return (await import("@/locales/ka/cars.json")).default as CarsDict;
      case "ar":
        return (await import("@/locales/ar/cars.json")).default as CarsDict;
      default:
        return (await import("@/locales/ru/cars.json")).default as CarsDict;
    }
  } catch {
    return {};
  }
}

/**
 * Переводит пословно («세단 4도어» → «Седан 4-дв.»).
 * Возвращает null, если после перевода остался хангыль.
 */
export function localizeSpec(
  raw: string | null | undefined,
  dict: CarsDict,
): string | null {
  if (!raw) return null;
  const words = String(raw).trim().split(/\s+/);
  const out: string[] = [];
  for (const w of words) {
    const hit = dict[w];
    if (hit) {
      out.push(hit);
      continue;
    }
    if (HANGUL.test(w)) return null; // непереведённый корейский — поле не берём
    out.push(w);
  }
  const joined = out.join(" ").trim();
  return joined || null;
}

// Топливо приходит с «хвостами» вида «LPG(일반인 구입)» — сопоставляем по вхождению
// ключа, как это уже делает fuelMap для schema.org в карточке.
const FUEL_KEYS = ["가솔린", "디젤", "전기", "하이브리드", "수소", "LPG"];

export function localizeFuel(
  raw: string | null | undefined,
  dict: CarsDict,
): string | null {
  if (!raw) return null;
  const key = FUEL_KEYS.find((k) => raw.includes(k));
  if (!key) return null;
  const hit = dict[key];
  return hit && !HANGUL.test(hit) ? hit : null;
}

// Фразы, которых нет в cars.json (там только словарь Encar).
export const SPEC_PHRASES: Record<
  string,
  {
    km: string;
    noAccidents: string;
    accidents: (n: number) => string;
    owners: (n: number) => string;
  }
> = {
  ru: {
    km: "км",
    noAccidents: "без ДТП",
    accidents: (n) => `ДТП: ${n}`,
    owners: (n) => `владельцев: ${n}`,
  },
  en: {
    km: "km",
    noAccidents: "no accidents",
    accidents: (n) => `${n} accident${n === 1 ? "" : "s"}`,
    owners: (n) => `${n} owner${n === 1 ? "" : "s"}`,
  },
  ka: {
    km: "კმ",
    noAccidents: "უავარიო",
    accidents: (n) => `ავარია: ${n}`,
    owners: (n) => `მფლობელი: ${n}`,
  },
  ar: {
    km: "كم",
    noAccidents: "بدون حوادث",
    accidents: (n) => `حوادث: ${n}`,
    owners: (n) => `الملاك: ${n}`,
  },
};

/**
 * Готовые куски для описания/H1: кузов, топливо, КПП, пробег, история.
 * Всё опционально — любое поле может отсутствовать у конкретной машины.
 */
export function buildSpecBits(opts: {
  lang: string;
  dict: CarsDict;
  bodyRaw?: string | null;
  fuelRaw?: string | null;
  transmissionRaw?: string | null;
  mileage?: number | null;
  accidents?: number | null;
  owners?: number | null;
}): { specs: string[]; history: string[]; mileageLabel: string | null; transmission: string | null } {
  const p = SPEC_PHRASES[opts.lang] ?? SPEC_PHRASES.ru;

  const body = localizeSpec(opts.bodyRaw, opts.dict);
  const fuel = localizeFuel(opts.fuelRaw, opts.dict);
  const transmission = localizeSpec(opts.transmissionRaw, opts.dict);
  const mileageLabel =
    typeof opts.mileage === "number" && opts.mileage > 0
      ? `${opts.mileage.toLocaleString(NUMBER_LOCALE[opts.lang] ?? "ru-RU")} ${p.km}`
      : null;

  const specs = [body, fuel, transmission, mileageLabel].filter(
    (x): x is string => !!x,
  );

  const history: string[] = [];
  if (typeof opts.accidents === "number") {
    history.push(opts.accidents === 0 ? p.noAccidents : p.accidents(opts.accidents));
  }
  if (typeof opts.owners === "number" && opts.owners > 0) {
    history.push(p.owners(opts.owners));
  }

  return { specs, history, mileageLabel, transmission };
}
