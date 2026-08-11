/**
 * Ставки Казахстана. Пришли из `src/utils/customsCalculator/kazakhstan.ts` при
 * слиянии калькуляторов, сверка идёт по опубликованным ставкам (КГД МФ РК,
 * новый НК РК), а не по чужому калькулятору — см. CLAUDE.md.
 *
 * Сверено 11.08.2026: МРП, таможенный сбор, пошлина до 7 лет, НДС, акциз по
 * объёму, спецакциз, утилизационный сбор, ставки регистрации, минимумы €/см³.
 * Ещё открыты: возрастная шкала регистрации для электромобилей, гибриды,
 * состав базы НДС. Список — docs/open-questions.md.
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

/**
 * Ступени сбора за первичную регистрацию, ст. 830 НК РК (в силе с 01.01.2026).
 *
 * ⚠️ Возраст здесь — РАЗНИЦА КАЛЕНДАРНЫХ ГОДОВ, а не полные месяцы. Закон
 * говорит «включая год выпуска», и в 2026 году это даёт: 2026 и 2025 → 0,25 МРП,
 * 2024 → 50 МРП, 2023 и старше → 500 МРП. То есть номер бракета в законе равен
 * `currentYear − year`. Месяц выпуска на эту строку не влияет ВООБЩЕ.
 *
 * Ставки перечислены для категории М1 «за исключением ТС с электродвигателями»:
 * у электромобилей своя шкала, вдесятеро меньшая на двух старших ступенях.
 * Возрастные границы у обеих шкал ОДНИ И ТЕ ЖЕ.
 */
export const REGISTRATION_STEPS = [
  { maxAgeYears: 1, mrp: 0.25 }, // «до 2 лет, включая год выпуска»
  { maxAgeYears: 2, mrp: 50 }, // «от 2 до 3 лет, включая год выпуска»
  { maxAgeYears: Infinity, mrp: 500 }, // «от 3 лет и выше, включая год выпуска»
] as const;

/** Та же шкала для М1 с электродвигателем. Применяется и к EREV. */
export const REGISTRATION_STEPS_ELECTRIC = [
  { maxAgeYears: 1, mrp: 0.25 },
  { maxAgeYears: 2, mrp: 25 },
  { maxAgeYears: Infinity, mrp: 250 },
] as const;

/**
 * Госпошлины, которые платятся в ЦОН помимо самого сбора за первичную
 * регистрацию: номерные знаки и свидетельство о регистрации. Ставки
 * фиксированные и от возраста, объёма и типа двигателя не зависят.
 */
export const PLATES_MRP = 2.8;
export const CERTIFICATE_MRP = 1.25;

/** Оценка сопутствующих расходов: СБКТС, ЭВАК, брокер, СВХ. */
export const ADDITIONAL_KZT = 400_000;

/**
 * Минимальная ставка пошлины €/см³ для авто старше 7 лет — национальный тариф РК
 * по обязательствам ВТО, позиция 8703. Пошлина считается «по принципу что
 * больше»: адвалорные 15% против этой ставки за см³.
 *
 * Границы объёма — как в ТН ВЭД: верхняя граница входит в бракет.
 */
export const MIN_DUTY_STEPS = [
  { maxVolumeCc: 1_000, eurPerCc: 0.36, tnved: "8703 21 909 3" },
  { maxVolumeCc: 1_500, eurPerCc: 0.4, tnved: "8703 22 909 3" },
  { maxVolumeCc: 3_000, eurPerCc: 0.6, tnved: "8703 23 908 1" },
  { maxVolumeCc: Infinity, eurPerCc: 0.6, tnved: "8703 24 909 1" },
] as const;

export function minDutyEurPerCc(volumeCc: number): number {
  return (
    MIN_DUTY_STEPS.find((step) => volumeCc <= step.maxVolumeCc) ??
    MIN_DUTY_STEPS[MIN_DUTY_STEPS.length - 1]
  ).eurPerCc;
}

/** Коэффициент утилизационного сбора по объёму. */
export function recyclingCoeff(volumeCc: number): number {
  if (volumeCc <= 1_000) return 1.5;
  if (volumeCc <= 2_000) return 3.5;
  if (volumeCc <= 3_000) return 5.0;
  return 11.5;
}

export function registrationMrp(
  ageYears: number,
  scale: "ice" | "electric" = "ice",
): number {
  const steps =
    scale === "electric" ? REGISTRATION_STEPS_ELECTRIC : REGISTRATION_STEPS;
  return (
    steps.find((step) => ageYears <= step.maxAgeYears) ?? steps[steps.length - 1]
  ).mrp;
}
