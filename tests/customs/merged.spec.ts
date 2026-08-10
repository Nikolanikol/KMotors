import { describe, expect, it } from "vitest";
import {
  calculateRussia,
  russiaDefaults,
  type RussiaInput,
} from "@/lib/customs/core/countries/russia";
import {
  AGE_MID_BELOW,
  AGE_NEW_BELOW,
  RECYCLING_BASE_RUB,
  RECYCLING_PRIVILEGED_CC_MAX,
  RECYCLING_PRIVILEGED_HP_MAX,
  customsFeeRub,
} from "@/lib/customs/core/countries/russia/tables";
import {
  calculateKazakhstan,
  kazakhstanDefaults,
  type KazakhstanInput,
} from "@/lib/customs/core/countries/kazakhstan";
import {
  AGE_OLD_ABOVE_MONTHS,
  EXCISE_KZT_PER_CC,
  EXCISE_VOLUME_ABOVE_CC,
  LUXURY_THRESHOLD_MRP,
  MRP_KZT,
  registrationMrp,
} from "@/lib/customs/core/countries/kazakhstan/tables";
import {
  calculateUzbekistan,
  uzbekistanDefaults,
  type UzbekistanInput,
} from "@/lib/customs/core/countries/uzbekistan";
import {
  AGE_USED_ABOVE_YEARS,
  BRV_UZS,
  DUTY_RATE as UZ_DUTY_RATE,
  VAT_RATE as UZ_VAT_RATE,
  dutyUsdPerCc,
} from "@/lib/customs/core/countries/uzbekistan/tables";

/**
 * Инварианты трёх ядер, перенесённых из прежнего калькулятора сайта.
 *
 * Golden-кейсов у них ещё нет: эталон снимается отдельно, по стране за раз.
 * Эти проверки другого сорта — они не доказывают, что расчёт соответствует
 * закону, а фиксируют устройство ядра: чистоту, границы бракетов, состав
 * чека. Именно они ловят регресс при будущих правках ставок.
 */

const lineOf = (result: { lines: { id: string; amount: number }[] }, id: string) =>
  result.lines.find((line) => line.id === id)?.amount ?? 0;

describe("Россия — инварианты ядра", () => {
  const base: RussiaInput = { ...russiaDefaults, currentYear: 2026, currentMonth: 6 };

  it("ядро детерминировано и не зависит от текущей даты", () => {
    const a = calculateRussia(base);
    const b = calculateRussia({ ...base });
    expect(a.total.amount).toBe(b.total.amount);
    // Расчётный момент приходит извне, а не из new Date(). Сдвиг ВНУТРИ одного
    // бракета сумму менять не обязан, а вот переход через границу — обязан:
    // 2021 год при расчёте на 2026-й это «старше 5», а на 2023-й — «до 3».
    const sameBand = calculateRussia({ ...base, currentYear: 2030 });
    expect(sameBand.total.amount).toBe(a.total.amount);
    const otherBand = calculateRussia({ ...base, currentYear: 2023 });
    expect(otherBand.meta.ageBand).toBe("new");
    expect(otherBand.total.amount).not.toBe(a.total.amount);
  });

  it("итог равен сумме строк чека", () => {
    const r = calculateRussia(base);
    const sum = r.lines.reduce((acc, line) => acc + line.amount, 0);
    expect(r.total.amount).toBe(sum);
  });

  it("у электромобиля объём двигателя обнуляется в ядре, а не в форме", () => {
    // Поле объёма прячется, но прежнее значение остаётся в состоянии формы.
    const dirty = calculateRussia({ ...base, fuel: "electric", volumeCc: 3500 });
    expect(dirty.meta.volumeCc).toBe("0");
  });

  it("возрастные бракеты пошлины переключаются на 3 и 5 годах", () => {
    const at = (year: number) =>
      calculateRussia({ ...base, year, month: 6 }).meta.ageBand;
    expect(at(2026 - AGE_NEW_BELOW + 1)).toBe("new");
    expect(at(2026 - AGE_NEW_BELOW)).toBe("mid");
    expect(at(2026 - AGE_MID_BELOW + 1)).toBe("mid");
    expect(at(2026 - AGE_MID_BELOW)).toBe("old");
  });

  it("месяц выпуска влияет на бракет — возраст считается не по одному году", () => {
    const justUnder = calculateRussia({ ...base, year: 2023, month: 7 });
    const justOver = calculateRussia({ ...base, year: 2023, month: 5 });
    expect(justUnder.meta.ageBand).toBe("new");
    expect(justOver.meta.ageBand).toBe("mid");
  });

  it("льготный коэффициент утильсбора требует ОБОИХ условий", () => {
    const privileged = calculateRussia({
      ...base,
      volumeCc: RECYCLING_PRIVILEGED_CC_MAX,
      horsePower: RECYCLING_PRIVILEGED_HP_MAX,
    });
    // 0.26 × 20 000 = 5 200 ₽ для авто старше трёх лет.
    expect(lineOf(privileged, "recyclingFee")).toBe(RECYCLING_BASE_RUB * 0.26);

    const tooPowerful = calculateRussia({
      ...base,
      volumeCc: RECYCLING_PRIVILEGED_CC_MAX,
      horsePower: RECYCLING_PRIVILEGED_HP_MAX + 1,
    });
    expect(lineOf(tooPowerful, "recyclingFee")).toBeGreaterThan(
      lineOf(privileged, "recyclingFee"),
    );
  });

  it("без мощности утильсбор помечается прикидкой", () => {
    const noHp = calculateRussia({ ...base, horsePower: 0 });
    expect(noHp.meta.recyclingApprox).toBe("true");
    expect(calculateRussia(base).meta.recyclingApprox).toBe("false");
  });

  it("таможенный сбор растёт ступенями по стоимости", () => {
    expect(customsFeeRub(200_000)).toBe(1_231);
    expect(customsFeeRub(200_001)).toBe(2_462);
    expect(customsFeeRub(999_999_999)).toBe(73_860);
  });

  it("нулевые курсы не роняют ядро и не дают NaN", () => {
    const r = calculateRussia({ ...base, rubPerUnit: 0, rubPerEur: 0 });
    expect(Number.isFinite(r.total.amount)).toBe(true);
  });
});

describe("Казахстан — инварианты ядра", () => {
  const base: KazakhstanInput = {
    ...kazakhstanDefaults,
    currentYear: 2026,
    currentMonth: 6,
  };

  it("итог равен сумме строк чека", () => {
    const r = calculateKazakhstan(base);
    const sum = r.lines.reduce((acc, line) => acc + line.amount, 0);
    expect(r.total.amount).toBe(sum);
  });

  it("возраст считается в ПОЛНЫХ месяцах, граница 24 включительная", () => {
    expect(registrationMrp(24)).toBe(0.25);
    expect(registrationMrp(25)).toBe(50);
    expect(registrationMrp(37)).toBe(500);
  });

  it("один месяц на границе меняет регистрационный сбор в 200 раз", () => {
    const under = calculateKazakhstan({ ...base, year: 2024, month: 6 });
    const over = calculateKazakhstan({ ...base, year: 2024, month: 5 });
    expect(lineOf(under, "registration")).toBe(Math.round(0.25 * MRP_KZT));
    expect(lineOf(over, "registration")).toBe(50 * MRP_KZT);
  });

  it("акциз по объёму берётся со ВСЕГО объёма, а не с превышения", () => {
    const over = calculateKazakhstan({
      ...base,
      volumeCc: EXCISE_VOLUME_ABOVE_CC + 1,
    });
    expect(lineOf(over, "exciseEngine")).toBe(
      (EXCISE_VOLUME_ABOVE_CC + 1) * EXCISE_KZT_PER_CC,
    );
    const at = calculateKazakhstan({ ...base, volumeCc: EXCISE_VOLUME_ABOVE_CC });
    expect(lineOf(at, "exciseEngine")).toBe(0);
  });

  it("порог роскоши включается строго выше значения", () => {
    const threshold = LUXURY_THRESHOLD_MRP * MRP_KZT;
    const at = calculateKazakhstan({ ...base, price: threshold, kztPerUnit: 1 });
    const above = calculateKazakhstan({
      ...base,
      price: threshold + 1,
      kztPerUnit: 1,
    });
    expect(at.meta.luxury).toBe("false");
    expect(above.meta.luxury).toBe("true");
  });

  it("электромобиль не платит пошлину и утильсбор, но платит НДС", () => {
    const ev = calculateKazakhstan({ ...base, fuel: "electric" });
    expect(lineOf(ev, "duty")).toBe(0);
    expect(lineOf(ev, "recyclingFee")).toBe(0);
    expect(lineOf(ev, "vat")).toBeGreaterThan(0);
  });

  it("минимум по объёму включается только старше семи лет", () => {
    const young = calculateKazakhstan({ ...base, year: 2022, month: 6 });
    const old = calculateKazakhstan({ ...base, year: 2018, month: 5 });
    expect(young.meta.ageBand).toBe("new");
    expect(old.meta.ageBand).toBe("old");
    expect(AGE_OLD_ABOVE_MONTHS).toBe(84);
  });
});

describe("Узбекистан — инварианты ядра", () => {
  const base: UzbekistanInput = {
    ...uzbekistanDefaults,
    currentYear: 2026,
    currentMonth: 6,
  };

  it("итог равен сумме строк чека", () => {
    const r = calculateUzbekistan(base);
    const sum = r.lines.reduce((acc, line) => acc + line.amount, 0);
    expect(r.total.amount).toBe(sum);
  });

  it("пошлина — процент плюс доплата за см³, и доплата есть при любом объёме", () => {
    const input = { ...base, price: 10_000, usdPerUnit: 1, volumeCc: 900 };
    const r = calculateUzbekistan(input);
    const expectedUsd = 10_000 * UZ_DUTY_RATE + 900 * dutyUsdPerCc(900);
    expect(Number(r.meta.dutyUsd)).toBe(Math.round(expectedUsd));
    // Льгота малолитражкам отменена: доплата ненулевая и на 900 см³.
    expect(dutyUsdPerCc(900)).toBeGreaterThan(0);
  });

  it("база НДС — стоимость вместе с пошлиной, без утильсбора и сбора", () => {
    const r = calculateUzbekistan(base);
    const expected = Math.round(
      (Number(r.meta.priceUzs) + Number(r.meta.dutyUzs)) * UZ_VAT_RATE,
    );
    expect(lineOf(r, "vat")).toBe(expected);
  });

  it("электромобиль не платит ни пошлину, ни утильсбор", () => {
    const ev = calculateUzbekistan({ ...base, fuel: "electric" });
    expect(lineOf(ev, "duty")).toBe(0);
    expect(lineOf(ev, "recyclingFee")).toBe(0);
  });

  it("утильсбор кратен БРВ", () => {
    const r = calculateUzbekistan(base);
    expect(lineOf(r, "recyclingFee") % BRV_UZS).toBe(0);
  });

  it("старше года помечается заградительным флагом", () => {
    const fresh = calculateUzbekistan({ ...base, year: 2026, month: 1 });
    const used = calculateUzbekistan({ ...base, year: 2024, month: 1 });
    expect(fresh.meta.ageBand).toBe("new");
    expect(used.meta.ageBand).toBe("used");
    expect(used.flags.some((f) => f.level === "critical")).toBe(true);
    expect(AGE_USED_ABOVE_YEARS).toBe(1);
  });
});
