/**
 * Ставки Узбекистана. Перенесены один в один из
 * `src/utils/customsCalculator/uzbekistan.ts` при слиянии калькуляторов;
 * числа не пересматривались — сверка с эталоном отдельная задача.
 *
 * Основания из исходного файла: БРВ 2026, таможенный сбор по ПКМ №700,
 * пошлина 15% плюс доплата в USD за 1 см³ (льгота малолитражкам отменена
 * с 01.01.2026), НДС 12%, акциз для импортных легковых отменён.
 */

/** Базовая расчётная величина, 2026. */
export const BRV_UZS = 412_000;

export const DUTY_RATE = 0.15;
export const VAT_RATE = 0.12;

/** Возраст в годах, свыше которого ввоз считается нецелесообразным. */
export const AGE_USED_ABOVE_YEARS = 1;

/** Таможенный сбор — ступени по стоимости в сумах, в единицах БРВ. */
export const CUSTOMS_FEE_STEPS = [
  { maxUzs: 10_000_000, brv: 1 },
  { maxUzs: 30_000_000, brv: 2 },
  { maxUzs: 100_000_000, brv: 3 },
  { maxUzs: 300_000_000, brv: 5 },
  { maxUzs: 1_000_000_000, brv: 9 },
  { maxUzs: 3_000_000_000, brv: 15 },
  { maxUzs: Infinity, brv: 25 },
] as const;

/** Доплата к пошлине, USD за 1 см³. */
export const DUTY_USD_PER_CC = [
  { maxCc: 1_000, perCc: 0.4 },
  { maxCc: 1_200, perCc: 0.6 },
  { maxCc: 1_800, perCc: 1.2 },
  { maxCc: Infinity, perCc: 1.25 },
] as const;

/** Утилизационный сбор — коэффициент к БРВ по объёму. */
export const RECYCLING_COEFFS = [
  { maxCc: 1_000, coeff: 30 },
  { maxCc: 2_000, coeff: 120 },
  { maxCc: 3_000, coeff: 180 },
  { maxCc: 3_500, coeff: 240 },
  { maxCc: Infinity, coeff: 300 },
] as const;

export function customsFeeBrv(priceUzs: number): number {
  return (
    CUSTOMS_FEE_STEPS.find((step) => priceUzs <= step.maxUzs) ??
    CUSTOMS_FEE_STEPS[CUSTOMS_FEE_STEPS.length - 1]
  ).brv;
}

export function dutyUsdPerCc(volumeCc: number): number {
  return (
    DUTY_USD_PER_CC.find((row) => volumeCc <= row.maxCc) ??
    DUTY_USD_PER_CC[DUTY_USD_PER_CC.length - 1]
  ).perCc;
}

export function recyclingCoeff(volumeCc: number): number {
  return (
    RECYCLING_COEFFS.find((row) => volumeCc <= row.maxCc) ??
    RECYCLING_COEFFS[RECYCLING_COEFFS.length - 1]
  ).coeff;
}
