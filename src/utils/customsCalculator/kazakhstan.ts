/**
 * Калькулятор таможенных платежей Казахстан (КЗ) для физических лиц
 *
 * Нормативная база (май 2026):
 *  МРП 2026:              4 325 ₸ (Закон о бюджете РК на 2026–2028 гг.)
 *  Таможенный сбор:        6 МРП = 25 950 ₸
 *  Пошлина:               15% от ТС (ЕАЭС ЕТТ) / 0% для электромобилей
 *                          Авто >7 лет: max(15%, мин. €/см³ по 3 скобкам)
 *  Акциз (объём):         Engine_Volume × 100 ₸ если >3 000 см³ (со всего объёма)
 *  Акциз (роскошь):       +10% от ТС если ТС > 18 000 МРП (77 850 000 ₸)
 *                          (новый НК РК, ст. 537, разъяснение КГД МФ РК от 01.10.2025)
 *  НДС:                   (ТС + Пошлина + Акциз_объём) × 16%
 *                          (ставка повышена с 12% до 16% с 01.01.2026, новый НК РК)
 *  Первичная регистрация:  по полным месяцам: ≤24→1 081 / ≤36→216 250 / >36→2 162 500 ₸
 *  Утилизационный сбор:   50 МРП × коэффициент (1.5 / 3.5 / 5.0 / 11.5) / электро = 0 ₸
 *  Доп. расходы (оценка): ~400 000 ₸ (СБКТС + ЭВАК + брокер + СВХ)
 *  Доставка:              НЕ включена в расчёт
 *
 *  Возраст: таможня РК считает датой выпуска ПОСЛЕДНИЙ день месяца из yearMonth.
 *  Формула полных месяцев: (текущий_год - год) × 12 + (текущий_месяц - месяц_выпуска)
 *  Это эквивалентно подходу «последний день месяца» без поправки на день.
 *  Граница «до 2 лет»: ageMonths ≤ 24 включительно.
 */

const MRP = 4_325; // ₸, 2026
const UTIL_BASE = 50 * MRP; // 216 250 ₸
const LUXURY_THRESHOLD = 18_000 * MRP; // 77 850 000 ₸

export interface CustomsInputKZ {
  priceKRW: number;     // цена авто в вонах (KRW)
  yearMonth: string;    // "202301" — год и месяц выпуска
  engineVolume: number; // объём двигателя, см³
  fuelType?: string;    // тип топлива
  usdKztRate: number;   // курс USD/KZT (тенге за 1 USD)
  eurKztRate: number;   // курс EUR/KZT (для пошлины авто >7 лет)
  krwUsdRate: number;   // курс KRW→USD (USD за 1 KRW)
}

export interface CustomsResultKZ {
  customsValueKZT: number;    // таможенная стоимость в тенге (без доставки)
  customsFeeKZT: number;      // таможенный сбор (6 МРП = 25 950 ₸)
  dutyKZT: number;            // таможенная пошлина
  exciseEngineKZT: number;    // акциз по объёму (только >3 000 см³)
  exciseLuxuryKZT: number;    // акциз на роскошь (ТС > 18 000 МРП)
  vatKZT: number;             // НДС 16%
  registrationFeeKZT: number; // сбор за первичную регистрацию (ЦОН)
  recyclingFeeKZT: number;    // утилизационный сбор (Жасыл Даму)
  additionalKZT: number;      // СБКТС + ЭВАК + брокер + СВХ (оценка ~400 000 ₸)
  totalKZT: number;           // итого таможенных платежей
  carAgeMonths: number;       // возраст авто (полных месяцев)
  priceUSD: number;           // цена авто в USD
  isLuxury: boolean;          // флаг акциза на роскошь
  isOldCar: boolean;          // >7 лет — нецелесообразно для ввоза
  isElectric: boolean;
}

/**
 * Возраст авто в полных месяцах.
 * Таможня РК принимает датой выпуска последний день указанного месяца.
 * Формула без поправки на день эквивалентна этому правилу:
 *   ageMonths = (curYear - mfrYear) × 12 + (curMonth - mfrMonth)
 *
 * Проверка (сегодня май 2026):
 *   "202405" (май 2024)   → (2026-2024)×12 + (5-5) = 24 мес → ≤24 → 1 081 ₸ ✓
 *   "202404" (апрель 2024) → (2026-2024)×12 + (5-4) = 25 мес → >24 → 216 250 ₸ ✓
 */
function getCarAgeMonths(yearMonth: string): number {
  const mfrYear  = parseInt(yearMonth.slice(0, 4), 10);
  const mfrMonth = parseInt(yearMonth.slice(4, 6), 10); // 1-indexed
  const now = new Date();
  return Math.max(0, (now.getFullYear() - mfrYear) * 12 + (now.getMonth() + 1 - mfrMonth));
}

function isElectricFuel(fuelType?: string): boolean {
  if (!fuelType) return false;
  const f = fuelType.toLowerCase();
  return f.includes("전기") || f.includes("electric") || f.includes("ev");
}

/** Минимальная ставка пошлины (€/см³) для авто старше 7 лет */
function getMinDutyEurPerCc(cc: number): number {
  if (cc <= 1_800) return 0.45;
  if (cc <= 3_000) return 0.55;
  return 0.60;
}

/** Коэффициент утилизационного сбора для ДВС / Гибридов */
function getUtilCoeff(cc: number): number {
  if (cc <= 1_000) return 1.5;
  if (cc <= 2_000) return 3.5;
  if (cc <= 3_000) return 5.0;
  return 11.5;
}

export function calcCustomsKZ(input: CustomsInputKZ): CustomsResultKZ {
  const { priceKRW, yearMonth, engineVolume, fuelType, usdKztRate, eurKztRate, krwUsdRate } = input;

  const ageMonths = getCarAgeMonths(yearMonth);
  const electric  = isElectricFuel(fuelType);
  const isOldCar  = ageMonths > 84; // >7 лет

  // 1. Таможенная стоимость (без доставки)
  const priceUSD       = priceKRW * krwUsdRate;
  const customsValueKZT = priceUSD * usdKztRate;

  // 2. Таможенный сбор
  const customsFeeKZT = 6 * MRP; // 25 950 ₸

  // 3. Таможенная пошлина
  let dutyKZT = 0;
  if (!electric) {
    const dutyByPct = customsValueKZT * 0.15;
    if (isOldCar) {
      const minRate    = getMinDutyEurPerCc(engineVolume);
      const dutyByVol  = engineVolume * minRate * eurKztRate;
      dutyKZT = Math.max(dutyByPct, dutyByVol);
    } else {
      dutyKZT = dutyByPct;
    }
  }

  // 4. Акциз по объёму двигателя (со всего объёма, не с превышения)
  const exciseEngineKZT = engineVolume > 3_000 ? engineVolume * 100 : 0;

  // 5. Акциз на роскошь (новый НК РК 2026, ст. 537)
  const isLuxury       = customsValueKZT > LUXURY_THRESHOLD;
  const exciseLuxuryKZT = isLuxury ? Math.round(customsValueKZT * 0.10) : 0;

  // 6. НДС 16% (ставка повышена с 12% до 16% с 01.01.2026)
  const vatKZT = Math.round((customsValueKZT + dutyKZT + exciseEngineKZT) * 0.16);

  // 7. Первичная регистрация (ЦОН) — одинакова для ДВС и электро
  let registrationFeeKZT: number;
  if (ageMonths <= 24) {
    registrationFeeKZT = Math.round(0.25 * MRP); // 1 081 ₸
  } else if (ageMonths <= 36) {
    registrationFeeKZT = 50 * MRP;               // 216 250 ₸
  } else {
    registrationFeeKZT = 500 * MRP;              // 2 162 500 ₸
  }

  // 8. Утилизационный сбор (Жасыл Даму)
  // Электромобили (прямой импорт из Кореи) = 0 ₸
  const recyclingFeeKZT = electric
    ? 0
    : Math.round(UTIL_BASE * getUtilCoeff(engineVolume));

  // 9. Доп. расходы — оценочные (СБКТС + ЭВАК + брокер + СВХ)
  const additionalKZT = 400_000;

  // 10. Итого
  const totalKZT = Math.round(
    customsFeeKZT + dutyKZT + exciseEngineKZT + exciseLuxuryKZT +
    vatKZT + registrationFeeKZT + recyclingFeeKZT + additionalKZT
  );

  return {
    customsValueKZT:    Math.round(customsValueKZT),
    customsFeeKZT,
    dutyKZT:            Math.round(dutyKZT),
    exciseEngineKZT,
    exciseLuxuryKZT,
    vatKZT,
    registrationFeeKZT,
    recyclingFeeKZT,
    additionalKZT,
    totalKZT,
    carAgeMonths:       ageMonths,
    priceUSD:           Math.round(priceUSD),
    isLuxury,
    isOldCar,
    isElectric:         electric,
  };
}
