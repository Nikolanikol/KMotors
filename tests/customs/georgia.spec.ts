import { describe, expect, it } from "vitest";
import golden from "./golden/georgia.golden.json";
import {
  calculateGeorgia,
  type GeorgiaFuel,
  type GeorgiaInput,
  type Steering,
} from "@/lib/customs/core/countries/georgia";

/** Ключи разбивки совпадают с id строк чека в ядре. */
type BreakdownKey =
  | "excise"
  | "customsServiceTax"
  | "processing"
  | "importTax"
  | "expertAppraisal"
  | "declaration"
  | "internalTransit";

interface GoldenCase {
  id: string;
  car: string;
  probes: string;
  in: {
    year: number;
    volumeCc: number;
    fuel: string;
    steering: string;
  };
  expected: {
    totalGel: number | null;
    breakdown: Record<BreakdownKey, number | null>;
  };
}

const cases = golden.cases as GoldenCase[];
const tolerance = golden.tolerance.gel;

function toInput(c: GoldenCase): GeorgiaInput {
  return {
    year: c.in.year,
    currentYear: golden.currentYear,
    volumeCc: c.in.volumeCc,
    fuel: c.in.fuel as GeorgiaFuel,
    steering: c.in.steering as Steering,
    // Курс в расчёте не участвует; нужен только для справочной строки в USD.
    gelPerUsd: 0,
  };
}

/** Кейс считается заполненным, если задан итог или хотя бы одна строка разбивки. */
function isFilled(c: GoldenCase): boolean {
  if (c.expected.totalGel !== null) return true;
  return Object.values(c.expected.breakdown).some((v) => v !== null);
}

const filledCount = cases.filter(isFilled).length;

describe("Грузия — сверка с эталоном", () => {
  it(`эталон: заполнено ${filledCount} из ${cases.length}`, () => {
    if (filledCount === 0) {
      console.warn(
        "\n  Эталон Грузии пуст — все кейсы ниже показаны как skipped." +
          "\n  Заполнять: tests/customs/golden/georgia.golden.json\n",
      );
    }
    expect(cases.length).toBeGreaterThan(0);
  });

  for (const c of cases) {
    it.skipIf(!isFilled(c))(`${c.id} · ${c.car} · ${c.probes}`, () => {
      const result = calculateGeorgia(toInput(c));
      const byId = new Map(result.lines.map((l) => [l.id, l.amount]));

      // Сначала построчно — так видно, какая именно статья разошлась.
      for (const [key, expected] of Object.entries(c.expected.breakdown)) {
        if (expected === null) continue;
        const actual = byId.get(key);
        expect(actual, `в чеке нет строки "${key}"`).toBeDefined();
        expect(
          Math.abs(actual! - expected),
          `строка "${key}": ядро ${actual}, эталон ${expected}`,
        ).toBeLessThanOrEqual(tolerance);
      }

      if (c.expected.totalGel !== null) {
        expect(result.total.currency).toBe("GEL");
        expect(
          Math.abs(result.total.amount - c.expected.totalGel),
          `итог: ядро ${result.total.amount}, эталон ${c.expected.totalGel}`,
        ).toBeLessThanOrEqual(tolerance);
      }
    });
  }
});

describe("Грузия — инварианты ядра", () => {
  const base: GeorgiaInput = {
    year: 2021,
    currentYear: 2026,
    volumeCc: 1998,
    fuel: "petrol",
    steering: "left",
    gelPerUsd: 2.7,
  };

  it("курс не влияет на сумму в лари", () => {
    const a = calculateGeorgia({ ...base, gelPerUsd: 2.7 });
    const b = calculateGeorgia({ ...base, gelPerUsd: 3.4 });
    expect(a.total.amount).toBe(b.total.amount);
  });

  it("ядро детерминировано и не зависит от текущей даты", () => {
    expect(calculateGeorgia(base)).toEqual(calculateGeorgia(base));
  });

  it("итог равен сумме строк чека", () => {
    const r = calculateGeorgia(base);
    const sum = r.lines.reduce((acc, line) => acc + line.amount, 0);
    expect(sum).toBeCloseTo(r.total.amount, 10);
  });

  it("фиксированные сборы в сумме дают 480 GEL", () => {
    const r = calculateGeorgia(base);
    const feeIds = [
      "customsServiceTax",
      "processing",
      "expertAppraisal",
      "declaration",
      "internalTransit",
    ];
    const sum = r.lines
      .filter((l) => feeIds.includes(l.id))
      .reduce((acc, l) => acc + l.amount, 0);
    expect(sum).toBe(480);
  });

  it("электромобиль не платит акциз при любом руле", () => {
    for (const steering of ["left", "right"] as const) {
      const r = calculateGeorgia({ ...base, fuel: "electric", volumeCc: 0, steering });
      expect(r.lines.find((l) => l.id === "excise")!.amount).toBe(0);
    }
  });

  it("у электромобиля объём двигателя игнорируется полностью", () => {
    // Форма прячет поле объёма при выборе «электро», но прежнее значение
    // остаётся в состоянии. Ядро обязано его игнорировать само.
    for (const steering of ["left", "right"] as const) {
      const r = calculateGeorgia({
        ...base,
        fuel: "electric",
        steering,
        volumeCc: 1998,
      });
      expect(r.lines.find((l) => l.id === "excise")!.amount).toBe(0);
      expect(r.lines.find((l) => l.id === "importTax")!.amount).toBe(0);
      // Остаются одни фиксированные сборы.
      expect(r.total.amount).toBe(480);
    }
  });

  it("объём округляется вверх до 100 см³", () => {
    const excise = (volumeCc: number) =>
      calculateGeorgia({ ...base, volumeCc }).lines.find((l) => l.id === "excise")!
        .amount;
    // 1501..1600 должны дать одинаковый акциз — все округляются до 1600.
    expect(excise(1501)).toBe(excise(1600));
    expect(excise(1591)).toBe(excise(1600));
    // 1600 и 1601 попадают в разные шаги.
    expect(excise(1601)).toBeGreaterThan(excise(1600));
  });

  it("скидка для гибрида требует и возраста до порога, и левого руля", () => {
    const hybrid = { ...base, fuel: "hybrid" as const, volumeCc: 1800 };
    const excise = (input: GeorgiaInput) =>
      calculateGeorgia(input).lines.find((l) => l.id === "excise")!.amount;

    const young = { ...hybrid, year: 2021 }; // возраст 5
    const old = { ...hybrid, year: 2010 }; // возраст 16

    expect(excise({ ...young, steering: "left" })).toBe(1.5 * 0.4 * 1800);
    expect(excise({ ...young, steering: "right" })).toBe(1.5 * 3 * 1800);
    expect(excise({ ...old, steering: "left" })).toBe(4.5 * 1800);
    expect(excise({ ...old, steering: "right" })).toBe(4.5 * 3 * 1800);
  });

  it("ставка налога на импорт растёт с возрастом", () => {
    const tax = (year: number) =>
      calculateGeorgia({ ...base, year, volumeCc: 2000 }).lines.find(
        (l) => l.id === "importTax",
      )!.amount;
    // 0.05 + 0.0025 × возраст, на 2000 см³.
    expect(tax(2024)).toBe(110); // возраст 2  → 0.0550
    expect(tax(2021)).toBe(125); // возраст 5  → 0.0625
    expect(tax(2016)).toBe(150); // возраст 10 → 0.0750
  });
});
