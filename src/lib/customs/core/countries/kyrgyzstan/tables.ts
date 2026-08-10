/**
 * Ставки для Кыргызстана.
 *
 * Источник эталона — официальный калькулятор ГТС при Кабмине КР,
 * https://www.customs.gov.kg/site/ru/master/customskg/kalkuljator-ats, прогон 09.08.2026.
 * Разбивка кейсов лежит в tests/customs/golden/kyrgyzstan.golden.json.
 *
 * Считает КР в евро: и таблица ЕЭК №107 для физлиц, и специфические ставки ЕТТ
 * задаются в евро за 1 см³. Сомы появляются только в конце, пересчётом по курсу
 * НБКР. Эталон устроен ровно так же — проверено сверкой колонок KGS и EUR.
 *
 * ⚠ Таблицы не шарятся с Арменией, хотя ЕЭК №107 у них общая. Это осознанное
 * дублирование по постулату 3: законы меняются несинхронно, и правка ставки
 * в одной стране физически не должна ломать другую.
 */

/** Границы возраста в личном режиме (ЕЭК №107). Проверены прогоном по годам. */
export const PERSONAL_AGE_NEW_MAX = 3;
export const PERSONAL_AGE_MID_MAX = 5;

/** Границы возраста в общем порядке (ЕТТ). Проверены прогоном по годам. */
export const COMMERCIAL_AGE_NEW_MAX = 3;
export const COMMERCIAL_AGE_MID_MAX = 7;

/**
 * Личное пользование, авто до 3 лет включительно.
 * Таблица 1 Приложения №2 к Решению Совета ЕЭК №107.
 *
 * Платёж = max(процент × стоимость, минимум × см³). Бракет выбирается
 * по таможенной стоимости в евро, верхняя граница включительная —
 * проверено парами 8500/8501, 16700/16701, 42300/42301, 84500/84501,
 * 169000/169001 (кейсы kg-p-04 и kg-p-05 — соседние бракеты).
 */
export const PERSONAL_NEW_BRACKETS: ReadonlyArray<{
  maxValueEur: number;
  rate: number;
  minEurPerCc: number;
}> = [
  { maxValueEur: 8_500, rate: 0.54, minEurPerCc: 2.5 },
  { maxValueEur: 16_700, rate: 0.48, minEurPerCc: 3.5 },
  { maxValueEur: 42_300, rate: 0.48, minEurPerCc: 5.5 },
  { maxValueEur: 84_500, rate: 0.48, minEurPerCc: 7.5 },
  { maxValueEur: 169_000, rate: 0.48, minEurPerCc: 15 },
  { maxValueEur: Number.POSITIVE_INFINITY, rate: 0.48, minEurPerCc: 20 },
];

/**
 * Личное пользование, 4–5 лет. Таблица 2 Приложения №2 к Решению ЕЭК №107.
 * Платёж = ставка × см³, от стоимости не зависит вовсе.
 */
export const PERSONAL_MID_BRACKETS: ReadonlyArray<{
  maxCc: number;
  eurPerCc: number;
}> = [
  { maxCc: 1_000, eurPerCc: 1.5 },
  { maxCc: 1_500, eurPerCc: 1.7 },
  { maxCc: 1_800, eurPerCc: 2.5 },
  { maxCc: 2_300, eurPerCc: 2.7 },
  { maxCc: 3_000, eurPerCc: 3.0 },
  { maxCc: Number.POSITIVE_INFINITY, eurPerCc: 3.6 },
];

/** Личное пользование, 6 лет и старше. Та же таблица, второй блок ставок. */
export const PERSONAL_OLD_BRACKETS: ReadonlyArray<{
  maxCc: number;
  eurPerCc: number;
}> = [
  { maxCc: 1_000, eurPerCc: 3.0 },
  { maxCc: 1_500, eurPerCc: 3.2 },
  { maxCc: 1_800, eurPerCc: 3.5 },
  { maxCc: 2_300, eurPerCc: 4.8 },
  { maxCc: 3_000, eurPerCc: 5.0 },
  { maxCc: Number.POSITIVE_INFINITY, eurPerCc: 5.7 },
];

/**
 * Общий порядок, специфические ставки ЕТТ ЕАЭС, евро за 1 см³.
 *
 * `mid` — минимум для 4–7 лет, где пошлина = max(20% от стоимости, mid × см³).
 * `old` — ставка для 8 лет и старше, где стоимость не участвует совсем.
 *
 * Немонотонность у бензина (0.40 на ≤1500, потом 0.36 на ≤1800) — не опечатка:
 * воспроизводится эталоном на всех трёх точках 1499 / 1500 / 1501.
 */
export const COMMERCIAL_PETROL_BRACKETS: ReadonlyArray<{
  maxCc: number;
  mid: number;
  old: number;
}> = [
  { maxCc: 1_000, mid: 0.36, old: 1.4 },
  { maxCc: 1_500, mid: 0.4, old: 1.5 },
  { maxCc: 1_800, mid: 0.36, old: 1.6 },
  { maxCc: 3_000, mid: 0.44, old: 2.2 },
  { maxCc: Number.POSITIVE_INFINITY, mid: 0.8, old: 3.2 },
];

export const COMMERCIAL_DIESEL_BRACKETS: ReadonlyArray<{
  maxCc: number;
  mid: number;
  old: number;
}> = [
  { maxCc: 1_500, mid: 0.32, old: 1.5 },
  { maxCc: 2_500, mid: 0.4, old: 2.2 },
  { maxCc: Number.POSITIVE_INFINITY, mid: 0.8, old: 3.2 },
];

/** Общий порядок, авто до 3 лет: чистые проценты, минимума по объёму нет. */
export const COMMERCIAL_NEW_DUTY_RATE = 0.15;

/** Общий порядок, 4–7 лет: адвалорная половина формулы max(). */
export const COMMERCIAL_MID_DUTY_RATE = 0.2;

/**
 * Ставка для электромобилей и последовательных гибридов после исчерпания квоты.
 *
 * ⚠ ЗДЕСЬ МЫ РАСХОДИМСЯ С ЭТАЛОНОМ ОСОЗНАННО. Калькулятор ГТС по коду
 * `ELECTRIC` до сих пор отдаёт нулевую пошлину и нулевой НДС — проверено
 * на годах 2010…2026, везде ноль. Но квота 2026 года на беспошлинный ввоз
 * (15 000 машин по кодам ТН ВЭД 8703 80 000 3 и 8703 80 000 5) исчерпана:
 * ГТС предупреждала об этом 29.06.2026, исчерпание зафиксировано 03.07.2026.
 * После исчерпания применяется ставка ЕТТ 15% от таможенной стоимости.
 *
 * То есть калькулятор-эталон по электромобилям просто не обновлён. Кейсы
 * kg-c-17 и kg-c-18 помечены в golden-файле полем `divergentLines`.
 */
export const ELECTRIC_DUTY_RATE = 0.15;

/**
 * Классификация гибридов — решение владельца от 09.08.2026.
 *
 * Последовательные гибриды (ДВС только генератор, колёса крутит электромотор:
 * LiAuto L7/L8/L9, Voyah Free, Zeekr 007 REEV) идут по коду 8703 80 000 5
 * и приравнены к электромобилям — общая квота, общая ставка.
 *
 * Параллельные и классические гибриды (HEV/PHEV: Toyota Prius, BYD Song Plus
 * DM-i, Geely Monjaro Hi-P) оформляются как обычные бензиновые или дизельные.
 * Отдельной ставки для них нет ни в ЕТТ, ни в калькуляторе ГТС: в его форме
 * они склеены с базовым топливом («бензин, бензин-гибрид»), а в API значения
 * `HYBRID` не существует вовсе.
 */
export const HS_CODE_ELECTRIC = "8703 80 000 3";
export const HS_CODE_SERIES_HYBRID = "8703 80 000 5";

/** НДС при ввозе. Подтверждён всеми коммерческими кейсами эталона. */
export const VAT_RATE = 0.12;

/**
 * Возраст, до которого включительно юрлицо освобождено от НДС на
 * электромобиль и последовательный гибрид.
 *
 * ⚠ Эталоном не проверяется: он вообще не берёт НДС с электромобилей.
 * Значение — из сводки владельца по Налоговому кодексу КР («с годом выпуска
 * до 5 лет» читается как 5 лет включительно, отсчёт от даты производства).
 */
export const ELECTRIC_VAT_FREE_AGE_MAX = 5;

/**
 * Сбор за таможенное оформление — 0.4% от таможенной стоимости.
 *
 * Ни минимума, ни потолка: проверено на стоимости 100 / 333 / 1 000 / 5 000 /
 * 10 000 / 50 000 / 100 000 / 500 000 / 1 000 000 EUR — ровно 0.4% везде.
 *
 * ⚠ В личном режиме мы расходимся с эталоном: он показывает сбор нулём,
 * считая ЕСП совокупным платежом, который включает всё. По решению владельца
 * от 09.08.2026 сбор начисляется и физлицу — это отдельный платёж за обработку
 * документов, а не налог. Помечено в golden-файле полем `divergentLines`.
 */
export const CUSTOMS_FEE_RATE = 0.004;

/**
 * Акциз при ввозе легковых автомобилей — 0.
 *
 * Строка в чеке остаётся нулевой, чтобы было видно, что её учли, а не забыли.
 * Эталон акциз не показывает ни для какого топлива, и по сводке владельца
 * акциза по мощности для последовательных гибридов у юрлиц в КР тоже нет.
 */
export const EXCISE_KGS = 0;

/**
 * Сбор за первичную регистрацию в ГРС/ЦОН — 5% от среднерыночной стоимости
 * по тарифной сетке МВД КР.
 *
 * ⚠ ОЦЕНКА, А НЕ РАСЧЁТ. Базой служит оценка МВД, а не цена в инвойсе, и
 * подставить сюда нашу таможенную стоимость — приближение. Поэтому строка
 * лежит в `extra`, под итогом, и в сумму растаможки не входит: это платёж
 * при постановке на учёт, а не при ввозе. Эталон её не показывает вовсе.
 */
export const REGISTRATION_FEE_RATE = 0.05;

/** Утилизационного сбора для личного пользования в КР нет. */
export const RECYCLING_FEE_KGS = 0;

export function personalNewBracket(valueEur: number) {
  for (const bracket of PERSONAL_NEW_BRACKETS) {
    if (valueEur <= bracket.maxValueEur) return bracket;
  }
  return PERSONAL_NEW_BRACKETS[PERSONAL_NEW_BRACKETS.length - 1];
}

function pickByCc<T extends { maxCc: number }>(
  brackets: ReadonlyArray<T>,
  volumeCc: number,
): T {
  for (const bracket of brackets) {
    if (volumeCc <= bracket.maxCc) return bracket;
  }
  return brackets[brackets.length - 1];
}

export function personalRateEurPerCc(volumeCc: number, age: number): number {
  const brackets =
    age <= PERSONAL_AGE_MID_MAX ? PERSONAL_MID_BRACKETS : PERSONAL_OLD_BRACKETS;
  return pickByCc(brackets, volumeCc).eurPerCc;
}

export function commercialBracket(volumeCc: number, isDiesel: boolean) {
  return pickByCc(
    isDiesel ? COMMERCIAL_DIESEL_BRACKETS : COMMERCIAL_PETROL_BRACKETS,
    volumeCc,
  );
}

/**
 * Округление до цента евро — часть расчёта, а не оформление.
 *
 * Эталон округляет каждую статью в евро и только потом переводит её в сомы.
 * Различить порядок удалось на кейсе `currency=KGS, cost=1 000 000`: сбор там
 * равен 3999.56 KGS. Точные 0.4% дают 39.6943 EUR и 3999.99 KGS, а округлённые
 * 39.69 EUR × 100.77 = 3999.56 — совпало со вторым вариантом.
 */
export function roundEur(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Округление до тыйына. Колонка KGS у эталона всегда с двумя знаками. */
export function roundKgs(value: number): number {
  return Math.round(value * 100) / 100;
}
