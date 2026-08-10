import { describe, expect, it } from "vitest";
import golden from "./golden/armenia.golden.json";
import {
  calculateArmenia,
  type ArmeniaFuel,
  type ArmeniaInput,
} from "@/lib/customs/core/countries/armenia";
import {
  AGE_NEW_BELOW,
  AGE_OLD_FROM,
  LARGE_PETROL_CC_ABOVE,
  NEW_DUTY_RATE,
  NEW_DUTY_RATE_LARGE_PETROL,
  VAT_RATE,
  ecoRate,
} from "@/lib/customs/core/countries/armenia/tables";

/** Ключи разбивки совпадают с id строк чека в ядре. */
type BreakdownKey = "duty" | "vat" | "eco" | "excise";

interface GoldenCase {
  id: string;
  case: string;
  /**
   * Статьи, где ядро расходится с эталоном осознанно. Остальные статьи
   * кейса сверяются строго: прятать весь кейс из-за одной строки нельзя,
   * иначе выпала бы вся проверенная часть.
   */
  divergentLines?: Partial<Record<BreakdownKey | "total", string>>;
  in: {
    fuel: string;
    volumeCc: number;
    year: number;
    currentYear: number;
    priceUsd: number;
  };
  expected: {
    usd: Record<BreakdownKey | "total", number | null>;
  };
}

const cases = golden.cases as GoldenCase[];
const tolerance = golden.tolerance;
const { amdPerUsd, amdPerEur } = golden.fx;

/**
 * Эталон снят в долларах, ядро считает в драмах — валюте страны. Поэтому
 * ядру подаётся курс эталона, а сверка идёт обратным делением. Живой курс
 * сюда попасть не должен: кейсы разъехались бы на следующий день.
 */
function toInput(c: GoldenCase): ArmeniaInput {
  return {
    fuel: c.in.fuel as ArmeniaFuel,
    volumeCc: c.in.volumeCc,
    year: c.in.year,
    currentYear: c.in.currentYear,
    // priceUsd — это уже готовая таможенная база эталона: он сам добавил
    // к введённой цене 1% страховки. Фрахт поэтому нулевой.
    price: c.in.priceUsd,
    freight: 0,
    amdPerUnit: amdPerUsd,
    amdPerEur,
    priceCurrency: "USD",
  };
}

const divergentCount = cases.reduce(
  (sum, c) => sum + Object.keys(c.divergentLines ?? {}).length,
  0,
);

describe("Армения — сверка с эталоном", () => {
  it(`эталон: ${cases.length} кейсов, ${divergentCount} строк помечены расхождением`, () => {
    expect(cases.length).toBeGreaterThan(0);
    expect(cases.some((c) => c.in.fuel === "petrol")).toBe(true);
    expect(cases.some((c) => c.in.fuel === "diesel")).toBe(true);
    expect(cases.some((c) => c.in.fuel === "electric")).toBe(true);
    expect(cases.some((c) => c.in.fuel === "hybrid")).toBe(true);
  });

  for (const c of cases) {
    const diverging = c.divergentLines ?? {};
    const asserted = (["duty", "vat", "eco", "excise", "total"] as const).filter(
      (key) => c.expected.usd[key] !== null && !diverging[key],
    );

    it(`${c.id} · ${c.case}`, () => {
      const result = calculateArmenia(toInput(c));
      const amdById = new Map(result.lines.map((l) => [l.id, l.amount]));

      for (const key of asserted) {
        const actualAmd =
          key === "total" ? result.total.amount : amdById.get(key);
        expect(actualAmd, `в чеке нет строки "${key}"`).toBeDefined();

        const actualUsd = actualAmd! / amdPerUsd;
        expect(
          Math.abs(actualUsd - c.expected.usd[key]!),
          `${key}: ядро ${actualUsd.toFixed(2)} $, эталон ${c.expected.usd[key]} $`,
        ).toBeLessThanOrEqual(tolerance.usd);
      }

      expect(result.total.currency).toBe("AMD");
    });

    // Расхождения показываем отдельными skipped-строками, а не прячем:
    // забытый кейс и осознанное расхождение должны выглядеть по-разному.
    for (const [key, reason] of Object.entries(diverging)) {
      it.skip(`${c.id} · строка "${key}" расходится с эталоном: ${reason}`, () => {});
    }
  }
});

describe("Армения — инварианты ядра", () => {
  const base: ArmeniaInput = {
    fuel: "petrol",
    volumeCc: 1998,
    year: 2021,
    currentYear: 2026,
    price: 10000,
    freight: 0,
    amdPerUnit: 368.5,
    amdPerEur: 422.1223,
    priceCurrency: "USD",
  };

  const lineOf = (input: ArmeniaInput, id: string) =>
    calculateArmenia(input).lines.find((l) => l.id === id)!.amount;

  it("ядро детерминировано и не зависит от текущей даты", () => {
    expect(calculateArmenia(base)).toEqual(calculateArmenia(base));
  });

  it("итог равен сумме строк чека", () => {
    for (const fuel of ["petrol", "diesel", "hybrid", "electric"] as const) {
      const r = calculateArmenia({ ...base, fuel });
      const sum = r.lines.reduce((acc, line) => acc + line.amount, 0);
      expect(sum).toBe(r.total.amount);
    }
  });

  it("режим один: физлицо считается по ЕТТ, а не по ЕЭК №107", () => {
    // По №107 машина 5 лет, 1998 см³ дала бы 2,7 €/см³ = 5394,6 € одной строкой
    // и без НДС. По ЕТТ — 20% от стоимости плюс НДС сверху. Проверяем, что
    // ядро идёт вторым путём: НДС есть и он ненулевой.
    const r = calculateArmenia(base);
    expect(lineOf(base, "vat")).toBeGreaterThan(0);
    expect(r.stampLabel.key).toBe("armenia.stamp.eaeu");
  });

  it("НДС берётся от стоимости ВМЕСТЕ с пошлиной", () => {
    const r = calculateArmenia(base);
    const value = Number(r.meta.customsValueAmd);
    const duty = lineOf(base, "duty");
    expect(lineOf(base, "vat")).toBe(Math.round((value + duty) * VAT_RATE));
  });

  it("экологический налог в базу НДС не входит", () => {
    // Одна и та же машина, отличается только возрастом внутри бракета «7+»:
    // пошлина не меняется, эконалог меняется, НДС обязан остаться прежним.
    const young = { ...base, year: 2018 }; // 8 лет → эко 2%
    const old = { ...base, year: 2008 }; // 18 лет → эко 20%
    expect(lineOf(young, "duty")).toBe(lineOf(old, "duty"));
    expect(lineOf(young, "vat")).toBe(lineOf(old, "vat"));
    expect(lineOf(old, "eco")).toBeGreaterThan(lineOf(young, "eco"));
  });

  it("акциз всегда нулевой", () => {
    for (const fuel of ["petrol", "diesel", "hybrid", "electric"] as const) {
      for (const year of [2026, 2020, 2005]) {
        expect(lineOf({ ...base, fuel, year }, "excise")).toBe(0);
      }
    }
  });

  describe("возрастные границы пошлины", () => {
    // currentYear 2026: 2024 → 2 года, 2023 → 3, 2020 → 6, 2019 → 7.
    const at = (year: number) => calculateArmenia({ ...base, year });

    // Сверяем код бракета, а не подпись: подпись переехала в словарь и
    // переводится, а проверять надо именно выбор ветки.
    it(`возраст ${AGE_NEW_BELOW - 1} — ещё новый, ${AGE_NEW_BELOW} — уже средний`, () => {
      expect(at(2024).meta.ageBand).toBe("new");
      expect(at(2023).meta.ageBand).toBe("mid");
    });

    it(`возраст ${AGE_OLD_FROM - 1} — ещё средний, ${AGE_OLD_FROM} — уже старый`, () => {
      expect(at(2020).meta.ageBand).toBe("mid");
      expect(at(2019).meta.ageBand).toBe("old");
    });

    it("бракеты «3–5» и «5–7» эталона — на самом деле один бракет", () => {
      // Именно поэтому у пошлины один перелом, а не два: эталон разбивает
      // середину надвое только ради своего эко-сбора.
      expect(lineOf({ ...base, year: 2022 }, "duty")).toBe(
        lineOf({ ...base, year: 2020 }, "duty"),
      );
    });
  });

  describe("пониженная ставка 12,5% для крупного бензина", () => {
    const newCar = { ...base, year: 2025 };

    it(`${LARGE_PETROL_CC_ABOVE} см³ — ещё ${NEW_DUTY_RATE * 100}%, ${LARGE_PETROL_CC_ABOVE + 1} — уже ${NEW_DUTY_RATE_LARGE_PETROL * 100}%`, () => {
      const value = Number(calculateArmenia(newCar).meta.customsValueAmd);
      expect(
        lineOf({ ...newCar, volumeCc: LARGE_PETROL_CC_ABOVE }, "duty"),
      ).toBe(Math.round(value * NEW_DUTY_RATE));
      expect(
        lineOf({ ...newCar, volumeCc: LARGE_PETROL_CC_ABOVE + 1 }, "duty"),
      ).toBe(Math.round(value * NEW_DUTY_RATE_LARGE_PETROL));
    });

    it("верхней границы у пониженной ставки нет", () => {
      const at3000 = lineOf({ ...newCar, volumeCc: 3000 }, "duty");
      const at5000 = lineOf({ ...newCar, volumeCc: 5000 }, "duty");
      expect(at5000).toBe(at3000);
    });

    it("дизель не получает снижения ни при каком объёме", () => {
      const value = Number(calculateArmenia(newCar).meta.customsValueAmd);
      for (const volumeCc of [2500, 2801, 3500, 5000]) {
        expect(
          lineOf({ ...newCar, fuel: "diesel", volumeCc }, "duty"),
        ).toBe(Math.round(value * NEW_DUTY_RATE));
      }
    });

    it("гибрид не получает снижения, хотя в остальном считается как бензин", () => {
      const value = Number(calculateArmenia(newCar).meta.customsValueAmd);
      expect(lineOf({ ...newCar, fuel: "hybrid", volumeCc: 3500 }, "duty")).toBe(
        Math.round(value * NEW_DUTY_RATE),
      );
    });
  });

  describe("границы объёма включительные сверху", () => {
    const mid = { ...base, year: 2022, price: 1000 }; // 4 года, минимум выигрывает
    const old = { ...base, year: 2016 }; // 10 лет

    it("бензин: 1500 в бракете «до 1500», 1501 — в следующем", () => {
      // Немонотонность тарифа: 0,40 €/см³ на ≤1500 и 0,36 на ≤1800,
      // поэтому на 1501 см³ пошлина ПАДАЕТ. Это не опечатка.
      expect(lineOf({ ...mid, volumeCc: 1501 }, "duty")).toBeLessThan(
        lineOf({ ...mid, volumeCc: 1500 }, "duty"),
      );
    });

    it("бензин, старые: 1000 и 1001 попадают в разные бракеты", () => {
      const at1000 = lineOf({ ...old, volumeCc: 1000 }, "duty");
      const at1001 = lineOf({ ...old, volumeCc: 1001 }, "duty");
      expect(at1000).toBe(Math.round(1.4 * 1000 * base.amdPerEur));
      expect(at1001).toBe(Math.round(1.5 * 1001 * base.amdPerEur));
    });

    it("дизель, старые: граница 2500 включительна", () => {
      expect(lineOf({ ...old, fuel: "diesel", volumeCc: 2500 }, "duty")).toBe(
        Math.round(2.2 * 2500 * base.amdPerEur),
      );
      expect(lineOf({ ...old, fuel: "diesel", volumeCc: 2501 }, "duty")).toBe(
        Math.round(3.2 * 2501 * base.amdPerEur),
      );
    });
  });

  describe("средний бракет — max(процент, минимум по объёму)", () => {
    const mid = { ...base, year: 2022 };

    it("на дорогом лоте выигрывает процент", () => {
      const r = calculateArmenia({ ...mid, price: 40000 });
      const value = Number(r.meta.customsValueAmd);
      expect(lineOf({ ...mid, price: 40000 }, "duty")).toBe(
        Math.round(value * 0.2),
      );
    });

    it("на дешёвом лоте выигрывает минимум по объёму", () => {
      const cheap = { ...mid, price: 500 };
      const value = Number(calculateArmenia(cheap).meta.customsValueAmd);
      const byVolume = Math.round(0.44 * 1998 * base.amdPerEur);
      expect(lineOf(cheap, "duty")).toBe(byVolume);
      expect(byVolume).toBeGreaterThan(value * 0.2);
    });
  });

  describe("экологический налог", () => {
    const ecoAt = (year: number) =>
      lineOf({ ...base, year, volumeCc: 1998 }, "eco");

    it("границы 5 / 10 / 15 лет, все включительные сверху", () => {
      expect(ecoRate(5)).toBe(0);
      expect(ecoRate(6)).toBe(0.02);
      expect(ecoRate(10)).toBe(0.02);
      expect(ecoRate(11)).toBe(0.1);
      expect(ecoRate(15)).toBe(0.1);
      expect(ecoRate(16)).toBe(0.2);
    });

    it("до 5 лет включительно налога нет", () => {
      expect(ecoAt(2021)).toBe(0); // 5 лет
      expect(ecoAt(2020)).toBeGreaterThan(0); // 6 лет
    });

    it("растёт ступенями, а не плавно", () => {
      const value = Number(calculateArmenia(base).meta.customsValueAmd);
      expect(ecoAt(2020)).toBe(Math.round(value * 0.02)); // 6 лет
      expect(ecoAt(2015)).toBe(Math.round(value * 0.1)); // 11 лет
      expect(ecoAt(2010)).toBe(Math.round(value * 0.2)); // 16 лет
    });

    it("электромобили и гибриды освобождены полностью", () => {
      for (const fuel of ["electric", "hybrid"] as const) {
        for (const year of [2020, 2010, 2000]) {
          expect(lineOf({ ...base, fuel, year }, "eco")).toBe(0);
        }
      }
    });
  });

  describe("электромобиль", () => {
    const ev: ArmeniaInput = { ...base, fuel: "electric" };

    it("пошлина, НДС и эконалог нулевые при любом возрасте", () => {
      for (const year of [2026, 2020, 2005]) {
        const r = calculateArmenia({ ...ev, year });
        expect(r.total.amount).toBe(0);
      }
    });

    it("объём двигателя не утаскивает электромобиль в бракет по объёму", () => {
      // Поле объёма в форме прячется, но прежнее значение остаётся в
      // состоянии. Чинить это надо в ядре, а не в интерфейсе.
      const dirty = calculateArmenia({ ...ev, volumeCc: 3500, year: 2010 });
      expect(dirty.total.amount).toBe(0);
      expect(dirty.meta.volumeCc).toBe("0");
    });
  });

  it("курс евро не влияет на расчёт машины младше 3 лет", () => {
    const newCar = { ...base, year: 2025 };
    const a = calculateArmenia({ ...newCar, amdPerEur: 400 });
    const b = calculateArmenia({ ...newCar, amdPerEur: 450 });
    expect(a.total.amount).toBe(b.total.amount);
  });

  it("гибрид считается как бензин во всех бракетах, кроме нового крупного", () => {
    for (const year of [2022, 2016]) {
      for (const volumeCc of [1400, 1998, 3500]) {
        expect(lineOf({ ...base, year, volumeCc, fuel: "hybrid" }, "duty")).toBe(
          lineOf({ ...base, year, volumeCc, fuel: "petrol" }, "duty"),
        );
      }
    }
  });
});
