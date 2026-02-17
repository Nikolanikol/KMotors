/**
 * Калькулятор таможенных пошлин Узбекистана для физических лиц
 * Актуально: 2025–2026
 *
 * Формулы:
 * - Пошлина: max(стоимость × %, объём × $ставка_за_куб.см)
 *   — до 3 лет: 15% / $0.40 за куб.см
 *   — 3–7 лет:  40% / $3.00 за куб.см
 * - НДС: 12% от (стоимость + пошлина + утилсбор)
 * - Утилсбор: по объёму двигателя в БРВ (не зависит от мощности)
 * - Таможенный сбор: 1% от стоимости (мин. 1 БРВ, макс. 25 БРВ)
 * - Акциз: 0% (отменён с 01.08.2024)
 *
 * Ограничения для физлиц:
 * - Максимальный возраст авто: 7 лет
 * - Экостандарт: не ниже Euro-5
 * - Праворульные авто: запрещены
 * - Корейские авто: льготных ставок СТ-1 нет
 */

export interface CustomsInputUZ {
  priceKRW: number;     // цена авто в вонах (KRW)
  yearMonth: string;    // "202301" — год и месяц выпуска
  engineVolume: number; // объём двигателя, куб.см
  fuelType?: string;    // тип топлива (для электромобилей)
  usdRate: number;      // курс KRW/USD (сколько USD за 1 KRW = KRW_RUB / USD_RUB)
  uzsPerUsd: number;    // курс UZS/USD (сколько UZS за 1 USD)
}

export interface CustomsResultUZ {
  dutyUSD: number;         // таможенная пошлина, USD
  vatUSD: number;          // НДС 12%, USD
  customsFeeUSD: number;   // таможенный сбор за оформление, USD
  recyclingFeeUSD: number; // утилизационный сбор, USD
  totalUSD: number;        // итого, USD
  totalUZS: number;        // итого, узбекских сумов
  priceUSD: number;        // цена авто в USD
  carAgeYears: number;     // возраст авто, лет
  isOverLimit: boolean;    // true — авто старше 7 лет (ввоз запрещён)
}

// БРВ (базовая расчётная величина) — с 01.08.2025: 412 000 сум
const BRV_UZS = 412_000;

/** Возраст авто в годах на текущую дату */
function getCarAgeYears(yearMonth: string): number {
  const year = parseInt(yearMonth.slice(0, 4), 10);
  const month = parseInt(yearMonth.slice(4, 6), 10) - 1;
  const carDate = new Date(year, month, 1);
  const now = new Date();
  const diffMs = now.getTime() - carDate.getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 365.25);
}

/** Таможенная пошлина — комбинированная ставка max(% от стоимости, $N/куб.см) */
function calcDuty(priceUSD: number, cc: number, ageYears: number, isElectric: boolean): number {
  // Электромобили — нулевая ставка (предварительно, требует уточнения у брокера)
  if (isElectric) return 0;

  if (ageYears < 3) {
    // Новые: 15% или $0.40/куб.см
    return Math.max(priceUSD * 0.15, cc * 0.40);
  }
  // 3–7 лет: 40% или $3.00/куб.см
  return Math.max(priceUSD * 0.40, cc * 3.00);
}

/** Утилизационный сбор — по объёму двигателя, в БРВ (одинаков для новых и б/у) */
function calcRecyclingFee(cc: number, uzsPerUsd: number, isElectric: boolean): number {
  let brvCount: number;

  if (isElectric) {
    // Электромобили имеют отдельную систему утилсбора (с 01.05.2025 резко выросла)
    // Новые до 3 лет: 120 БРВ; б/у: 210 БРВ — используем 120 как приближение
    brvCount = 120;
  } else if (cc <= 1_000)      brvCount = 4;
  else if (cc <= 1_500)        brvCount = 7;
  else if (cc <= 2_000)        brvCount = 15;
  else if (cc <= 2_500)        brvCount = 25;
  else if (cc <= 3_000)        brvCount = 40;
  else                         brvCount = 60;

  const feeUZS = brvCount * BRV_UZS;
  return feeUZS / uzsPerUsd; // конвертируем в USD
}

/** Таможенный сбор за оформление — 1% от стоимости (мин. 1 БРВ, макс. 25 БРВ) */
function calcCustomsFee(priceUSD: number, uzsPerUsd: number): number {
  const minUSD = BRV_UZS / uzsPerUsd;       // 1 БРВ в USD
  const maxUSD = 25 * BRV_UZS / uzsPerUsd;  // 25 БРВ в USD
  const fee = priceUSD * 0.01;
  return Math.min(Math.max(fee, minUSD), maxUSD);
}

/** Главная функция расчёта */
export function calcCustomsUZ(input: CustomsInputUZ): CustomsResultUZ {
  const { priceKRW, yearMonth, engineVolume, fuelType, usdRate, uzsPerUsd } = input;

  const ageYears = getCarAgeYears(yearMonth);
  const isElectric = !!(fuelType && (
    fuelType.includes("전기") ||
    fuelType.toLowerCase().includes("electric") ||
    fuelType.toLowerCase().includes("ev")
  ));

  const priceUSD = priceKRW * usdRate;
  const cc = engineVolume;

  const dutyUSD = calcDuty(priceUSD, cc, ageYears, isElectric);
  const recyclingFeeUSD = calcRecyclingFee(cc, uzsPerUsd, isElectric);
  const customsFeeUSD = calcCustomsFee(priceUSD, uzsPerUsd);

  // НДС: 12% от (стоимость + пошлина + утилсбор)
  const vatBase = priceUSD + dutyUSD + recyclingFeeUSD;
  const vatUSD = vatBase * 0.12;

  const totalUSD = dutyUSD + recyclingFeeUSD + customsFeeUSD + vatUSD;
  const totalUZS = totalUSD * uzsPerUsd;

  return {
    dutyUSD: Math.round(dutyUSD * 100) / 100,
    vatUSD: Math.round(vatUSD * 100) / 100,
    customsFeeUSD: Math.round(customsFeeUSD * 100) / 100,
    recyclingFeeUSD: Math.round(recyclingFeeUSD * 100) / 100,
    totalUSD: Math.round(totalUSD * 100) / 100,
    totalUZS: Math.round(totalUZS),
    priceUSD: Math.round(priceUSD * 100) / 100,
    carAgeYears: Math.floor(ageYears),
    isOverLimit: ageYears > 7,
  };
}
