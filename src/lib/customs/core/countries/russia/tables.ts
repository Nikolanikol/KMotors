/**
 * Ставки и коэффициенты России.
 *
 * Перенесены один в один из `src/utils/customsCalculator/russia.ts` при
 * слиянии двух калькуляторов. Числа НЕ пересматривались: сверка с эталоном —
 * отдельная задача, до неё ядро обязано воспроизводить прежнее поведение.
 *
 * Основания, как они были указаны в исходном файле:
 *   пошлина — Решение Совета ЕЭК №107 от 20.12.2017
 *   таможенный сбор — ставки с 01.01.2026
 *   утилизационный сбор — Постановление Правительства РФ №1713 от 01.11.2025
 *   электромобили — льгота 0% истекла 31.12.2023, применяется 15% адвалорная
 */

/** Возрастные пороги пошлины, в годах. */
export const AGE_NEW_BELOW = 3;
export const AGE_MID_BELOW = 5;

/** Адвалорная ставка для электромобилей. */
export const ELECTRIC_DUTY_RATE = 0.15;

/** Новые (до 3 лет): бракет по стоимости в евро, max(процент, €/см³). */
export const NEW_BRACKETS = [
  { maxEur: 8_500, pct: 0.54, perCc: 2.5 },
  { maxEur: 16_700, pct: 0.48, perCc: 3.5 },
  { maxEur: 42_300, pct: 0.48, perCc: 5.5 },
  { maxEur: 84_500, pct: 0.48, perCc: 7.5 },
  { maxEur: 169_000, pct: 0.48, perCc: 15.0 },
  { maxEur: Infinity, pct: 0.48, perCc: 20.0 },
] as const;

/** 3–5 лет: фиксированная ставка €/см³ по объёму. */
export const MID_RATES = [
  { maxCc: 1_000, perCc: 1.5 },
  { maxCc: 1_500, perCc: 1.7 },
  { maxCc: 1_800, perCc: 2.5 },
  { maxCc: 2_300, perCc: 2.7 },
  { maxCc: 3_000, perCc: 3.0 },
  { maxCc: Infinity, perCc: 3.6 },
] as const;

/** Старше 5 лет: фиксированная ставка €/см³ по объёму. */
export const OLD_RATES = [
  { maxCc: 1_000, perCc: 3.0 },
  { maxCc: 1_500, perCc: 3.2 },
  { maxCc: 1_800, perCc: 3.5 },
  { maxCc: 2_300, perCc: 4.8 },
  { maxCc: 3_000, perCc: 5.0 },
  { maxCc: Infinity, perCc: 5.7 },
] as const;

/** Таможенный сбор — ступени по стоимости в рублях. */
export const CUSTOMS_FEE_STEPS = [
  { maxRub: 200_000, fee: 1_231 },
  { maxRub: 450_000, fee: 2_462 },
  { maxRub: 1_200_000, fee: 4_924 },
  { maxRub: 2_700_000, fee: 13_541 },
  { maxRub: 4_200_000, fee: 18_465 },
  { maxRub: 5_500_000, fee: 21_344 },
  { maxRub: 10_000_000, fee: 49_240 },
  { maxRub: Infinity, fee: 73_860 },
] as const;

/** Базовая ставка утилизационного сбора. */
export const RECYCLING_BASE_RUB = 20_000;

/**
 * Льготный коэффициент утильсбора для физлица: мощность до 160 л.с.
 * и объём до 3000 см³. Даёт 3 400 ₽ новым и 5 200 ₽ остальным.
 */
export const RECYCLING_PRIVILEGED_HP_MAX = 160;
export const RECYCLING_PRIVILEGED_CC_MAX = 3_000;

export function dutyRateByAge(ageYears: number, volumeCc: number): number {
  const table = ageYears < AGE_MID_BELOW ? MID_RATES : OLD_RATES;
  return (table.find((row) => volumeCc <= row.maxCc) ?? table[table.length - 1])
    .perCc;
}

export function customsFeeRub(priceRub: number): number {
  return (
    CUSTOMS_FEE_STEPS.find((step) => priceRub <= step.maxRub) ??
    CUSTOMS_FEE_STEPS[CUSTOMS_FEE_STEPS.length - 1]
  ).fee;
}

export interface RecyclingCoeff {
  coeff: number;
  /** Коэффициент взят из приближённой части таблицы. */
  isApprox: boolean;
}

/**
 * Коэффициент утилизационного сбора.
 *
 * Ветки с пометкой `isApprox` были помечены «⚠ приближённо» ещё в исходном
 * файле — это признание автора, а не наша оценка. Сохранено дословно.
 */
export function recyclingCoeff(
  volumeCc: number,
  horsePower: number | undefined,
  isNew: boolean,
  isElectric: boolean,
): RecyclingCoeff {
  if (isElectric) {
    if (!horsePower) return { coeff: 65.88, isApprox: true };
    if (horsePower <= 109) return { coeff: 65.88, isApprox: false };
    if (horsePower <= 205) return { coeff: 98.56, isApprox: false };
    return { coeff: 182.4, isApprox: false };
  }

  // Мощность не указана — прикидка по одному объёму.
  if (!horsePower) {
    if (volumeCc <= 2_000) return { coeff: isNew ? 40.04 : 59.18, isApprox: true };
    if (volumeCc <= 3_000) return { coeff: isNew ? 105.0 : 145.0, isApprox: true };
    if (volumeCc <= 3_500) return { coeff: isNew ? 155.0 : 220.0, isApprox: true };
    return { coeff: isNew ? 240.0 : 320.0, isApprox: true };
  }

  const privileged =
    horsePower <= RECYCLING_PRIVILEGED_HP_MAX &&
    volumeCc <= RECYCLING_PRIVILEGED_CC_MAX;
  if (privileged) return { coeff: isNew ? 0.17 : 0.26, isApprox: false };

  if (volumeCc <= 1_000) {
    if (horsePower <= 190) return { coeff: isNew ? 12.8 : 23.7, isApprox: false };
    if (horsePower <= 220) return { coeff: isNew ? 13.2 : 24.4, isApprox: false };
    return { coeff: isNew ? 14.4 : 25.1, isApprox: false };
  }

  if (volumeCc <= 2_000) {
    if (horsePower <= 190) return { coeff: isNew ? 45.0 : 74.64, isApprox: false };
    if (horsePower <= 220) return { coeff: isNew ? 47.64 : 79.2, isApprox: false };
    if (horsePower <= 250) return { coeff: isNew ? 50.52 : 83.88, isApprox: false };
    if (horsePower <= 280) return { coeff: isNew ? 57.12 : 91.92, isApprox: false };
    return { coeff: isNew ? 72.96 : 110.16, isApprox: false };
  }

  if (volumeCc <= 3_000) {
    if (horsePower <= 190) return { coeff: isNew ? 95.0 : 125.0, isApprox: false };
    if (horsePower <= 220) return { coeff: isNew ? 105.0 : 145.0, isApprox: false };
    if (horsePower <= 250) return { coeff: isNew ? 115.0 : 160.0, isApprox: false };
    return { coeff: isNew ? 145.0 : 210.0, isApprox: false };
  }

  if (volumeCc <= 3_500) {
    if (horsePower <= 160) return { coeff: isNew ? 95.0 : 145.0, isApprox: true };
    if (horsePower <= 250) return { coeff: isNew ? 155.0 : 220.0, isApprox: true };
    return { coeff: isNew ? 240.0 : 320.0, isApprox: true };
  }

  if (horsePower <= 160) return { coeff: isNew ? 140.0 : 210.0, isApprox: true };
  if (horsePower <= 310) return { coeff: isNew ? 240.0 : 340.0, isApprox: true };
  return { coeff: isNew ? 380.0 : 480.0, isApprox: true };
}
