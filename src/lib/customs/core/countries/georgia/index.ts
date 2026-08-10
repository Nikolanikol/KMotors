import type { CalcResult, CountryCalculator, Flag, Line } from "@/lib/customs/core/types";
import { georgiaFields } from "./fields";
import {
  AGE_THRESHOLD_YEARS,
  EURO5_TYPICAL_YEAR_FROM,
  ELECTRIC_EXCISE_GEL,
  EXCISE_GEL_PER_CC,
  FEES_GEL,
  HYBRID_MULTIPLIER,
  RIGHT_HAND_DRIVE_MULTIPLIER,
  importTaxRate,
  roundVolumeUp,
} from "./tables";

export type GeorgiaFuel = "petrol" | "hybrid" | "electric";
export type Steering = "left" | "right";

export interface GeorgiaInput {
  /** Год выпуска. */
  year: number;
  /** Расчётный год. Передаётся снаружи — ядро не зовёт new Date(). */
  currentYear: number;
  /** Объём двигателя, см³. Для электромобилей не используется. */
  volumeCc: number;
  fuel: GeorgiaFuel;
  steering: Steering;
  /** Курс GEL за 1 USD. Влияет только на пересчёт итога, не на расчёт. */
  gelPerUsd: number;
}

export const georgiaDefaults: GeorgiaInput = {
  year: 2021,
  currentYear: 2026,
  volumeCc: 1998,
  fuel: "petrol",
  steering: "left",
  gelPerUsd: 2.7,
};

interface ExciseBreakdown {
  amountGel: number;
  note: string;
}

function calcExcise(
  input: GeorgiaInput,
  age: number,
  isOld: boolean,
  volumeCc: number,
): ExciseBreakdown {
  const baseRate = isOld
    ? EXCISE_GEL_PER_CC.overThreshold
    : EXCISE_GEL_PER_CC.upToThreshold;

  // Электромобили не платят акциз при любом расположении руля.
  if (input.fuel === "electric") {
    return {
      amountGel: ELECTRIC_EXCISE_GEL,
      note: "электромобиль — акциз не взимается",
    };
  }

  const isRhd = input.steering === "right";
  const rhdSuffix = isRhd ? ` × ${RIGHT_HAND_DRIVE_MULTIPLIER} (правый руль)` : "";
  const ageLabel = isOld ? `>${AGE_THRESHOLD_YEARS} лет` : `≤${AGE_THRESHOLD_YEARS} лет`;

  // Скидка для гибрида требует обоих условий сразу: возраст до порога и левый руль.
  const hybridApplies = input.fuel === "hybrid" && !isOld && !isRhd;

  let rate = baseRate;
  if (hybridApplies) rate *= HYBRID_MULTIPLIER;
  if (isRhd) rate *= RIGHT_HAND_DRIVE_MULTIPLIER;

  const hybridSuffix = hybridApplies ? ` × ${HYBRID_MULTIPLIER} (гибрид)` : "";
  return {
    amountGel: rate * volumeCc,
    note: `${baseRate} GEL/см³${hybridSuffix}${rhdSuffix} × ${volumeCc} см³, возраст ${age} лет (${ageLabel})`,
  };
}

function calcFlags(input: GeorgiaInput, isOld: boolean): Flag[] {
  const flags: Flag[] = [];

  if (input.year < EURO5_TYPICAL_YEAR_FROM) {
    flags.push({
      level: "warn",
      text: `Возможны сложности с постоянной регистрацией: требуется соответствие Euro-5, обычно это авто от ${EURO5_TYPICAL_YEAR_FROM} г.в.`,
    });
  }
  if (isOld) {
    flags.push({
      level: "info",
      text: `Возраст больше ${AGE_THRESHOLD_YEARS} лет — акциз по повышенной ставке ${EXCISE_GEL_PER_CC.overThreshold} GEL/см³.`,
    });
  }
  if (input.fuel === "electric") {
    flags.push({
      level: "info",
      text: "Электромобиль — акциз не взимается независимо от расположения руля.",
    });
  }
  if (input.fuel === "hybrid") {
    const isRhd = input.steering === "right";
    let text: string;
    if (isOld && isRhd) {
      text = `Гибрид старше ${AGE_THRESHOLD_YEARS} лет и с правым рулём — скидка на акциз не применяется.`;
    } else if (isOld) {
      text = `Гибрид старше ${AGE_THRESHOLD_YEARS} лет — скидка на акциз не применяется.`;
    } else if (isRhd) {
      text = "Гибрид с правым рулём — скидка на акциз не применяется.";
    } else {
      text = "Гибрид — акциз со скидкой 60%.";
    }
    flags.push({ level: "info", text });
  }
  if (input.steering === "right" && input.fuel !== "electric") {
    flags.push({
      level: "info",
      text: `Правый руль — акциз умножается на ${RIGHT_HAND_DRIVE_MULTIPLIER}.`,
    });
  }
  return flags;
}

const FUEL_LABELS: Record<GeorgiaFuel, string> = {
  petrol: "бензин / дизель",
  hybrid: "гибрид",
  electric: "электро",
};

/** Подпись под заголовком чека. Собирается ядром, чтобы интерфейс не знал про страны. */
function buildSubtitle(input: GeorgiaInput, volumeCc: number): string {
  const parts: string[] = [String(input.year)];
  if (input.fuel !== "electric") parts.push(`${volumeCc} см³`);
  parts.push(FUEL_LABELS[input.fuel]);
  parts.push(input.steering === "right" ? "правый руль" : "левый руль");
  return parts.join(" · ");
}

export function calculateGeorgia(input: GeorgiaInput): CalcResult {
  const age = Math.max(0, input.currentYear - input.year);
  const isOld = age > AGE_THRESHOLD_YEARS;

  // У электромобиля объёма двигателя нет: он не участвует ни в акцизе, ни в
  // налоге на импорт. Обнуляем здесь, а не полагаемся на то, что форма пришлёт
  // ноль — иначе остаточное значение поля начисляет электромобилю лишний налог.
  const isElectric = input.fuel === "electric";

  // Объём округляется вверх до 100 см³ и в таком виде участвует в обеих ставках.
  const volumeCc = isElectric ? 0 : roundVolumeUp(input.volumeCc);
  const rate = importTaxRate(age);

  const excise = calcExcise(input, age, isOld, volumeCc);
  // Округление здесь — часть расчёта, а не оформление: источник показывает
  // налог целым числом, и итог сходится именно с округлённой строкой.
  const importTaxGel = Math.round(rate * volumeCc);

  // Порядок строк повторяет разбивку стороннего ресурса — так расхождение
  // видно построчно, а не только в итоге.
  const lines: Line[] = [
    {
      id: "excise",
      label: "Акциз",
      note: excise.note,
      amount: excise.amountGel,
      currency: "GEL",
      muted: excise.amountGel === 0,
    },
    {
      id: "customsServiceTax",
      label: "Налог на таможенные услуги",
      amount: FEES_GEL.customsServiceTax,
      currency: "GEL",
    },
    {
      id: "processing",
      label: "Оформление",
      amount: FEES_GEL.processing,
      currency: "GEL",
    },
    {
      id: "importTax",
      label: "Налог на импорт",
      note: isElectric
        ? "электромобиль — объём двигателя отсутствует, налог не начисляется"
        : `${rate.toFixed(4)} GEL/см³ × ${volumeCc} см³ — ставка растёт с возрастом`,
      amount: importTaxGel,
      currency: "GEL",
      muted: isElectric,
    },
    {
      id: "expertAppraisal",
      label: "Оценка эксперта",
      amount: FEES_GEL.expertAppraisal,
      currency: "GEL",
    },
    {
      id: "declaration",
      label: "Таможенная декларация",
      amount: FEES_GEL.declaration,
      currency: "GEL",
    },
    {
      id: "internalTransit",
      label: "Внутренний транзит (до 60 дней)",
      amount: FEES_GEL.internalTransit,
      currency: "GEL",
    },
    {
      id: "duty",
      label: "Импортная пошлина",
      note: "на автомобили не взимается",
      amount: 0,
      currency: "GEL",
      muted: true,
    },
    {
      id: "vat",
      label: "НДС",
      note: "на автомобили не взимается",
      amount: 0,
      currency: "GEL",
      muted: true,
    },
  ];

  const totalGel = lines.reduce((sum, line) => sum + line.amount, 0);

  const alt =
    input.gelPerUsd > 0
      ? [{ amount: totalGel / input.gelPerUsd, currency: "USD" }]
      : [];

  return {
    lines,
    total: { amount: totalGel, currency: "GEL" },
    alt,
    flags: calcFlags(input, isOld),
    meta: {
      age: String(age),
      ageBand: isOld ? `>${AGE_THRESHOLD_YEARS} лет` : `≤${AGE_THRESHOLD_YEARS} лет`,
      volumeCc: String(volumeCc),
      fuel: input.fuel,
      steering: input.steering,
      subtitle: buildSubtitle(input, volumeCc),
      stampLabel: isOld ? `>${AGE_THRESHOLD_YEARS} лет` : `≤${AGE_THRESHOLD_YEARS} лет`,
    },
  };
}

export const georgiaCalculator: CountryCalculator<GeorgiaInput> = {
  id: "georgia",
  title: "Растаможка авто в Грузии",
  fields: georgiaFields,
  defaults: georgiaDefaults,
  calculate: calculateGeorgia,
};
