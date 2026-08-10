import { describe, expect, it } from "vitest";
import golden from "./golden/kyrgyzstan.golden.json";
import {
  calculateKyrgyzstan,
  type KyrgyzstanFuel,
  type KyrgyzstanInput,
  type KyrgyzstanMode,
} from "@/lib/customs/core/countries/kyrgyzstan";
import {
  COMMERCIAL_AGE_MID_MAX,
  COMMERCIAL_AGE_NEW_MAX,
  CUSTOMS_FEE_RATE,
  ELECTRIC_DUTY_RATE,
  ELECTRIC_VAT_FREE_AGE_MAX,
  PERSONAL_AGE_MID_MAX,
  PERSONAL_AGE_NEW_MAX,
  REGISTRATION_FEE_RATE,
  VAT_RATE,
} from "@/lib/customs/core/countries/kyrgyzstan/tables";

/** Ключи разбивки совпадают с id строк чека в ядре. */
type BreakdownKey = "duty" | "vat" | "fee" | "excise";

interface GoldenCase {
  id: string;
  case: string;
  probes: string;
  /**
   * Статьи, где ядро расходится с эталоном осознанно. Остальные статьи
   * кейса сверяются строго: прятать весь кейс из-за одной строки нельзя,
   * иначе выпадает проверенная часть.
   */
  divergentLines?: Partial<Record<BreakdownKey | "total", string>>;
  in: {
    mode: string;
    fuel: string;
    volumeCc: number;
    year: number;
    priceEur: number;
  };
  expected: {
    eur: Record<BreakdownKey | "total", number | null>;
    kgs: Record<BreakdownKey | "total", number | null>;
  };
}

const cases = golden.cases as GoldenCase[];
const tolerance = golden.tolerance;
const currentYear = Number(golden.takenAt.slice(0, 4));

function toInput(c: GoldenCase): KyrgyzstanInput {
  return {
    mode: c.in.mode as KyrgyzstanMode,
    fuel: c.in.fuel as KyrgyzstanFuel,
    volumeCc: c.in.volumeCc,
    year: c.in.year,
    currentYear,
    // Эталон снят в евро, поэтому налоговая часть от курса не зависит вовсе.
    price: c.in.priceEur,
    freight: 0,
    eurPerUnit: 1,
    kgsPerEur: golden.fx.kgsPerEur,
    priceCurrency: golden.fx.unit,
  };
}

/** Евровые суммы ядро кладёт в meta: строки чека номинированы в сомах. */
const EUR_META_KEY: Record<BreakdownKey | "total", string | null> = {
  duty: "dutyEur",
  vat: "vatEur",
  fee: "feeEur",
  excise: null,
  total: "totalEur",
};

const divergentCount = cases.reduce(
  (sum, c) => sum + Object.keys(c.divergentLines ?? {}).length,
  0,
);

describe("Кыргызстан — сверка с эталоном", () => {
  it(`эталон: ${cases.length} кейсов, ${divergentCount} строк помечены расхождением`, () => {
    expect(cases.length).toBeGreaterThan(0);
    expect(cases.some((c) => c.in.mode === "personal")).toBe(true);
    expect(cases.some((c) => c.in.mode === "commercial")).toBe(true);
  });

  for (const c of cases) {
    const diverging = c.divergentLines ?? {};
    const asserted = (["duty", "vat", "fee", "excise", "total"] as const).filter(
      (key) => c.expected.eur[key] !== null && !diverging[key],
    );

    it(`${c.id} · ${c.case} · ${c.probes}`, () => {
      const result = calculateKyrgyzstan(toInput(c));
      const kgsById = new Map(result.lines.map((l) => [l.id, l.amount]));

      for (const key of asserted) {
        // Сначала евро — там считает сам закон, и курс в сверку не вмешивается.
        const metaKey = EUR_META_KEY[key];
        if (metaKey) {
          const actualEur = Number(result.meta[metaKey]);
          expect(
            Math.abs(actualEur - c.expected.eur[key]!),
            `${key} в евро: ядро ${actualEur}, эталон ${c.expected.eur[key]}`,
          ).toBeLessThanOrEqual(tolerance.eur);
        }

        const actualKgs =
          key === "total" ? result.total.amount : kgsById.get(key);
        expect(actualKgs, `в чеке нет строки "${key}"`).toBeDefined();
        expect(
          Math.abs(actualKgs! - c.expected.kgs[key]!),
          `${key} в сомах: ядро ${actualKgs}, эталон ${c.expected.kgs[key]}`,
        ).toBeLessThanOrEqual(tolerance.kgs);
      }

      expect(result.total.currency).toBe("KGS");
    });

    // Расхождения показываем отдельными skipped-строками, а не прячем:
    // забытый кейс и осознанное расхождение должны выглядеть по-разному.
    for (const [key, reason] of Object.entries(diverging)) {
      it.skip(`${c.id} · строка "${key}" расходится с эталоном: ${reason}`, () => {});
    }
  }
});

describe("Кыргызстан — инварианты ядра", () => {
  const base: KyrgyzstanInput = {
    mode: "personal",
    fuel: "petrol",
    volumeCc: 1998,
    year: 2021,
    currentYear: 2026,
    price: 10000,
    freight: 0,
    eurPerUnit: 1,
    kgsPerEur: 100.77,
    priceCurrency: "EUR",
  };

  const lineOf = (input: KyrgyzstanInput, id: string) =>
    calculateKyrgyzstan(input).lines.find((l) => l.id === id)!.amount;
  const eurOf = (input: KyrgyzstanInput, key: string) =>
    Number(calculateKyrgyzstan(input).meta[key]);

  it("ядро детерминировано и не зависит от текущей даты", () => {
    expect(calculateKyrgyzstan(base)).toEqual(calculateKyrgyzstan(base));
  });

  it("итог равен сумме строк чека", () => {
    for (const mode of ["personal", "commercial"] as const) {
      const r = calculateKyrgyzstan({ ...base, mode });
      const sum = r.lines.reduce((acc, line) => acc + line.amount, 0);
      expect(sum).toBeCloseTo(r.total.amount, 6);
    }
  });

  it("акциз нулевой при любом наборе параметров", () => {
    for (const mode of ["personal", "commercial"] as const) {
      for (const fuel of [
        "petrol",
        "diesel",
        "seriesHybrid",
        "electric",
      ] as const) {
        expect(lineOf({ ...base, mode, fuel }, "excise")).toBe(0);
      }
    }
  });

  it("физлицо не платит НДС ни при каком топливе и возрасте", () => {
    for (const fuel of ["petrol", "diesel", "seriesHybrid", "electric"] as const) {
      for (const year of [2026, 2023, 2020, 2010]) {
        expect(eurOf({ ...base, mode: "personal", fuel, year }, "vatEur")).toBe(0);
      }
    }
  });

  it("в личном режиме бензин и дизель считаются одинаково", () => {
    // ЕЭК №107 разделения по топливу не знает: у эталона в этом режиме
    // поле типа двигателя вообще затирается.
    for (const year of [2024, 2022, 2019]) {
      const petrol = calculateKyrgyzstan({ ...base, year, fuel: "petrol" });
      const diesel = calculateKyrgyzstan({ ...base, year, fuel: "diesel" });
      expect(diesel.total.amount).toBe(petrol.total.amount);
    }
  });

  it("в общем порядке бензин и дизель расходятся", () => {
    // Иначе дизельная таблица была бы подключена, но не использовалась.
    // 1700 см³: у бензина это бракет «до 1800» (1.6 €/см³), у дизеля —
    // «до 2500» (2.2 €/см³), потому что границы бракетов у них разные.
    const petrol = {
      ...base,
      mode: "commercial" as const,
      volumeCc: 1_700,
      year: 2016,
      price: 3_000,
    };
    const diesel = { ...petrol, fuel: "diesel" as const };
    expect(eurOf(petrol, "dutyEur")).toBeCloseTo(1.6 * 1_700, 6);
    expect(eurOf(diesel, "dutyEur")).toBeCloseTo(2.2 * 1_700, 6);
  });

  it("последовательный гибрид считается ровно как электромобиль", () => {
    for (const mode of ["personal", "commercial"] as const) {
      const ev = calculateKyrgyzstan({ ...base, mode, fuel: "electric" });
      const reev = calculateKyrgyzstan({ ...base, mode, fuel: "seriesHybrid" });
      expect(reev.total.amount).toBe(ev.total.amount);
      expect(reev.meta.dutyEur).toBe(ev.meta.dutyEur);
    }
  });

  it("у электромобиля объём двигателя игнорируется полностью", () => {
    // Форма прячет поле объёма, но прежнее значение остаётся в состоянии.
    // Без обнуления в ядре электромобиль утащило бы в бракет по объёму.
    for (const fuel of ["electric", "seriesHybrid"] as const) {
      const withVolume = calculateKyrgyzstan({ ...base, fuel, volumeCc: 3500 });
      const withoutVolume = calculateKyrgyzstan({ ...base, fuel, volumeCc: 0 });
      expect(withVolume).toEqual(withoutVolume);
      expect(Number(withVolume.meta.volumeCc)).toBe(0);
    }
  });

  it("электромобилю начисляется ставка по исчерпанной квоте, а не ноль", () => {
    for (const mode of ["personal", "commercial"] as const) {
      const r = calculateKyrgyzstan({ ...base, mode, fuel: "electric" });
      expect(Number(r.meta.dutyEur)).toBeCloseTo(10000 * ELECTRIC_DUTY_RATE, 6);
    }
  });

  it("границы возраста в личном режиме: 3/4 и 5/6", () => {
    const at = (year: number) =>
      eurOf({ ...base, mode: "personal", year: 2026 - year }, "dutyEur");
    // Внутри бракета сумма не меняется, на границе — меняется.
    expect(at(PERSONAL_AGE_NEW_MAX)).not.toBe(at(PERSONAL_AGE_NEW_MAX + 1));
    expect(at(PERSONAL_AGE_NEW_MAX + 1)).toBe(at(PERSONAL_AGE_MID_MAX));
    expect(at(PERSONAL_AGE_MID_MAX)).not.toBe(at(PERSONAL_AGE_MID_MAX + 1));
    expect(at(PERSONAL_AGE_MID_MAX + 1)).toBe(at(PERSONAL_AGE_MID_MAX + 5));
  });

  it("границы возраста в общем порядке: 3/4 и 7/8", () => {
    const at = (year: number) =>
      eurOf({ ...base, mode: "commercial", year: 2026 - year }, "dutyEur");
    expect(at(COMMERCIAL_AGE_NEW_MAX)).not.toBe(at(COMMERCIAL_AGE_NEW_MAX + 1));
    expect(at(COMMERCIAL_AGE_NEW_MAX + 1)).toBe(at(COMMERCIAL_AGE_MID_MAX));
    expect(at(COMMERCIAL_AGE_MID_MAX)).not.toBe(at(COMMERCIAL_AGE_MID_MAX + 1));
  });

  it("верхняя граница бракета по стоимости включительная", () => {
    // 8 500 € — ещё 54%, 8 501 € — уже 48% с минимумом 3.5 €/см³.
    const at = (price: number) =>
      eurOf({ ...base, year: 2025, volumeCc: 1, price }, "dutyEur");
    expect(at(8_500)).toBeCloseTo(8_500 * 0.54, 6);
    expect(at(8_501)).toBeCloseTo(8_501 * 0.48, 6);
  });

  it("верхняя граница бракета по объёму включительная", () => {
    // 1800 см³ — ещё 2.5 €/см³, 1801 см³ — уже 2.7.
    const at = (volumeCc: number) =>
      eurOf({ ...base, year: 2022, volumeCc }, "dutyEur");
    expect(at(1_800)).toBeCloseTo(1_800 * 2.5, 6);
    expect(at(1_801)).toBeCloseTo(1_801 * 2.7, 6);
  });

  it("пошлина для авто до 3 лет — не меньше минимума по объёму", () => {
    // Дешёвый лот с большим мотором: 54% от 2 000 = 1 080 против 2.5 × 3000.
    const cheap = { ...base, year: 2025, volumeCc: 3_000, price: 2_000 };
    expect(eurOf(cheap, "dutyEur")).toBeCloseTo(2.5 * 3_000, 6);
  });

  it("в общем порядке у авто до 3 лет минимума по объёму нет", () => {
    // Проверено эталоном: cost 1 €, 3500 см³, 2024 г.в. → пошлина 0,15 €.
    const cheap = {
      ...base,
      mode: "commercial" as const,
      year: 2025,
      volumeCc: 3_500,
      price: 100,
    };
    expect(eurOf(cheap, "dutyEur")).toBeCloseTo(15, 6);
  });

  it("НДС юрлица берётся от стоимости вместе с пошлиной", () => {
    // Ошибка legacy: там НДС считался от одной только цены.
    const input = { ...base, mode: "commercial" as const, year: 2010 };
    const r = calculateKyrgyzstan(input);
    const expected =
      (Number(r.meta.customsValueEur) + Number(r.meta.dutyEur)) * VAT_RATE;
    expect(Number(r.meta.vatEur)).toBeCloseTo(expected, 2);
  });

  it("освобождение юрлица от НДС на электромобиль включает возраст ровно 5", () => {
    const at = (age: number) =>
      eurOf(
        {
          ...base,
          mode: "commercial",
          fuel: "electric",
          year: 2026 - age,
        },
        "vatEur",
      );
    expect(at(ELECTRIC_VAT_FREE_AGE_MAX)).toBe(0);
    expect(at(ELECTRIC_VAT_FREE_AGE_MAX + 1)).toBeGreaterThan(0);
  });

  it("сбор за оформление — 0.4% без минимума и без потолка", () => {
    for (const price of [100, 1_000, 100_000, 1_000_000]) {
      expect(eurOf({ ...base, price }, "feeEur")).toBeCloseTo(
        price * CUSTOMS_FEE_RATE,
        2,
      );
    }
  });

  it("фрахт входит в таможенную стоимость наравне с ценой", () => {
    const split = calculateKyrgyzstan({ ...base, price: 8_000, freight: 2_000 });
    const whole = calculateKyrgyzstan({ ...base, price: 10_000, freight: 0 });
    expect(split.total.amount).toBe(whole.total.amount);
  });

  it("регистрация лежит под итогом и в сумму не входит", () => {
    const r = calculateKyrgyzstan(base);
    const registration = r.extra!.find((l) => l.id === "registration")!;
    expect(registration.amount).toBeGreaterThan(0);
    const sum = r.lines.reduce((acc, line) => acc + line.amount, 0);
    expect(sum).toBeCloseTo(r.total.amount, 6);
    expect(r.lines.some((l) => l.id === "registration")).toBe(false);
  });

  it("регистрация считается от таможенной стоимости", () => {
    const r = calculateKyrgyzstan(base);
    const registration = r.extra!.find((l) => l.id === "registration")!;
    expect(registration.amount).toBeCloseTo(
      10_000 * REGISTRATION_FEE_RATE * base.kgsPerEur,
      2,
    );
  });

  it("у юрлица строки регистрации нет", () => {
    const r = calculateKyrgyzstan({ ...base, mode: "commercial" });
    expect(r.extra ?? []).toHaveLength(0);
  });

  it("курс сома не влияет на евровую часть расчёта", () => {
    const a = calculateKyrgyzstan({ ...base, kgsPerEur: 100.77 });
    const b = calculateKyrgyzstan({ ...base, kgsPerEur: 120 });
    expect(a.meta.dutyEur).toBe(b.meta.dutyEur);
    expect(a.meta.totalEur).toBe(b.meta.totalEur);
    expect(b.total.amount).toBeGreaterThan(a.total.amount);
  });

  it("курс до евро влияет на всё, что считается от стоимости", () => {
    const usd = calculateKyrgyzstan({
      ...base,
      priceCurrency: "USD",
      eurPerUnit: 0.865939,
    });
    expect(Number(usd.meta.customsValueEur)).toBeCloseTo(8_659.39, 2);
  });

  it("отрицательные значения формы не уводят расчёт в минус", () => {
    const r = calculateKyrgyzstan({ ...base, price: -5_000, freight: -100 });
    expect(Number(r.meta.customsValueEur)).toBe(0);
    expect(r.total.amount).toBeGreaterThanOrEqual(0);
  });

  it("нулевой курс не роняет расчёт и не даёт бесконечностей", () => {
    const r = calculateKyrgyzstan({ ...base, eurPerUnit: 0, kgsPerEur: 0 });
    expect(Number.isFinite(r.total.amount)).toBe(true);
    for (const line of r.lines) expect(Number.isFinite(line.amount)).toBe(true);
  });
});
