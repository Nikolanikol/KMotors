/**
 * Калькулятор таможенных пошлин РФ для физических лиц (ЕАЭС)
 * Источник: Решение Совета ЕЭК №107 от 20.12.2017
 * Ставки утилизационного сбора: Постановление Правительства РФ (актуальные на 2025 год)
 * Таможенные сборы: с 01.01.2025
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
  // Электромобили — нулевая ставка пошлины до конца 2025 (временная льгота)
  if (isElectric) return 0;

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

/** Таможенный сбор (зависит от стоимости авто в рублях, актуально с 01.01.2025) */
function calcCustomsFee(priceRUB: number): number {
  if (priceRUB <= 200_000)   return 1_067;
  if (priceRUB <= 450_000)   return 2_134;
  if (priceRUB <= 1_200_000) return 4_269;
  if (priceRUB <= 2_700_000) return 11_746;
  if (priceRUB <= 4_200_000) return 16_524;
  if (priceRUB <= 5_500_000) return 21_344;
  if (priceRUB <= 7_000_000) return 27_540;
  return 30_000;
}

/**
 * Утилизационный сбор для физлиц (2025)
 * Базовая ставка 20 000 руб × коэффициент (по объёму и мощности двигателя)
 *
 * Если л.с. не введено — используется усреднённый коэфф. по объёму (без точной мощности).
 * Возвращает { fee, isApprox }
 */
function calcRecyclingFee(
  cc: number,
  hp: number | undefined,
  ageYears: number,
  isElectric: boolean
): { fee: number; isApprox: boolean } {
  const base = 20_000;
  const isNew = ageYears < 3;

  // EV — льготный коэфф.
  if (isElectric) {
    return { fee: base * (isNew ? 0.17 : 0.26), isApprox: false };
  }

  // Если л.с. не введено — усреднённый расчёт только по объёму
  if (!hp) {
    let coeff: number;
    if (cc <= 1_000)      coeff = isNew ? 0.17   : 0.26;
    else if (cc <= 2_000) coeff = isNew ? 118.2  : 137.89;
    else if (cc <= 3_000) coeff = isNew ? 126    : 150.54;
    else if (cc <= 3_500) coeff = isNew ? 178.22 : 213.15;
    else                  coeff = isNew ? 291.72 : 359.36;
    return { fee: base * coeff, isApprox: true };
  }

  // Точный расчёт по объёму + мощности (л.с.)
  let coeff: number;

  if (cc <= 1_000) {
    // До 1000 куб.см — всегда льготный коэфф.
    coeff = isNew ? 0.17 : 0.26;
  } else if (cc <= 3_000) {
    // 1001–3000 куб.см (таблица одинакова для 1001–2000 и 2001–3000)
    if      (hp <= 160) coeff = isNew ? 0.17    : 0.26;
    else if (hp <= 190) coeff = isNew ? 115.34  : 138.4;
    else if (hp <= 220) coeff = isNew ? 118.2   : 141.78;
    else if (hp <= 250) coeff = isNew ? 120.12  : 144.14;
    else if (hp <= 280) coeff = isNew ? 126     : 151.2;
    else if (hp <= 310) coeff = isNew ? 131.04  : 157.24;
    else                coeff = isNew ? 162.2   : 194.64;
  } else if (cc <= 3_500) {
    // 3001–3500 куб.см
    if      (hp <= 160) coeff = isNew ? 0.17    : 0.26;
    else if (hp <= 310) coeff = isNew ? 178.22  : 213.15;
    else                coeff = isNew ? 291.72  : 349.28;
  } else {
    // Свыше 3500 куб.см
    if      (hp <= 160) coeff = isNew ? 0.17    : 0.26;
    else if (hp <= 310) coeff = isNew ? 291.72  : 349.28;
    else                coeff = isNew ? 420.48  : 504.6;
  }

  return { fee: base * coeff, isApprox: false };
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
