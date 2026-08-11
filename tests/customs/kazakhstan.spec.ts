import { describe, expect, it } from "vitest";
import golden from "./golden/kazakhstan.golden.json";
import {
  calculateKazakhstan,
  type KazakhstanFuel,
  type KazakhstanInput,
} from "@/lib/customs/core/countries/kazakhstan";

/**
 * Сверка Казахстана. Эталон здесь устроен иначе, чем у остальных стран: он снят
 * не с чужого калькулятора, а с опубликованных ставок, и ожидания в нём
 * посчитаны РУКОЙ — см. шапку kazakhstan.golden.json.
 *
 * Отсюда два следствия. Допуск нулевой: все ставки либо проценты, либо кратные
 * МРП. И курсы круглые: 20 000 $ × 500 = 10 000 000 ₸, чтобы каждую строку
 * можно было проверить глазами, не запуская ядро.
 */

interface GoldenCase {
  id: string;
  car: string;
  probes: string;
  math: string;
  in: {
    price: number;
    volumeCc: number;
    year: number;
    month: number;
    fuel: string;
  };
  expected: Record<string, number | null>;
}

const cases = golden.cases as GoldenCase[];
const { kztPerUsd, kztPerEur } = golden.fx;
const tol = golden.tolerance.exactKzt;

/** Строки чека, которые эталон утверждает. `additional` — наша оценка, её нет. */
const CHECKED_LINES = [
  "customsFee",
  "duty",
  "exciseEngine",
  "exciseLuxury",
  "vat",
  "registration",
  "registrationDocs",
  "recyclingFee",
] as const;

function toInput(c: GoldenCase): KazakhstanInput {
  return {
    price: c.in.price,
    priceCurrency: "USD",
    kztPerUnit: kztPerUsd,
    kztPerEur,
    volumeCc: c.in.volumeCc,
    year: c.in.year,
    month: c.in.month,
    currentYear: golden.currentYear,
    currentMonth: golden.currentMonth,
    fuel: c.in.fuel as KazakhstanFuel,
  };
}

describe(`Казахстан — сверка со ставками (${golden.sourceName}, ${golden.takenAt})`, () => {
  for (const c of cases) {
    it(`${c.id} · ${c.car} · ${c.probes}`, () => {
      const result = calculateKazakhstan(toInput(c));
      const byId = new Map(result.lines.map((l) => [l.id, l.amount]));

      for (const id of CHECKED_LINES) {
        const expected = c.expected[id];
        if (expected === null || expected === undefined) continue;
        const actual = byId.get(id);
        expect(actual, `в чеке нет строки "${id}"`).toBeDefined();
        expect(
          Math.abs(actual! - expected),
          `строка "${id}": ядро ${actual} ₸, эталон ${expected} ₸ (${c.math})`,
        ).toBeLessThanOrEqual(tol);
      }

      // Итог сверяется отдельно: он ловит появление или пропажу целой строки,
      // чего построчная проверка не заметит.
      if (c.expected.total !== null && c.expected.total !== undefined) {
        expect(
          result.total.amount,
          `итог: ядро ${result.total.amount} ₸, эталон ${c.expected.total} ₸`,
        ).toBe(c.expected.total);
      }
      expect(result.total.currency).toBe("KZT");
    });
  }

  it("эталон покрывает каждую строку чека, кроме нашей собственной оценки", () => {
    // Иначе новая строка появится в ядре и не будет проверена ничем.
    const sample = calculateKazakhstan(toInput(cases[0]));
    const asserted = new Set<string>([...CHECKED_LINES, "additional"]);
    const unchecked = sample.lines
      .map((l) => l.id)
      .filter((id) => !asserted.has(id));
    expect(
      unchecked,
      `строка ${unchecked.join(", ")} не утверждается эталоном`,
    ).toEqual([]);
  });

  it("итог эталона равен сумме его собственных строк плюс сопутствующие расходы", () => {
    // Проверка самого эталона, а не ядра: если total в JSON разъедется со
    // строками, тест выше начнёт врать в обе стороны сразу.
    const additional = 400_000;
    for (const c of cases) {
      if (c.expected.total === null || c.expected.total === undefined) continue;
      const sum =
        CHECKED_LINES.reduce((acc, id) => acc + (c.expected[id] ?? 0), 0) +
        additional;
      expect(sum, `у кейса ${c.id} total не сходится со строками`).toBe(
        c.expected.total,
      );
    }
  });
});
