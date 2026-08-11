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
  BRV_UZS,
  USED_DUTY,
  VAT_RATE as UZ_VAT_RATE,
  customsFeeBrv,
  dutyRate as uzDutyRate,
  recyclingBrv,
  registrationBrv,
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

  it("регистрационный сбор считается по КАЛЕНДАРНЫМ годам, ст. 830 НК РК", () => {
    // «включая год выпуска»: номер бракета равен currentYear − year.
    expect(registrationMrp(0)).toBe(0.25); // «до 2 лет»
    expect(registrationMrp(1)).toBe(0.25);
    expect(registrationMrp(2)).toBe(50); // «от 2 до 3 лет»
    expect(registrationMrp(3)).toBe(500); // «от 3 лет и выше»
  });

  it("месяц выпуска на регистрационный сбор не влияет", () => {
    // Проверка ровно на том, что раньше было сломано: декабрьская и январская
    // машина одного года стоят одинаково, хотя по месяцам между ними 11 мес.
    const january = calculateKazakhstan({ ...base, year: 2023, month: 1 });
    const december = calculateKazakhstan({ ...base, year: 2023, month: 12 });
    expect(lineOf(december, "registration")).toBe(
      lineOf(january, "registration"),
    );
    expect(lineOf(december, "registration")).toBe(500 * MRP_KZT);
  });

  it("смена года выпуска переводит сбор через все три ступени", () => {
    const at = (year: number) =>
      lineOf(calculateKazakhstan({ ...base, year }), "registration");
    expect(at(2025)).toBe(Math.round(0.25 * MRP_KZT));
    expect(at(2024)).toBe(50 * MRP_KZT);
    expect(at(2023)).toBe(500 * MRP_KZT);
  });

  it("параллельный гибрид считается ровно как бензиновый — по КАЖДОЙ строке", () => {
    // Golden проверяет это на одном профиле. Здесь — что совпадение полное, а
    // не случайное: ветка hybrid не должна отличаться от ice ничем.
    const ice = calculateKazakhstan({ ...base, fuel: "ice" });
    const hybrid = calculateKazakhstan({ ...base, fuel: "hybrid" });
    expect(hybrid.lines.map((l) => l.amount)).toEqual(
      ice.lines.map((l) => l.amount),
    );
  });

  it("EREV повторяет электромобиль во всём, кроме объёма двигателя", () => {
    const erev = calculateKazakhstan({ ...base, fuel: "erev", volumeCc: 1500 });
    const electric = calculateKazakhstan({ ...base, fuel: "electric" });
    const lineOfId = (r: typeof erev, id: string) =>
      r.lines.find((l) => l.id === id)!.amount;
    for (const id of ["duty", "recyclingFee", "registration"]) {
      expect(lineOfId(erev, id), `строка "${id}" у EREV`).toBe(
        lineOfId(electric, id),
      );
    }
    // А НДС платится полностью — это и есть отличие EREV от «просто льготы».
    expect(lineOfId(erev, "vat")).toBeGreaterThan(0);
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

  it("у машины с пробегом ставка одна на всё — 40% плюс $3,0/см³", () => {
    // В приложении к ПП-3818 у всех кодов 8703 xx 90 одна строка: ни объём, ни
    // тип ДВС, ни возраст её не дробят. Легко «улучшить» обратно в шкалу.
    for (const fuel of ["petrol", "diesel"] as const) {
      for (const volumeCc of [900, 1400, 1700, 2500, 4000]) {
        const rate = uzDutyRate(fuel, "used", volumeCc);
        expect(rate).toEqual(USED_DUTY);
      }
    }
    const r = calculateUzbekistan({
      ...base,
      price: 10_000,
      freightUsd: 0,
      usdPerUnit: 1,
      volumeCc: 1998,
    });
    expect(Number(r.meta.dutyUsd)).toBe(
      Math.round(10_000 * USED_DUTY.rate + 1998 * USED_DUTY.usdPerCc),
    );
  });

  it("таможенная стоимость — цена плюс фрахт, и фрахт не строка чека", () => {
    // Фрахт задаёт базу трёх адвалорных платежей сразу: ступени сбора,
    // процентной части пошлины и НДС. Строкой в чеке он не появляется.
    const r = calculateUzbekistan({ ...base, price: 20_000, freightUsd: 2_250 });
    expect(Number(r.meta.customsValueUsd)).toBe(22_250);
    expect(r.lines.some((l) => l.id === "freight")).toBe(false);
    expect(Number(r.meta.dutyUsd)).toBe(
      Math.round(22_250 * USED_DUTY.rate + base.volumeCc * USED_DUTY.usdPerCc),
    );
  });

  it("статус решает ставку, а не возраст: свежая машина с пробегом платит как б/у", () => {
    // ⚠️ Корейская машина с аукциона зарегистрирована в Корее, поэтому она
    // «бывшая в эксплуатации» даже в год выпуска. Вывод статуса из возраста
    // дал бы ей 15% вместо 40%.
    const fresh = calculateUzbekistan({ ...base, year: 2026, month: 1 });
    expect(fresh.meta.dutyBand).toBe("used");
    expect(Number(fresh.meta.dutyRate)).toBe(USED_DUTY.rate);
    expect(fresh.flags.some((f) => f.level === "critical")).toBe(true);
  });

  it("у новой машины бракет зависит от года, а у гибрида нет доплаты за см³", () => {
    const under1 = calculateUzbekistan({
      ...base,
      condition: "new",
      year: 2026,
      month: 1,
    });
    const over1 = calculateUzbekistan({
      ...base,
      condition: "new",
      year: 2023,
      month: 1,
    });
    expect(under1.meta.dutyBand).toBe("newUnder1");
    expect(over1.meta.dutyBand).toBe("newOver1");

    // У НОВОГО гибрида доплаты за см³ нет — так в приложении к ПП-3818.
    for (const band of ["newUnder1", "newOver1"] as const) {
      expect(uzDutyRate("hybrid", band, 1998).usdPerCc).toBe(0);
    }
  });

  it("у гибрида с пробегом ставка возрастная, у бензина и дизеля — нет", () => {
    // ⚠️ Асимметрия намеренная и держится на решении владельца, а не на тексте
    // акта: у ДВС «бывшая в эксплуатации» — одна ставка на любой возраст,
    // у гибрида 30% + доплата до трёх лет и 40% + $3,0 после.
    expect(uzDutyRate("hybrid", "used", 1998, false).rate).toBe(0.3);
    expect(uzDutyRate("hybrid", "used", 1998, true)).toEqual(USED_DUTY);

    for (const fuel of ["petrol", "diesel"] as const) {
      expect(uzDutyRate(fuel, "used", 1998, false)).toEqual(
        uzDutyRate(fuel, "used", 1998, true),
      );
    }
  });

  it("постановка на учёт входит в итог, у электромобиля она дешевле", () => {
    const ice = calculateUzbekistan(base);
    const ev = calculateUzbekistan({ ...base, fuel: "electric" });
    expect(lineOf(ice, "registration")).toBe(
      Math.round(registrationBrv("petrol") * BRV_UZS),
    );
    expect(lineOf(ev, "registration")).toBeLessThan(
      lineOf(ice, "registration"),
    );
    // Гибрид платит как бензиновая машина — льгота только у чистого электро.
    const hybrid = calculateUzbekistan({ ...base, fuel: "hybrid" });
    expect(lineOf(hybrid, "registration")).toBe(lineOf(ice, "registration"));
  });

  it("база НДС — таможенная стоимость вместе с пошлиной, без утильсбора и сбора", () => {
    // Именно таможенная (цена + фрахт), а не цена машины: на фрахте 2 250 $
    // разница в НДС около 3,2 млн сум.
    const r = calculateUzbekistan(base);
    const expected = Math.round(
      (Number(r.meta.customsValueUzs) + Number(r.meta.dutyUzs)) * UZ_VAT_RATE,
    );
    expect(lineOf(r, "vat")).toBe(expected);
    expect(Number(r.meta.customsValueUzs)).toBeGreaterThan(
      Number(r.meta.priceUzs),
    );
  });

  it("электромобиль не платит пошлину, но утильсбор платит по своей ставке", () => {
    // ⚠️ Ровно эта пара и была сломана: ядро обнуляло электромобилям утильсбор,
    // хотя с 01.05.2025 у них самая высокая ставка после трёх лет.
    const ev = calculateUzbekistan({ ...base, fuel: "electric" });
    expect(lineOf(ev, "duty")).toBe(0);
    expect(lineOf(ev, "recyclingFee")).toBe(recyclingBrv("electric", 0, true) * BRV_UZS);
    expect(lineOf(ev, "recyclingFee")).toBeGreaterThan(0);
  });

  it("утильсбор кратен БРВ и после трёх лет растёт", () => {
    const r = calculateUzbekistan(base);
    expect(lineOf(r, "recyclingFee") % BRV_UZS).toBe(0);

    const young = calculateUzbekistan({ ...base, year: 2025, month: 1 });
    const old = calculateUzbekistan({ ...base, year: 2020, month: 1 });
    expect(young.meta.ageBand).toBe("under3");
    expect(old.meta.ageBand).toBe("over3");
    expect(lineOf(old, "recyclingFee")).toBeGreaterThan(
      lineOf(young, "recyclingFee"),
    );
  });

  it("ступень таможенного сбора берётся по стоимости в долларах", () => {
    // Шкала ПКМ № 55 задана в долларах. Пока ядро считало ступень по сумме в
    // сумах, машина за $25 000 получала 5 БРВ вместо 2,5.
    const r = calculateUzbekistan({
      ...base,
      price: 25_000,
      freightUsd: 0,
      usdPerUnit: 1,
    });
    expect(Number(r.meta.customsFeeBrv)).toBe(customsFeeBrv(25_000));
    expect(lineOf(r, "customsFee")).toBe(customsFeeBrv(25_000) * BRV_UZS);
  });
});
