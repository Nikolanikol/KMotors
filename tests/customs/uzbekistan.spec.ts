import { describe, expect, it } from "vitest";
import golden from "./golden/uzbekistan.golden.json";
import {
  calculateUzbekistan,
  type UzbekistanCondition,
  type UzbekistanInput,
} from "@/lib/customs/core/countries/uzbekistan";
import type { UzbekistanFuel } from "@/lib/customs/core/countries/uzbekistan/tables";

/**
 * Сверка Узбекистана. Эталон устроен как казахстанский: снят не с чужого
 * калькулятора, а с текстов актов, и ожидания в нём посчитаны РУКОЙ — см.
 * шапку uzbekistan.golden.json.
 *
 * Отсюда нулевой допуск и круглый курс 12 000 сум/$: 25 000 $ × 12 000 =
 * 300 000 000 сум, дальше 40% = 120 000 000, и каждую строку видно глазами.
 */

interface GoldenCase {
  id: string;
  car: string;
  probes: string;
  in: {
    price: number;
    freightUsd: number;
    volumeCc: number;
    year: number;
    month: number;
    fuel: string;
    condition: string;
  };
  band: string;
  ageMonths: number;
  math: string;
  expected: Record<string, number | null>;
}

const cases = golden.cases as GoldenCase[];
const { uzsPerUsd } = golden.fx;
const tol = golden.tolerance.exactUzs;

/** Все строки чека утверждаются эталоном: собственных оценок в нём нет. */
const CHECKED_LINES = [
  "customsFee",
  "duty",
  "vat",
  "recyclingFee",
  "registration",
] as const;

function toInput(c: GoldenCase): UzbekistanInput {
  return {
    price: c.in.price,
    priceCurrency: "USD",
    freightUsd: c.in.freightUsd,
    usdPerUnit: 1,
    uzsPerUsd,
    volumeCc: c.in.volumeCc,
    year: c.in.year,
    month: c.in.month,
    currentYear: golden.currentYear,
    currentMonth: golden.currentMonth,
    fuel: c.in.fuel as UzbekistanFuel,
    condition: c.in.condition as UzbekistanCondition,
  };
}

describe(`Узбекистан — сверка со ставками (${golden.takenAt})`, () => {
  for (const c of cases) {
    it(`${c.id} · ${c.car} · ${c.probes}`, () => {
      const result = calculateUzbekistan(toInput(c));
      const byId = new Map(result.lines.map((l) => [l.id, l.amount]));

      for (const id of CHECKED_LINES) {
        const expected = c.expected[id];
        if (expected === null || expected === undefined) continue;
        const actual = byId.get(id);
        expect(actual, `в чеке нет строки "${id}"`).toBeDefined();
        expect(
          Math.abs(actual! - expected),
          `строка "${id}": ядро ${actual}, эталон ${expected} (${c.math})`,
        ).toBeLessThanOrEqual(tol);
      }

      // Итог отдельно: он ловит появление или пропажу целой строки, чего
      // построчная проверка не заметит.
      expect(
        result.total.amount,
        `итог: ядро ${result.total.amount}, эталон ${c.expected.total}`,
      ).toBe(c.expected.total);
      expect(result.total.currency).toBe("UZS");
    });

    it(`${c.id} · бракет пошлины и возрастная ветка утильсбора`, () => {
      // ⚠️ Отдельная проверка, потому что суммы могут сойтись случайно, а
      // разъехавшийся бракет — это уже другая строка тарифа. Ровно здесь ядро
      // и ошибалось: статус машины выводился из возраста, и б/у машина
      // получала льготную ставку новой.
      const result = calculateUzbekistan(toInput(c));
      expect(result.meta.dutyBand).toBe(c.band);
      expect(Number(result.meta.ageMonths)).toBe(c.ageMonths);
      expect(result.meta.ageBand).toBe(c.ageMonths > 36 ? "over3" : "under3");
    });
  }

  it("эталон покрывает каждую строку чека", () => {
    // Иначе новая строка появится в ядре и не будет проверена ничем.
    const sample = calculateUzbekistan(toInput(cases[0]));
    const asserted = new Set<string>(CHECKED_LINES);
    const unchecked = sample.lines
      .map((l) => l.id)
      .filter((id) => !asserted.has(id));
    expect(
      unchecked,
      `строка ${unchecked.join(", ")} не утверждается эталоном`,
    ).toEqual([]);
  });

  it("итог эталона равен сумме его собственных строк", () => {
    // Проверка самого эталона, а не ядра: если total в JSON разъедется со
    // строками, тест выше начнёт врать в обе стороны сразу.
    for (const c of cases) {
      const sum = CHECKED_LINES.reduce((acc, id) => acc + (c.expected[id] ?? 0), 0);
      expect(sum, `у кейса ${c.id} total не сходится со строками`).toBe(
        c.expected.total,
      );
    }
  });

  it("эталон задевает каждую ветку ставок", () => {
    // Смысл набора кейсов — не количество, а покрытие: пропущенная ветка
    // означает, что её можно сломать, не уронив ни одного теста.
    const bands = new Set(cases.map((c) => c.band));
    expect(bands).toEqual(new Set(["used", "newUnder1", "newOver1"]));

    const fuels = new Set(cases.map((c) => c.in.fuel));
    expect(fuels).toEqual(
      new Set(["petrol", "diesel", "hybrid", "electric"]),
    );

    // Обе возрастные ветки утильсбора и обе его крайние скобки.
    expect(cases.some((c) => c.ageMonths <= 36)).toBe(true);
    expect(cases.some((c) => c.ageMonths > 36)).toBe(true);
    expect(cases.some((c) => c.in.volumeCc <= 1000)).toBe(true);
    expect(cases.some((c) => c.in.volumeCc > 3500)).toBe(true);

    // Фрахт входит в базу, а не в чек, поэтому его нельзя проверить строкой —
    // только кейсом, где он сдвигает пошлину, НДС и ступень сбора.
    expect(cases.some((c) => c.in.freightUsd > 0)).toBe(true);
  });

  it("фрахт попадает в таможенную стоимость, а отдельной строкой в чеке не появляется", () => {
    const withFreight = cases.find((c) => c.in.freightUsd > 0)!;
    const result = calculateUzbekistan(toInput(withFreight));

    expect(Number(result.meta.customsValueUsd)).toBe(
      withFreight.in.price + withFreight.in.freightUsd,
    );
    expect(result.lines.map((l) => l.id)).not.toContain("freight");

    // И контрольный: без фрахта тот же профиль стоит строго дешевле.
    const withoutFreight = calculateUzbekistan({
      ...toInput(withFreight),
      freightUsd: 0,
    });
    expect(result.total.amount).toBeGreaterThan(withoutFreight.total.amount);
  });
});
