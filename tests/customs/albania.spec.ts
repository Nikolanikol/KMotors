import { describe, expect, it } from "vitest";
import golden from "./golden/albania.golden.json";
import {
  calculateAlbania,
  type AlbaniaFuel,
  type AlbaniaInput,
} from "@/lib/customs/core/countries/albania";
import {
  LUXURY_ANNUAL_ALL,
  LUXURY_VALUE_THRESHOLD_ALL,
  LUXURY_VOLUME_THRESHOLD_CC,
  MIN_CUSTOMS_VALUE_MAX_ALL,
  REGISTRATION_FEE_ALL,
} from "@/lib/customs/core/countries/albania/tables";

/** Ключи разбивки совпадают с id строк чека в ядре. */
type BreakdownKey = "vat" | "registration" | "luxuryOnce" | "duty" | "excise";

interface GoldenCase {
  id: string;
  case: string;
  probes: string;
  /** Есть только у кейсов, где ядро расходится с источником осознанно. */
  divergence?: { reason: string; minimumByCcAll: number };
  in: {
    price: number;
    freight: number;
    volumeCc: number;
    fuel: string;
  };
  expected: {
    customsValueAll: number | null;
    totalAll: number | null;
    luxuryAnnualAll: number | null;
    breakdown: Record<BreakdownKey, number | null>;
  };
}

const cases = golden.cases as GoldenCase[];
const tolerance = golden.tolerance.all;

function toInput(c: GoldenCase): AlbaniaInput {
  return {
    price: c.in.price,
    freight: c.in.freight,
    // Курс из эталона, а не живой: в Албании он входит в расчёт напрямую,
    // и без фиксации кейсы разъезжались бы каждый день.
    allPerUnit: golden.fx.allPerUnit,
    priceCurrency: golden.fx.unit,
    volumeCc: c.in.volumeCc,
    fuel: c.in.fuel as AlbaniaFuel,
  };
}

const asserted = cases.filter((c) => !c.divergence);
const diverging = cases.filter((c) => c.divergence);

describe("Албания — сверка с эталоном", () => {
  it(`эталон: ${asserted.length} кейсов утверждается, ${diverging.length} помечены расхождением`, () => {
    expect(cases.length).toBeGreaterThan(0);
    expect(asserted.length).toBeGreaterThan(0);
  });

  for (const c of asserted) {
    it(`${c.id} · ${c.case} · ${c.probes}`, () => {
      const result = calculateAlbania(toInput(c));
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

      if (c.expected.customsValueAll !== null) {
        expect(
          Math.abs(
            Number(result.meta.customsValueAll) - c.expected.customsValueAll,
          ),
          `таможенная стоимость: ядро ${result.meta.customsValueAll}, эталон ${c.expected.customsValueAll}`,
        ).toBeLessThanOrEqual(tolerance);
      }

      if (c.expected.totalAll !== null) {
        expect(result.total.currency).toBe("ALL");
        expect(
          Math.abs(result.total.amount - c.expected.totalAll),
          `итог: ядро ${result.total.amount}, эталон ${c.expected.totalAll}`,
        ).toBeLessThanOrEqual(tolerance);
      }

      if (c.expected.luxuryAnnualAll !== null) {
        const annual =
          result.extra?.find((l) => l.id === "luxuryAnnual")?.amount ?? 0;
        expect(
          annual,
          `ежегодный налог: ядро ${annual}, эталон ${c.expected.luxuryAnnualAll}`,
        ).toBe(c.expected.luxuryAnnualAll);
      }
    });
  }

  // Эти кейсы не утверждаются: источник не применяет минимальную стоимость
  // по объёму, а ядро применяет — по решению владельца. Оставлены видимыми,
  // чтобы расхождение было документом, а не забытым кейсом.
  for (const c of diverging) {
    it.skip(`${c.id} · ${c.case} — расхождение: ${c.divergence!.reason}`, () => {});
  }
});

describe("Албания — инварианты ядра", () => {
  const base: AlbaniaInput = {
    price: 9000,
    freight: 1100,
    allPerUnit: 93.11,
    priceCurrency: "EUR",
    volumeCc: 1998,
    fuel: "petrol",
  };

  const lineOf = (input: AlbaniaInput, id: string) =>
    calculateAlbania(input).lines.find((l) => l.id === id)!.amount;

  it("ядро детерминировано и не зависит от текущей даты", () => {
    expect(calculateAlbania(base)).toEqual(calculateAlbania(base));
  });

  it("итог равен сумме строк чека", () => {
    const r = calculateAlbania(base);
    const sum = r.lines.reduce((acc, line) => acc + line.amount, 0);
    expect(sum).toBeCloseTo(r.total.amount, 10);
  });

  it("ежегодный налог на роскошь в итог не входит", () => {
    const luxury = { ...base, volumeCc: LUXURY_VOLUME_THRESHOLD_CC };
    const r = calculateAlbania(luxury);
    const annual = r.extra!.find((l) => l.id === "luxuryAnnual")!.amount;
    expect(annual).toBe(LUXURY_ANNUAL_ALL);
    const sum = r.lines.reduce((acc, line) => acc + line.amount, 0);
    expect(sum).toBe(r.total.amount);
    expect(r.lines.some((l) => l.id === "luxuryAnnual")).toBe(false);
  });

  it("пошлина и акциз для физлиц нулевые", () => {
    for (const fuel of ["petrol", "hybrid", "electric"] as const) {
      expect(lineOf({ ...base, fuel }, "duty")).toBe(0);
      expect(lineOf({ ...base, fuel }, "excise")).toBe(0);
    }
  });

  it("у электромобиля объём двигателя игнорируется полностью", () => {
    // Форма прячет поле объёма при выборе «электро», но прежнее значение
    // остаётся в состоянии. Иначе электромобилю досталась бы и минимальная
    // стоимость по см³, и налог на роскошь по объёму.
    const ev = { ...base, fuel: "electric" as const, price: 500, freight: 300 };
    const withVolume = calculateAlbania({ ...ev, volumeCc: 3500 });
    const withoutVolume = calculateAlbania({ ...ev, volumeCc: 0 });
    expect(withVolume).toEqual(withoutVolume);
    expect(withVolume.lines.find((l) => l.id === "luxuryOnce")!.amount).toBe(0);
    expect(Number(withVolume.meta.minimumAll)).toBe(0);
  });

  it("минимальная стоимость по объёму поднимает базу НДС", () => {
    // 1998 см³ → бракет 406 000 ALL. Дешёвый лот считается от него.
    const cheap = { ...base, price: 500, freight: 300 };
    expect(Number(calculateAlbania(cheap).meta.vatBaseAll)).toBe(406_000);
    expect(lineOf(cheap, "vat")).toBe(406_000 * 0.2);
  });

  it("минимум не применяется, когда стоимость выше него", () => {
    const r = calculateAlbania(base);
    expect(Number(r.meta.vatBaseAll)).toBe(Number(r.meta.customsValueAll));
  });

  it("порог роскоши по объёму включительный", () => {
    const below = { ...base, volumeCc: LUXURY_VOLUME_THRESHOLD_CC - 1 };
    const at = { ...base, volumeCc: LUXURY_VOLUME_THRESHOLD_CC };
    expect(lineOf(below, "luxuryOnce")).toBe(0);
    expect(lineOf(at, "luxuryOnce")).toBeGreaterThan(0);
  });

  it("порог роскоши по стоимости включительный", () => {
    // Курс 1 подобран так, чтобы стоимость задавалась прямо в леках.
    const exact = {
      ...base,
      allPerUnit: 1,
      freight: 0,
      price: LUXURY_VALUE_THRESHOLD_ALL,
    };
    const below = { ...exact, price: LUXURY_VALUE_THRESHOLD_ALL - 1 };
    expect(lineOf(below, "luxuryOnce")).toBe(0);
    expect(lineOf(exact, "luxuryOnce")).toBeGreaterThan(0);
  });

  it("оба сработавших условия роскоши не удваивают налог", () => {
    const byVolume = { ...base, volumeCc: 3500 };
    const byBoth = { ...byVolume, allPerUnit: 1, freight: 0, price: 6_000_000 };
    expect(lineOf(byBoth, "luxuryOnce")).toBe(lineOf(byVolume, "luxuryOnce"));
  });

  it("минимум по таблице не может сам дотянуть до порога роскоши", () => {
    // Иначе дешёвый лот с большим мотором получал бы налог на роскошь
    // из-за заградительной таблицы, а не из-за реальной стоимости.
    expect(MIN_CUSTOMS_VALUE_MAX_ALL).toBeLessThan(LUXURY_VALUE_THRESHOLD_ALL);
  });

  it("регистрационный сбор не зависит от параметров авто", () => {
    for (const volumeCc of [900, 1998, 3500, 5000]) {
      expect(lineOf({ ...base, volumeCc }, "registration")).toBe(
        REGISTRATION_FEE_ALL,
      );
    }
  });

  it("курс не влияет ни на что, кроме таможенной стоимости", () => {
    const a = calculateAlbania({ ...base, allPerUnit: 93.11 });
    const b = calculateAlbania({ ...base, allPerUnit: 80.79 });
    expect(a.total.amount).toBeGreaterThan(b.total.amount);
    for (const id of ["duty", "excise", "registration", "luxuryOnce"]) {
      expect(lineOf({ ...base, allPerUnit: 93.11 }, id)).toBe(
        lineOf({ ...base, allPerUnit: 80.79 }, id),
      );
    }
  });

  it("отрицательные значения формы не уводят расчёт в минус", () => {
    const r = calculateAlbania({ ...base, price: -5000, freight: -100 });
    expect(Number(r.meta.customsValueAll)).toBe(0);
    expect(r.total.amount).toBeGreaterThanOrEqual(0);
  });
});
