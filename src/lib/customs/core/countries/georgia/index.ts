import type {
  CalcResult,
  CountryCalculator,
  Flag,
  I18nText,
  Line,
} from "@/lib/customs/core/types";
import { txt } from "@/lib/customs/core/text";
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
  note: I18nText;
}

/** Возрастной бракет — отдельным текстом: он подставляется внутрь формулы акциза. */
function ageBandText(isOld: boolean): I18nText {
  return txt(isOld ? "georgia.ageBand.over" : "georgia.ageBand.upTo", {
    years: AGE_THRESHOLD_YEARS,
  });
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
      note: txt("georgia.notes.exciseElectric"),
    };
  }

  const isRhd = input.steering === "right";

  // Скидка для гибрида требует обоих условий сразу: возраст до порога и левый руль.
  const hybridApplies = input.fuel === "hybrid" && !isOld && !isRhd;

  let rate = baseRate;
  if (hybridApplies) rate *= HYBRID_MULTIPLIER;
  if (isRhd) rate *= RIGHT_HAND_DRIVE_MULTIPLIER;

  // Множители исключают друг друга: скидка гибриду не достаётся при правом руле.
  // Поэтому вариантов формулы три, а не четыре, и каждый — самостоятельный ключ:
  // переводить обрывок вроде « × 0,4 (гибрид)» отдельно от предложения нельзя.
  const noteKey = hybridApplies
    ? "georgia.notes.exciseHybrid"
    : isRhd
      ? "georgia.notes.exciseRhd"
      : "georgia.notes.excise";

  return {
    amountGel: rate * volumeCc,
    note: txt(noteKey, {
      baseRate,
      volumeCc,
      age,
      ageBand: ageBandText(isOld),
      hybridMultiplier: HYBRID_MULTIPLIER,
      rhdMultiplier: RIGHT_HAND_DRIVE_MULTIPLIER,
    }),
  };
}

function calcFlags(input: GeorgiaInput, isOld: boolean): Flag[] {
  const flags: Flag[] = [];

  if (input.year < EURO5_TYPICAL_YEAR_FROM) {
    flags.push({
      level: "warn",
      text: txt("georgia.flags.euro5", { yearFrom: EURO5_TYPICAL_YEAR_FROM }),
    });
  }
  if (isOld) {
    flags.push({
      level: "info",
      text: txt("georgia.flags.oldAge", {
        years: AGE_THRESHOLD_YEARS,
        rate: EXCISE_GEL_PER_CC.overThreshold,
      }),
    });
  }
  if (input.fuel === "electric") {
    flags.push({ level: "info", text: txt("georgia.flags.electric") });
  }
  if (input.fuel === "hybrid") {
    const isRhd = input.steering === "right";
    let text: I18nText;
    if (isOld && isRhd) {
      text = txt("georgia.flags.hybridOldRhd", { years: AGE_THRESHOLD_YEARS });
    } else if (isOld) {
      text = txt("georgia.flags.hybridOld", { years: AGE_THRESHOLD_YEARS });
    } else if (isRhd) {
      text = txt("georgia.flags.hybridRhd");
    } else {
      // Скидка выражена долей от ставки, поэтому процент считается из неё,
      // а не зашивается в текст: поменяется множитель — поменяется и цифра.
      text = txt("georgia.flags.hybridDiscount", {
        discount: Math.round((1 - HYBRID_MULTIPLIER) * 100),
      });
    }
    flags.push({ level: "info", text });
  }
  if (input.steering === "right" && input.fuel !== "electric") {
    flags.push({
      level: "info",
      text: txt("georgia.flags.rhd", {
        multiplier: RIGHT_HAND_DRIVE_MULTIPLIER,
      }),
    });
  }
  return flags;
}

const FUEL_KEYS: Record<GeorgiaFuel, string> = {
  petrol: "georgia.fuelShort.petrol",
  hybrid: "georgia.fuelShort.hybrid",
  electric: "georgia.fuelShort.electric",
};

/** Подпись под заголовком чека. Собирается ядром, чтобы интерфейс не знал про страны. */
function buildSubtitle(input: GeorgiaInput, volumeCc: number): I18nText[] {
  const parts: I18nText[] = [
    txt("georgia.subtitle.year", { year: input.year }),
  ];
  if (input.fuel !== "electric") {
    parts.push(txt("georgia.subtitle.volume", { volumeCc }));
  }
  parts.push(txt(FUEL_KEYS[input.fuel]));
  parts.push(
    txt(
      input.steering === "right"
        ? "georgia.steeringShort.right"
        : "georgia.steeringShort.left",
    ),
  );
  return parts;
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
      label: txt("georgia.lines.excise"),
      note: excise.note,
      amount: excise.amountGel,
      currency: "GEL",
      muted: excise.amountGel === 0,
    },
    {
      id: "customsServiceTax",
      label: txt("georgia.lines.customsServiceTax"),
      amount: FEES_GEL.customsServiceTax,
      currency: "GEL",
    },
    {
      id: "processing",
      label: txt("georgia.lines.processing"),
      amount: FEES_GEL.processing,
      currency: "GEL",
    },
    {
      id: "importTax",
      label: txt("georgia.lines.importTax"),
      note: isElectric
        ? txt("georgia.notes.importTaxElectric")
        : txt("georgia.notes.importTax", {
            rate: rate.toFixed(4),
            volumeCc,
          }),
      amount: importTaxGel,
      currency: "GEL",
      muted: isElectric,
    },
    {
      id: "expertAppraisal",
      label: txt("georgia.lines.expertAppraisal"),
      amount: FEES_GEL.expertAppraisal,
      currency: "GEL",
    },
    {
      id: "declaration",
      label: txt("georgia.lines.declaration"),
      amount: FEES_GEL.declaration,
      currency: "GEL",
    },
    {
      id: "internalTransit",
      label: txt("georgia.lines.internalTransit"),
      amount: FEES_GEL.internalTransit,
      currency: "GEL",
    },
    {
      id: "duty",
      label: txt("georgia.lines.duty"),
      note: txt("common.notChargedOnCars"),
      amount: 0,
      currency: "GEL",
      muted: true,
    },
    {
      id: "vat",
      label: txt("georgia.lines.vat"),
      note: txt("common.notChargedOnCars"),
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
    subtitle: buildSubtitle(input, volumeCc),
    stampLabel: ageBandText(isOld),
    meta: {
      age: String(age),
      // Код бракета, а не подпись: подпись живёт в stampLabel и переводится.
      ageBand: isOld ? "over" : "upTo",
      volumeCc: String(volumeCc),
      fuel: input.fuel,
      steering: input.steering,
    },
  };
}

export const georgiaCalculator: CountryCalculator<GeorgiaInput> = {
  id: "georgia",
  title: txt("georgia.title"),
  fields: georgiaFields,
  defaults: georgiaDefaults,
  calculate: calculateGeorgia,
};
