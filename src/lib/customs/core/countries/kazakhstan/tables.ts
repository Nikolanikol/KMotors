/**
 * Ставки Казахстана. Перенесены один в один из
 * `src/utils/customsCalculator/kazakhstan.ts` при слиянии калькуляторов;
 * числа не пересматривались — сверка с эталоном отдельная задача.
 *
 * Основания из исходного файла: МРП 2026 по Закону о бюджете РК,
 * пошлина ЕТТ ЕАЭС, акциз по ст. 537 нового НК РК, НДС 16% с 01.01.2026.
 */

/** Месячный расчётный показатель, 2026. Всё привязано к нему. */
export const MRP_KZT = 4_325;

/** Таможенный сбор — 6 МРП. */
export const CUSTOMS_FEE_MRP = 6;

/** Утилизационный сбор — 50 МРП × коэффициент по объёму. */
export const RECYCLING_BASE_MRP = 50;

/** Порог акциза на роскошь — 18 000 МРП от таможенной стоимости. */
export const LUXURY_THRESHOLD_MRP = 18_000;
export const LUXURY_RATE = 0.1;

export const DUTY_RATE = 0.15;
export const VAT_RATE = 0.16;

/** Объём, свыше которого начисляется акциз, и ставка за 1 см³. */
export const EXCISE_VOLUME_ABOVE_CC = 3_000;
export const EXCISE_KZT_PER_CC = 100;

/** Возраст в месяцах, свыше которого включается минимум по объёму. */
export const AGE_OLD_ABOVE_MONTHS = 84;

/** Границы регистрационного сбора, в полных месяцах. */
export const REGISTRATION_STEPS = [
  { maxMonths: 24, mrp: 0.25 },
  { maxMonths: 36, mrp: 50 },
  { maxMonths: Infinity, mrp: 500 },
] as const;

/** Оценка сопутствующих расходов: СБКТС, ЭВАК, брокер, СВХ. */
export const ADDITIONAL_KZT = 400_000;

/** Минимальная ставка пошлины €/см³ для авто старше 7 лет. */
export function minDutyEurPerCc(volumeCc: number): number {
  if (volumeCc <= 1_800) return 0.45;
  if (volumeCc <= 3_000) return 0.55;
  return 0.6;
}

/** Коэффициент утилизационного сбора по объёму. */
export function recyclingCoeff(volumeCc: number): number {
  if (volumeCc <= 1_000) return 1.5;
  if (volumeCc <= 2_000) return 3.5;
  if (volumeCc <= 3_000) return 5.0;
  return 11.5;
}

export function registrationMrp(ageMonths: number): number {
  return (
    REGISTRATION_STEPS.find((step) => ageMonths <= step.maxMonths) ??
    REGISTRATION_STEPS[REGISTRATION_STEPS.length - 1]
  ).mrp;
}
