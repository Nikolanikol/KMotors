// Грунтинг блога реальными данными с encar.com (внутренний рынок Кореи).
// Даёт генератору статей настоящие диапазоны цен по модели вместо выдумок.
// Модели на encar именуются по-корейски (ModelGroup) — карта ниже собрана
// из nav-фасетов encar для Hyundai/Kia/Genesis.

const MFR = { hyundai: "현대", kia: "기아", genesis: "제네시스" } as const;

// Ключ — англ. название модели в нижнем регистре (без марки), значение —
// корейский ModelGroup + производитель. Псевдонимы (Optima=K5, Elantra=Avante).
const MODEL_MAP: Record<string, { mfr: string; group: string }> = {
  // Hyundai
  staria: { mfr: MFR.hyundai, group: "스타리아" },
  palisade: { mfr: MFR.hyundai, group: "팰리세이드" },
  tucson: { mfr: MFR.hyundai, group: "투싼" },
  "santa fe": { mfr: MFR.hyundai, group: "싼타페" },
  santafe: { mfr: MFR.hyundai, group: "싼타페" },
  sonata: { mfr: MFR.hyundai, group: "쏘나타" },
  grandeur: { mfr: MFR.hyundai, group: "그랜저" },
  avante: { mfr: MFR.hyundai, group: "아반떼" },
  elantra: { mfr: MFR.hyundai, group: "아반떼" },
  kona: { mfr: MFR.hyundai, group: "코나" },
  casper: { mfr: MFR.hyundai, group: "캐스퍼" },
  starex: { mfr: MFR.hyundai, group: "스타렉스" },
  "ioniq 5": { mfr: MFR.hyundai, group: "아이오닉5" },
  ioniq5: { mfr: MFR.hyundai, group: "아이오닉5" },
  "ioniq 6": { mfr: MFR.hyundai, group: "아이오닉6" },
  ioniq6: { mfr: MFR.hyundai, group: "아이오닉6" },
  venue: { mfr: MFR.hyundai, group: "베뉴" },
  veloster: { mfr: MFR.hyundai, group: "벨로스터" },
  veracruz: { mfr: MFR.hyundai, group: "베라크루즈" },
  maxcruz: { mfr: MFR.hyundai, group: "맥스크루즈" },
  nexo: { mfr: MFR.hyundai, group: "넥쏘" },
  equus: { mfr: MFR.hyundai, group: "에쿠스" },
  i30: { mfr: MFR.hyundai, group: "i30" },
  // Kia
  carnival: { mfr: MFR.kia, group: "카니발" },
  sorento: { mfr: MFR.kia, group: "쏘렌토" },
  sportage: { mfr: MFR.kia, group: "스포티지" },
  seltos: { mfr: MFR.kia, group: "셀토스" },
  stinger: { mfr: MFR.kia, group: "스팅어" },
  k5: { mfr: MFR.kia, group: "K5" },
  optima: { mfr: MFR.kia, group: "K5" },
  k7: { mfr: MFR.kia, group: "K7" },
  k8: { mfr: MFR.kia, group: "K8" },
  k9: { mfr: MFR.kia, group: "K9" },
  k3: { mfr: MFR.kia, group: "K3" },
  cerato: { mfr: MFR.kia, group: "K3" },
  forte: { mfr: MFR.kia, group: "K3" },
  mohave: { mfr: MFR.kia, group: "모하비" },
  niro: { mfr: MFR.kia, group: "니로" },
  soul: { mfr: MFR.kia, group: "쏘울" },
  ray: { mfr: MFR.kia, group: "레이" },
  morning: { mfr: MFR.kia, group: "모닝" },
  ev6: { mfr: MFR.kia, group: "EV6" },
  ev9: { mfr: MFR.kia, group: "EV9" },
  // Genesis
  g70: { mfr: MFR.genesis, group: "G70" },
  g80: { mfr: MFR.genesis, group: "G80" },
  g90: { mfr: MFR.genesis, group: "G90" },
  gv60: { mfr: MFR.genesis, group: "GV60" },
  gv70: { mfr: MFR.genesis, group: "GV70" },
  gv80: { mfr: MFR.genesis, group: "GV80" },
};

function resolveModel(name: string): { mfr: string; group: string } | null {
  const n = name.toLowerCase().replace(/hyundai|kia|genesis/g, "").trim();
  if (MODEL_MAP[n]) return MODEL_MAP[n];
  // подстрочный матч (напр. "santa fe mx5" → "santa fe", "k5 optima" → "k5")
  for (const key of Object.keys(MODEL_MAP)) {
    if (n.includes(key)) return MODEL_MAP[key];
  }
  return null;
}

export interface EncarModelPrice {
  model: string;
  count: number;
  q1Usd: number; // 25-й перцентиль — нижняя граница «типичной» цены
  medianUsd: number;
  q3Usd: number; // 75-й перцентиль — верхняя граница «типичной» цены
  yearMin: string;
  yearMax: string;
}

// Перцентиль по отсортированному массиву (линейная интерполяция).
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

interface EncarListing {
  Price?: number; // в 만원 (10 000 KRW)
  Year?: number; // YYYYMM
  FormYear?: number;
}

/**
 * Реальные цены по модели с encar (внутренний рынок Кореи, CarType.Y).
 * Возвращает null, если модель не распознана (экспорт-онли вроде Telluride)
 * или данных мало. Цены конвертируются в USD по krwPerUsd (KRW за 1 USD).
 */
export async function fetchEncarModelPrice(
  name: string,
  krwPerUsd: number
): Promise<EncarModelPrice | null> {
  const m = resolveModel(name);
  if (!m) return null;

  const q = `(And.Hidden.N._.(C.CarType.Y._.(C.Manufacturer.${m.mfr}._.ModelGroup.${m.group}.)))`;
  const url = `https://api.encar.com/search/car/list/premium?count=true&q=${encodeURIComponent(q)}&sr=%7CModifiedDate%7C0%7C100`;

  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
      },
      cache: "no-store",
    });
    const data = (await res.json()) as { SearchResults?: EncarListing[]; Count?: number };
    const results = data.SearchResults ?? [];

    // Цена + год по каждому объявлению.
    const entries = results
      .map((r) => ({
        price: r.Price,
        year: Number(String(r.Year ?? r.FormYear ?? "").slice(0, 4)),
      }))
      .filter((e): e is { price: number; year: number } => typeof e.price === "number" && e.price > 0);

    // Фильтр «последние ~7 лет» — отсекает старые поколения (которые в разы
    // дешевле и раздувают разброс) и совпадает с тем, что реально везут из Кореи.
    // Фолбэк на все годы, если свежих объявлений мало.
    const recentCutoff = new Date().getFullYear() - 7;
    const recent = entries.filter((e) => e.year >= recentCutoff);
    const use = recent.length >= 5 ? recent : entries;

    const prices = use.map((e) => e.price).sort((a, b) => a - b);
    if (prices.length < 3) return null;

    const toUsd = (manwon: number) => Math.round((manwon * 10000) / krwPerUsd / 100) * 100;
    const years = use.map((e) => e.year).filter((y) => y > 1990);

    return {
      model: name,
      count: data.Count ?? prices.length,
      // Межквартильный диапазон (25–75%) — «типичная» цена без старых убитых
      // и новых топ-комплектаций, которые раздувают сырой min–max.
      q1Usd: toUsd(percentile(prices, 0.25)),
      medianUsd: toUsd(percentile(prices, 0.5)),
      q3Usd: toUsd(percentile(prices, 0.75)),
      yearMin: years.length ? String(Math.min(...years)) : "",
      yearMax: years.length ? String(Math.max(...years)) : "",
    };
  } catch {
    return null;
  }
}

/**
 * Собирает блок «реальных данных» для промпта генерации по моделям темы.
 * Пустая строка, если ни одной модели не удалось сматчить (генерация продолжится
 * без грунтинга — не блокируем).
 */
export async function buildEncarGrounding(
  models: string[],
  krwPerUsd: number
): Promise<string> {
  const targets = (models || []).slice(0, 3);
  const lines: string[] = [];
  for (const name of targets) {
    const d = await fetchEncarModelPrice(name, krwPerUsd);
    if (d) {
      const k = (n: number) => `$${(n / 1000).toFixed(1)}k`;
      lines.push(
        `- ${d.model}: ~${d.count} объявлений на encar (внутренний рынок Кореи), медиана ${k(d.medianUsd)}, типичная цена ${k(d.q1Usd)}–${k(d.q3Usd)} (25–75%, свежие годы ${d.yearMin}–${d.yearMax}; разброс — год выпуска, пробег, комплектация)`
      );
    }
  }
  if (lines.length === 0) return "";
  return `\nРЕАЛЬНЫЕ ДАННЫЕ с корейского рынка на сегодня (encar.com — используй как основу для цен, не выдумывай другие):\n${lines.join(
    "\n"
  )}\nЕсли какой-то модели из темы здесь нет — вероятно, она экспортная и на внутреннем рынке Кореи не продаётся (например, Kia Telluride); упомяни это честно.\n`;
}
