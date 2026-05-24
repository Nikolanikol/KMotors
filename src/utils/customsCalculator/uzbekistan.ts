/**
 * Калькулятор таможенных платежей Узбекистан (УЗ) для физических лиц
 *
 * Нормативная база (2026 год):
 *  БРВ 2026:              412 000 сум (актуальная базовая расчётная величина)
 *
 *  Таможенный сбор:       прогрессивная шкала по ПКМ №700 (7 ступеней от 1 БРВ до 25 БРВ)
 *
 *  Пошлина:               15% от ТС + фиксированная доплата в USD/см³ по 5 скобкам
 *                          (с 01.01.2026 льгота для малолитражек отменена)
 *                          Электромобили: 0%
 *
 *  НДС:                   (ТС + Пошлина) × 12%
 *                          Утильсбор и сбор за оформление в базу НДС НЕ входят
 *
 *  Утилизационный сбор:   БРВ × коэффициент по объёму (30/120/180/240/300)
 *                          Электромобили: 0 сум
 *
 *  Акциз:                 0% (отменён для импортных легковых авто)
 *
 *  Доставка:              НЕ включена в расчёт (обсуждается отдельно)
 *
 *  Возраст:               >1 года — заградительные ставки, ввоз нецелесообразен
 *                          (расчёт выполняется, но UI выводит предупреждение)
 */

// БРВ (базовая расчётная величина) — 2026
const BRV = 412_000; // сум

export interface CustomsInputUZ {
  priceKRW: number;     // цена авто в вонах (KRW)
  yearMonth: string;    // "202301" — год и месяц выпуска
  engineVolume: number; // объём двигателя, см³
  fuelType?: string;    // тип топлива
  krwUsdRate: number;   // курс KRW→USD (USD за 1 KRW)
  uzsPerUsd: number;    // курс UZS/USD (сколько сум за 1 USD)
}

export interface CustomsResultUZ {
  priceUSD: number;          // цена авто в USD
  priceUZS: number;          // цена авто в сумах
  customsFeeUZS: number;     // таможенный сбор (прогрессивная шкала, БРВ)
  dutyUSD: number;           // пошлина в USD (15% + объём × $/см³)
  dutyUZS: number;           // пошлина в сумах
  vatUZS: number;            // НДС 12%
  recyclingFeeUZS: number;   // утилизационный сбор
  totalUZS: number;          // итого таможенных платежей в сумах
  totalUSD: number;          // итого в USD (для справки)
  carAgeYears: number;       // возраст авто (лет)
  isUsedCar: boolean;        // >1 года — нецелесообразно к ввозу
  isElectric: boolean;
}

/** Возраст авто в годах на текущую дату */
function getCarAgeYears(yearMonth: string): number {
  const year  = parseInt(yearMonth.slice(0, 4), 10);
  const month = parseInt(yearMonth.slice(4, 6), 10) - 1;
  const carDate = new Date(year, month, 1);
  const now = new Date();
  return (now.getTime() - carDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

function isElectricFuel(fuelType?: string): boolean {
  if (!fuelType) return false;
  const f = fuelType.toLowerCase();
  return f.includes("전기") || f.includes("electric") || f.includes("ev");
}

/**
 * Таможенный сбор за оформление ГТД — ПКМ №700
 * Прогрессивная шкала по таможенной стоимости в сумах
 */
function calcCustomsFee(tsUZS: number): number {
  if (tsUZS <= 10_000_000)    return 1  * BRV; //   412 000 сум
  if (tsUZS <= 30_000_000)    return 2  * BRV; //   824 000 сум
  if (tsUZS <= 100_000_000)   return 3  * BRV; // 1 236 000 сум
  if (tsUZS <= 300_000_000)   return 5  * BRV; // 2 060 000 сум
  if (tsUZS <= 1_000_000_000) return 9  * BRV; // 3 708 000 сум
  if (tsUZS <= 3_000_000_000) return 15 * BRV; // 6 180 000 сум
  return 25 * BRV;                              // 10 300 000 сум (потолок)
}

/**
 * Таможенная пошлина — 15% от ТС (USD) + фиксированная доплата в USD/см³
 * С 01.01.2026 льгота для малолитражек отменена — все скобки платят 15%
 * Электромобили: 0%
 */
function calcDuty(tsUSD: number, cc: number, isElectric: boolean): number {
  if (isElectric) return 0;

  const pctPart = tsUSD * 0.15;

  let ratePerCc: number;
  if      (cc <= 1_000) ratePerCc = 0.40;
  else if (cc <= 1_200) ratePerCc = 0.60;
  else if (cc <= 1_800) ratePerCc = 1.20;
  else                  ratePerCc = 1.25; // 1801+ и >3000 одинаковые

  return pctPart + cc * ratePerCc;
}

/**
 * Утилизационный сбор — привязан к БРВ по объёму двигателя
 * Электромобили: 0 сум
 */
function calcRecyclingFee(cc: number, isElectric: boolean): number {
  if (isElectric) return 0;

  let coeff: number;
  if      (cc <= 1_000) coeff = 30;
  else if (cc <= 2_000) coeff = 120;
  else if (cc <= 3_000) coeff = 180;
  else if (cc <= 3_500) coeff = 240;
  else                  coeff = 300;

  return coeff * BRV;
}

/** Главная функция расчёта */
export function calcCustomsUZ(input: CustomsInputUZ): CustomsResultUZ {
  const { priceKRW, yearMonth, engineVolume, fuelType, krwUsdRate, uzsPerUsd } = input;

  const ageYears = getCarAgeYears(yearMonth);
  const electric = isElectricFuel(fuelType);

  // 1. Таможенная стоимость (без доставки)
  const priceUSD = priceKRW * krwUsdRate;
  const priceUZS = priceUSD * uzsPerUsd;

  // 2. Таможенный сбор (прогрессивная шкала по TS в сумах)
  const customsFeeUZS = calcCustomsFee(priceUZS);

  // 3. Пошлина
  const dutyUSD = calcDuty(priceUSD, engineVolume, electric);
  const dutyUZS = dutyUSD * uzsPerUsd;

  // 4. НДС 12% — база: ТС + Пошлина (утильсбор и сбор за оформление НЕ входят)
  const vatUZS = Math.round((priceUZS + dutyUZS) * 0.12);

  // 5. Утилизационный сбор
  const recyclingFeeUZS = calcRecyclingFee(engineVolume, electric);

  // 6. Итого
  const totalUZS = Math.round(customsFeeUZS + dutyUZS + vatUZS + recyclingFeeUZS);
  const totalUSD = Math.round(totalUZS / uzsPerUsd);

  return {
    priceUSD:         Math.round(priceUSD),
    priceUZS:         Math.round(priceUZS),
    customsFeeUZS,
    dutyUSD:          Math.round(dutyUSD),
    dutyUZS:          Math.round(dutyUZS),
    vatUZS,
    recyclingFeeUZS,
    totalUZS,
    totalUSD,
    carAgeYears:      Math.floor(ageYears),
    isUsedCar:        ageYears > 1,
    isElectric:       electric,
  };
}
