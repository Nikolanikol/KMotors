/**
 * Ставки и коэффициенты России.
 *
 * Пошлина и таможенный сбор перенесены из `src/utils/customsCalculator/russia.ts`
 * при слиянии двух калькуляторов и СВЕРЕНЫ с эталоном 11.08.2026 (Дром,
 * калькулятор ввоза из Кореи, режим «для личного пользования»): 30 кейсов, все
 * ветки пошлины и все ступени сбора совпали до евро и до рубля.
 *
 * Таблица утилизационного сбора при той же сверке разошлась целиком и ПЕРЕПИСАНА
 * по снятой сетке (~130 замеров: объём × мощность × возраст × тип двигателя).
 * Прежние числа были ставками другой редакции: для объёма до 1000 см³ они ровно
 * в 1.2 раза ниже действующих, выше 2000 см³ — просто другие, а шкала по
 * мощности обрывалась на 280 л.с. там, где она продолжается до 490.
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
 * Льготный коэффициент утильсбора для физлица, ввозящего для личного
 * пользования: мощность до 160 л.с. ВКЛЮЧИТЕЛЬНО и объём до 3000 см³
 * включительно. Даёт 3 400 ₽ новым и 5 200 ₽ остальным.
 *
 * ⚠ Обе границы включающие, и это не мелочь: на 160 л.с. разница между льготой
 * и коммерческой шкалой — 5 200 ₽ против 1 492 800 ₽. Эталон (Дром) на этой
 * границе показывает коммерческую ставку, то есть трактует порог как «менее
 * 160»; расхождение известное, у нас оставлена трактовка «до 160 включительно».
 * По той же причине граничные точки шкалы ниже (190, 220, 250, …) у эталона
 * смещены на единицу — снимались они серединами бракетов, а не границами.
 */
export const RECYCLING_PRIVILEGED_HP_MAX = 160;
export const RECYCLING_PRIVILEGED_CC_MAX = 3_000;
export const RECYCLING_PRIVILEGED_NEW = 0.17;
export const RECYCLING_PRIVILEGED_USED = 0.26;

/**
 * Строка шкалы утильсбора: коэффициент для мощности ДО `maxHp` включительно.
 * `fresh` — моложе 3 лет, `aged` — от 3 лет. Возраст здесь бинарный: у эталона
 * «3–5» и «старше 5» дают одинаковый коэффициент, проверено на обеих ветках.
 */
export interface RecyclingRow {
  maxHp: number;
  fresh: number;
  aged: number;
}

/** До 1000 см³ включительно. Шкала короткая — всего три ступени. */
const RECYCLING_CC_1000: RecyclingRow[] = [
  { maxHp: 190, fresh: 15.36, aged: 28.44 },
  { maxHp: 220, fresh: 15.84, aged: 29.28 },
  { maxHp: Infinity, fresh: 17.28, aged: 30.12 },
];

/** 1001–2000 см³ — основной диапазон корейского каталога. */
const RECYCLING_CC_2000: RecyclingRow[] = [
  { maxHp: 190, fresh: 45.0, aged: 74.64 },
  { maxHp: 220, fresh: 47.64, aged: 79.2 },
  { maxHp: 250, fresh: 50.52, aged: 83.88 },
  { maxHp: 280, fresh: 57.12, aged: 91.92 },
  { maxHp: 310, fresh: 64.56, aged: 100.56 },
  { maxHp: 340, fresh: 72.96, aged: 110.16 },
  { maxHp: 370, fresh: 83.16, aged: 120.6 },
  { maxHp: 400, fresh: 94.8, aged: 132.0 },
  { maxHp: 430, fresh: 108.0, aged: 144.6 },
  { maxHp: 460, fresh: 123.24, aged: 158.4 },
  { maxHp: 490, fresh: 140.4, aged: 173.4 },
  { maxHp: Infinity, fresh: 160.08, aged: 189.84 },
];

/** 2001–3000 см³. */
const RECYCLING_CC_3000: RecyclingRow[] = [
  { maxHp: 190, fresh: 115.33, aged: 172.8 },
  { maxHp: 220, fresh: 118.2, aged: 175.08 },
  { maxHp: 250, fresh: 120.12, aged: 177.6 },
  { maxHp: 280, fresh: 126.0, aged: 183.0 },
  { maxHp: 310, fresh: 131.04, aged: 188.52 },
  { maxHp: 340, fresh: 136.32, aged: 193.68 },
  { maxHp: 370, fresh: 141.72, aged: 199.08 },
  { maxHp: 400, fresh: 147.48, aged: 204.72 },
  { maxHp: 430, fresh: 153.36, aged: 210.48 },
  // Выше 430 л.с. при таком объёме снят только возраст «от 3 лет» (228.6).
  // Для новых держим последний известный коэффициент — сочетание встречается
  // разве что у форсированных версий, и занижать здесь опаснее, чем повторить.
  { maxHp: Infinity, fresh: 153.36, aged: 228.6 },
];

/**
 * 3001–3500 см³. Льготы тут уже нет ни при какой мощности, поэтому шкала
 * начинается с бракета «до 160».
 */
const RECYCLING_CC_3500: RecyclingRow[] = [
  { maxHp: 160, fresh: 129.2, aged: 197.81 },
  { maxHp: 190, fresh: 131.76, aged: 200.04 },
  { maxHp: 220, fresh: 134.4, aged: 202.2 },
  { maxHp: 250, fresh: 137.16, aged: 204.36 },
  { maxHp: 280, fresh: 140.52, aged: 207.24 },
  { maxHp: 310, fresh: 144.0, aged: 212.4 },
  { maxHp: 340, fresh: 151.92, aged: 217.8 },
  { maxHp: 370, fresh: 160.32, aged: 224.28 },
  { maxHp: 400, fresh: 169.2, aged: 231.0 },
  { maxHp: Infinity, fresh: 178.44, aged: 237.96 },
];

/** Свыше 3500 см³ — Palisade 3.8, G80/G90 3.5T и прочие V6. */
const RECYCLING_CC_OVER: RecyclingRow[] = [
  { maxHp: 160, fresh: 164.53, aged: 216.29 },
  { maxHp: 190, fresh: 167.28, aged: 219.48 },
  { maxHp: 220, fresh: 170.16, aged: 222.84 },
  { maxHp: 250, fresh: 173.04, aged: 226.2 },
  { maxHp: 280, fresh: 176.52, aged: 231.36 },
  { maxHp: 310, fresh: 180.0, aged: 236.64 },
  { maxHp: 340, fresh: 186.36, aged: 249.6 },
  { maxHp: 370, fresh: 192.88, aged: 263.4 },
  { maxHp: 400, fresh: 199.68, aged: 277.92 },
  { maxHp: 430, fresh: 206.64, aged: 293.16 },
  { maxHp: Infinity, fresh: 206.64, aged: 309.36 },
];

/**
 * Электромобили. Своя шкала, и объём двигателя в ней не участвует вообще.
 *
 * ⚠ Льгота физлица к электромобилям НЕ применяется ни при какой мощности:
 * машина на 150 л.с. платит 2 227 200 ₽, а не 5 200 ₽. И возраст здесь влияет
 * так же, как у ДВС, — прежнее ядро этого не учитывало и считало новый
 * электромобиль по ставке подержанного.
 */
const RECYCLING_ELECTRIC: RecyclingRow[] = [
  { maxHp: 100, fresh: 49.56, aged: 82.08 },
  { maxHp: 130, fresh: 65.88, aged: 95.64 },
  { maxHp: 160, fresh: 78.0, aged: 111.36 },
  { maxHp: 190, fresh: 92.4, aged: 129.72 },
  { maxHp: 220, fresh: 109.68, aged: 151.2 },
  { maxHp: 250, fresh: 129.96, aged: 176.16 },
  { maxHp: 280, fresh: 153.96, aged: 205.2 },
  { maxHp: Infinity, fresh: 182.4, aged: 239.04 },
];

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
  /** Мощность не задана — коэффициент взят по нижней ступени шкалы. */
  isApprox: boolean;
}

function recyclingTable(volumeCc: number, isElectric: boolean): RecyclingRow[] {
  if (isElectric) return RECYCLING_ELECTRIC;
  if (volumeCc <= 1_000) return RECYCLING_CC_1000;
  if (volumeCc <= 2_000) return RECYCLING_CC_2000;
  if (volumeCc <= 3_000) return RECYCLING_CC_3000;
  if (volumeCc <= 3_500) return RECYCLING_CC_3500;
  return RECYCLING_CC_OVER;
}

/**
 * Коэффициент утилизационного сбора.
 *
 * Без мощности точного ответа нет: у одного и того же объёма льготная и
 * коммерческая ставки различаются в сотни раз. Берём минимально возможную для
 * этого объёма (льготу, а выше 3000 см³ — нижнюю ступень шкалы) и помечаем
 * прикидкой — интерфейс показывает при этом флаг с просьбой вписать л.с.
 */
export function recyclingCoeff(
  volumeCc: number,
  horsePower: number | undefined,
  isNew: boolean,
  isElectric: boolean,
): RecyclingCoeff {
  const table = recyclingTable(volumeCc, isElectric);
  const privileged =
    !isElectric &&
    volumeCc <= RECYCLING_PRIVILEGED_CC_MAX &&
    (horsePower ?? 0) <= RECYCLING_PRIVILEGED_HP_MAX;

  if (!horsePower) {
    if (privileged) {
      return {
        coeff: isNew ? RECYCLING_PRIVILEGED_NEW : RECYCLING_PRIVILEGED_USED,
        isApprox: true,
      };
    }
    const row = table[0];
    return { coeff: isNew ? row.fresh : row.aged, isApprox: true };
  }

  if (privileged) {
    return {
      coeff: isNew ? RECYCLING_PRIVILEGED_NEW : RECYCLING_PRIVILEGED_USED,
      isApprox: false,
    };
  }

  const row =
    table.find((r) => horsePower <= r.maxHp) ?? table[table.length - 1];
  return { coeff: isNew ? row.fresh : row.aged, isApprox: false };
}
