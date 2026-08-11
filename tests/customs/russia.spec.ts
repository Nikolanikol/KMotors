import { describe, expect, it } from "vitest";
import golden from "./golden/russia.golden.json";
import {
  calculateRussia,
  type RussiaFuel,
  type RussiaInput,
} from "@/lib/customs/core/countries/russia";

interface GoldenCase {
  id: string;
  car: string;
  probes: string;
  in: {
    price: number;
    volumeCc: number;
    horsePower: number;
    year: number;
    month: number;
    fuel: string;
  };
  expected: {
    dutyEur: number | null;
    dutyRub: number | null;
    customsFeeRub: number | null;
    recyclingRub: number | null;
  };
}

const cases = golden.cases as GoldenCase[];
const { rubPerUsd, rubPerEur } = golden.fx;
const tol = golden.tolerance;

function toInput(c: GoldenCase): RussiaInput {
  return {
    price: c.in.price,
    priceCurrency: "USD",
    rubPerUnit: rubPerUsd,
    rubPerEur,
    volumeCc: c.in.volumeCc,
    horsePower: c.in.horsePower,
    year: c.in.year,
    month: c.in.month,
    currentYear: golden.currentYear,
    currentMonth: golden.currentMonth,
    fuel: c.in.fuel as RussiaFuel,
  };
}

describe(`Россия — сверка с эталоном (${golden.sourceName}, ${golden.takenAt})`, () => {
  for (const c of cases) {
    it(`${c.id} · ${c.car} · ${c.probes}`, () => {
      const result = calculateRussia(toInput(c));
      const byId = new Map(result.lines.map((l) => [l.id, l.amount]));

      const dutyRub = byId.get("duty");
      expect(dutyRub, 'в чеке нет строки "duty"').toBeDefined();

      // Пошлина сверяется в евро: источник печатает её и в евро (точно, с
      // округлением вверх до целого), и в рублях (округляя до тысяч). Евро —
      // проверка самой ставки, рубли — проверка того, что курс приложен.
      if (c.expected.dutyEur !== null) {
        const actualEur = dutyRub! / rubPerEur;
        expect(
          Math.abs(actualEur - c.expected.dutyEur),
          `пошлина: ядро ${actualEur.toFixed(1)} €, эталон ${c.expected.dutyEur} €`,
        ).toBeLessThanOrEqual(tol.dutyEur);
      }

      if (c.expected.dutyRub !== null) {
        expect(
          Math.abs(dutyRub! - c.expected.dutyRub),
          `пошлина: ядро ${dutyRub} ₽, эталон ${c.expected.dutyRub} ₽`,
        ).toBeLessThanOrEqual(tol.dutyRub);
      }

      const exact: [string, number | null][] = [
        ["customsFee", c.expected.customsFeeRub],
        ["recyclingFee", c.expected.recyclingRub],
      ];
      for (const [id, expected] of exact) {
        if (expected === null) continue;
        const actual = byId.get(id);
        expect(actual, `в чеке нет строки "${id}"`).toBeDefined();
        expect(
          Math.abs(actual! - expected),
          `строка "${id}": ядро ${actual} ₽, эталон ${expected} ₽`,
        ).toBeLessThanOrEqual(tol.exactRub);
      }
    });
  }
});

describe("Россия — инварианты ядра", () => {
  const base: RussiaInput = {
    price: 20000,
    priceCurrency: "USD",
    rubPerUnit: rubPerUsd,
    rubPerEur,
    volumeCc: 1999,
    horsePower: 150,
    year: 2022,
    month: 1,
    currentYear: 2026,
    currentMonth: 8,
    fuel: "ice",
  };

  const line = (input: RussiaInput, id: string) =>
    calculateRussia(input).lines.find((l) => l.id === id)!.amount;

  it("итог равен сумме строк чека", () => {
    const r = calculateRussia(base);
    const sum = r.lines.reduce((acc, l) => acc + l.amount, 0);
    expect(sum).toBe(r.total.amount);
    expect(r.total.currency).toBe("RUB");
  });

  it("ядро детерминировано и не зависит от текущей даты", () => {
    expect(calculateRussia(base)).toEqual(calculateRussia(base));
  });

  it("расчётный момент приходит извне: сдвиг currentYear меняет возрастной бракет", () => {
    // Источник задаёт возраст бракетом и границы проверить не позволяет —
    // поэтому переломы ставки закрыты здесь.
    const young = { ...base, year: 2024, month: 9 }; // 1 год 11 мес → «до 3»
    const mid = { ...base, year: 2023, month: 7 }; // 3 года 1 мес → «3–5»
    expect(calculateRussia(young).meta!.ageBand).toBe("new");
    expect(calculateRussia(mid).meta!.ageBand).toBe("mid");
  });

  it("возраст ровно 3 года уходит в средний бракет, ровно 5 лет — в старый", () => {
    const at3 = { ...base, year: 2023, month: 8 };
    const at5 = { ...base, year: 2021, month: 8 };
    expect(calculateRussia(at3).meta!.ageBand).toBe("mid");
    expect(calculateRussia(at5).meta!.ageBand).toBe("old");
  });

  it("ставка пошлины растёт при переходе в старший возрастной бракет", () => {
    const mid = line({ ...base, year: 2022, month: 1 }, "duty");
    const old = line({ ...base, year: 2018, month: 1 }, "duty");
    expect(old).toBeGreaterThan(mid);
  });

  it("у электромобиля объём двигателя игнорируется полностью", () => {
    const a = calculateRussia({ ...base, fuel: "electric", volumeCc: 1999 });
    const b = calculateRussia({ ...base, fuel: "electric", volumeCc: 0 });
    expect(a.total.amount).toBe(b.total.amount);
  });

  it("пошлина электромобиля не зависит от возраста", () => {
    const young = line({ ...base, fuel: "electric", year: 2025 }, "duty");
    const old = line({ ...base, fuel: "electric", year: 2018 }, "duty");
    expect(young).toBe(old);
  });

  it("таможенный сбор зависит только от цены в рублях", () => {
    const a = line({ ...base, price: 20000, volumeCc: 999, horsePower: 80 }, "customsFee");
    const b = line({ ...base, price: 20000, volumeCc: 3000, horsePower: 300 }, "customsFee");
    expect(a).toBe(b);
  });

  it("без указанной мощности утильсбор помечается прикидкой", () => {
    const r = calculateRussia({ ...base, horsePower: 0 });
    expect(r.meta!.recyclingApprox).toBe("true");
  });

  it("нулевой курс не роняет расчёт", () => {
    const r = calculateRussia({ ...base, rubPerUnit: 0, rubPerEur: 0 });
    expect(Number.isFinite(r.total.amount)).toBe(true);
    expect(r.alt).toEqual([]);
  });
});
