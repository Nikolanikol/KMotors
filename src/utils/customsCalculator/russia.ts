/**
 * Калькулятор таможенных пошлин РФ для физических лиц (ЕАЭС)
 *
 * Таможенная пошлина:   Решение Совета ЕЭК №107 от 20.12.2017
 * Таможенный сбор:      актуальные ставки с 01.01.2026
 * Утилизационный сбор: Постановление Правительства РФ №1713 от 01.11.2025
 *                       (вступило в силу 01.12.2025, расчёт по объёму + мощности)
 *                       Льготная ставка 0.17/0.26 → 3400/5200 руб: hp ≤ 160 + cc < 3000
 *                       Зафиксирована до 2030 г., не индексируется (индексация — только коммерч. ставки)
 * Электромобили:        льгота 0% истекла 31.12.2023, применяется 15% адвалорная
 */

export interface CustomsInputRU {
  priceKRW: number;       // цена авто в вонах (KRW)
  yearMonth: string;      // "202301" — год и месяц выпуска
  engineVolume: number;   // объём двигателя, куб.см
  horsePower?: number;    // мощность двигателя, л.с. — вводится пользователем вручную (опционально)
  fuelType?: string;      // тип топлива (для электро — нет пошлины за объём)
  eurRate: number;        // курс EUR/RUB (актуальный с ЦБ)
  krwRate: number;        // курс KRW/RUB (актуальный с ЦБ)
}

export interface CustomsResultRU {
  dutyRUB: number;          // таможенная пошлина, руб
  customsFeeRUB: number;    // таможенный сбор, руб
  recyclingFeeRUB: number;  // утилизационный сбор, руб
  totalRUB: number;         // итого под ключ, руб
  carAgeYears: number;      // возраст авто (лет)
  priceEUR: number;         // цена авто в EUR
  priceRUB: number;         // цена авто в рублях
  recyclingIsApprox: boolean; // true — утильсбор приближённый (л.с. не введено)
}

/** Возраст авто в годах на текущую дату */
function getCarAgeYears(yearMonth: string): number {
  const year = parseInt(yearMonth.slice(0, 4), 10);
  const month = parseInt(yearMonth.slice(4, 6), 10) - 1;
  const carDate = new Date(year, month, 1);
  const now = new Date();
  const diffMs = now.getTime() - carDate.getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 365.25);
}

/** Таможенная пошлина (ЕАЭС, физлица, Решение ЕЭК №107) */
function calcDuty(
  priceEUR: number,
  engineVolume: number,
  ageYears: number,
  isElectric: boolean,
  eurRate: number
): number {
  // Электромобили — временная льгота 0% истекла 31.12.2023, теперь 15% адвалорная
  if (isElectric) return priceEUR * 0.15 * eurRate;

  const cc = engineVolume;

  if (ageYears < 3) {
    // Новые (<3 лет): зависит от стоимости в EUR — max(адвалорная%, специфическая €/куб.см)
    const brackets = [
      { maxEUR: 8_500,    pct: 0.54, perCc: 2.5  },
      { maxEUR: 16_700,   pct: 0.48, perCc: 3.5  },
      { maxEUR: 42_300,   pct: 0.48, perCc: 5.5  },
      { maxEUR: 84_500,   pct: 0.48, perCc: 7.5  },
      { maxEUR: 169_000,  pct: 0.48, perCc: 15.0 },
      { maxEUR: Infinity, pct: 0.48, perCc: 20.0 },
    ];
    const bracket = brackets.find((b) => priceEUR <= b.maxEUR)!;
    const dutyEUR = Math.max(priceEUR * bracket.pct, cc * bracket.perCc);
    return dutyEUR * eurRate;
  }

  if (ageYears < 5) {
    // 3–5 лет: фикс. ставка €/куб.см
    let ratePerCc: number;
    if (cc <= 1000) ratePerCc = 1.5;
    else if (cc <= 1500) ratePerCc = 1.7;
    else if (cc <= 1800) ratePerCc = 2.5;
    else if (cc <= 2300) ratePerCc = 2.7;
    else if (cc <= 3000) ratePerCc = 3.0;
    else ratePerCc = 3.6;

    return cc * ratePerCc * eurRate;
  }

  // Старше 5 лет: фикс. ставка €/куб.см
  let ratePerCc: number;
  if (cc <= 1000) ratePerCc = 3.0;
  else if (cc <= 1500) ratePerCc = 3.2;
  else if (cc <= 1800) ratePerCc = 3.5;
  else if (cc <= 2300) ratePerCc = 4.8;
  else if (cc <= 3000) ratePerCc = 5.0;
  else ratePerCc = 5.7;

  return cc * ratePerCc * eurRate;
}

/** Таможенный сбор (зависит от стоимости авто в рублях, ставки с 01.01.2026) */
function calcCustomsFee(priceRUB: number): number {
  if (priceRUB <= 200_000)    return 1_231;
  if (priceRUB <= 450_000)    return 2_462;
  if (priceRUB <= 1_200_000)  return 4_924;
  if (priceRUB <= 2_700_000)  return 13_541;
  if (priceRUB <= 4_200_000)  return 18_465;
  if (priceRUB <= 5_500_000)  return 21_344;
  if (priceRUB <= 10_000_000) return 49_240;
  return 73_860;
}

/**
 * Утилизационный сбор для физлиц
 * Постановление №1713 от 01.11.2025, вступило в силу 01.12.2025
 * Базовая ставка 20 000 руб × коэффициент
 *
 * Льготная ставка (0.17 / 0.26) применяется ТОЛЬКО если:
 *   hp ≤ 160 И cc ≤ 3000 (физлицо, личное пользование, 1 авто/год)
 * Для cc > 3000 — льготной ставки нет.
 * Значения для cc > 3000 — приближённые (⚠).
 */
/**
 * Утилизационный сбор для физлиц (актуальные коэффициенты с 01.01.2026)
 * Постановление №1713 от 01.11.2025
 * Базовая ставка 20 000 руб × коэффициент
 */
function calcRecyclingFee(
  cc: number,
  hp: number | undefined,
  ageYears: number,
  isElectric: boolean
): { fee: number; isApprox: boolean } {
  const base = 20_000;
  const isNew = ageYears < 3;

  // Электромобили — новые коэффициенты 2026 (было: единый 33.37)
  if (isElectric) {
    if (!hp) return { fee: base * 65.88, isApprox: true }; // приближённо для электромобилей
    // Коэффициенты для EV в зависимости от мощности (кВт → л.с. примерно 1.36)
    const hpFromKw = hp; // предполагаем что hp уже переведён
    if (hpFromKw <= 109) return { fee: base * 65.88, isApprox: false };      // до 80 кВт
    if (hpFromKw <= 205) return { fee: base * 98.56, isApprox: false };      // 80-150 кВт  
    return { fee: base * 182.4, isApprox: false };                           // >205 кВт
  }

  // Без мощности — примерный расчёт по объёму
  if (!hp) {
    let coeff: number;
    if (cc <= 2_000)       coeff = isNew ? 40.04  : 59.18;    // предполагаем hp ≤ 160
    else if (cc <= 3_000)  coeff = isNew ? 105.0   : 145.0;   // для мощных авто
    else if (cc <= 3_500)  coeff = isNew ? 155.0   : 220.0;   // ⚠ приближённо
    else                   coeff = isNew ? 240.0   : 320.0;   // ⚠ приближённо
    return { fee: base * coeff, isApprox: true };
  }

  // Точный расчёт по объёму + мощности (актуальные коэффициенты 2026)
  let coeff: number = 0;
  let isApprox = false;

  if (cc <= 1_000) {
    if (hp <= 160) coeff = isNew ? 0.17 : 0.26;
    else if (hp <= 190) coeff = isNew ? 12.8 : 23.7;
    else if (hp <= 220) coeff = isNew ? 13.2 : 24.4;
    else coeff = isNew ? 14.4 : 25.1;

  } else if (cc <= 2_000) {
    // 1001–2000 куб.см
    if (hp <= 160) coeff = isNew ? 0.17 : 0.26;        // льготная ставка: hp ≤ 160 + cc < 3000 → 3 400 / 5 200 руб (зафиксировано до 2030)
    else if (hp <= 190) coeff = isNew ? 45.0  : 74.64;
    else if (hp <= 220) coeff = isNew ? 47.64 : 79.2;
    else if (hp <= 250) coeff = isNew ? 50.52 : 83.88;
    else if (hp <= 280) coeff = isNew ? 57.12 : 91.92;
    else coeff = isNew ? 72.96 : 110.16;

  } else if (cc <= 3_000) {
    // 2001–3000 куб.см
    if (hp <= 160) coeff = isNew ? 0.17 : 0.26;        // льготная ставка: hp ≤ 160 + cc < 3000 → 3 400 / 5 200 руб (зафиксировано до 2030)
    else if (hp <= 190) coeff = isNew ? 95.0  : 125.0;
    else if (hp <= 220) coeff = isNew ? 105.0 : 145.0; // было 118.2
    else if (hp <= 250) coeff = isNew ? 115.0 : 160.0; // было 120.12
    else coeff = isNew ? 145.0 : 210.0;                // было 162.2

  } else if (cc <= 3_500) {
    isApprox = true;
    if (hp <= 160) coeff = isNew ? 95.0 : 145.0;
    else if (hp <= 250) coeff = isNew ? 155.0 : 220.0;
    else coeff = isNew ? 240.0 : 320.0;

  } else {
    isApprox = true;
    if (hp <= 160) coeff = isNew ? 140.0 : 210.0;
    else if (hp <= 310) coeff = isNew ? 240.0 : 340.0;
    else coeff = isNew ? 380.0 : 480.0;
  }

  return { fee: base * coeff, isApprox };
}
/** Главная функция расчёта */
export function calcCustomsRU(input: CustomsInputRU): CustomsResultRU {
  const { priceKRW, yearMonth, engineVolume, horsePower, fuelType, eurRate, krwRate } = input;

  const ageYears = getCarAgeYears(yearMonth);
  const isElectric = !!(fuelType && (
    fuelType.includes("전기") ||
    fuelType.toLowerCase().includes("electric") ||
    fuelType.toLowerCase().includes("ev")
  ));

  const priceRUB = priceKRW * krwRate;
  const priceEUR = priceRUB / eurRate;

  const dutyRUB = calcDuty(priceEUR, engineVolume, ageYears, isElectric, eurRate);
  const customsFeeRUB = calcCustomsFee(priceRUB);
  const { fee: recyclingFeeRUB, isApprox: recyclingIsApprox } = calcRecyclingFee(
    engineVolume,
    horsePower,
    ageYears,
    isElectric
  );

  const totalRUB = dutyRUB + customsFeeRUB + recyclingFeeRUB;

  return {
    dutyRUB: Math.round(dutyRUB),
    customsFeeRUB,
    recyclingFeeRUB: Math.round(recyclingFeeRUB),
    totalRUB: Math.round(totalRUB),
    carAgeYears: Math.floor(ageYears),
    priceEUR: Math.round(priceEUR),
    priceRUB: Math.round(priceRUB),
    recyclingIsApprox,
  };
}
