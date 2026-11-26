import { describe, expect, it } from "vitest";
import {
  carCustomsInput,
  carFuelKind,
  parseYearMonth,
  type CarCustomsData,
} from "@/lib/customs/fromCar";
import { getCountry, RUNTIME_INPUT_IDS } from "@/lib/customs/core/registry";
import { TRACKED_CURRENCIES, type Rates } from "@/lib/fx/types";

/**
 * Вход ядра, который строит виджет растаможки в карточке авто.
 *
 * ⚠️ Ожидания посчитаны РУКОЙ по ставкам, а не прогоном ядра (как в golden
 * Казахстана и Узбекистана). Курсы круглые, чтобы каждую строку было видно
 * глазами: 1 400 ₩/$, 80 ₽/$, 0,8 €/$ (100 ₽/€), 500 ₸/$, 12 000 сум/$.
 * Машина: Encar, 28 000 000 ₩ (= $20 000 = 1 600 000 ₽ = 10 000 000 ₸),
 * март 2022, 1998 см³, бензин. Расчётный момент — январь 2026 (46 месяцев).
 */
const PER_USD = {
  USD: 1,
  EUR: 0.8,
  KRW: 1400,
  RUB: 80,
  KZT: 500,
  UZS: 12000,
  ALL: 90,
  GEL: 2.7,
  AMD: 390,
  KGS: 87,
};

const RATES: Rates = {
  perUsd: PER_USD,
  sources: Object.fromEntries(TRACKED_CURRENCIES.map((c) => [c, "erapi"])) as Rates["sources"],
  asOf: "2026-01-15",
  degraded: false,
};

const RUNTIME = { currentYear: 2026, currentMonth: 1 };

const CAR: CarCustomsData = {
  priceKrw: 28_000_000,
  yearMonth: "202203",
  volumeCc: 1998,
  fuelName: "가솔린",
};

function calc(countryId: "russia" | "kazakhstan" | "uzbekistan", hp?: number) {
  const input = carCustomsInput(countryId, CAR, RATES, RUNTIME, { horsePower: hp });
  expect(input).not.toBeNull();
  return getCountry(countryId).calculator!.calculate(input!);
}

const line = (result: ReturnType<typeof calc>, id: string) =>
  result.lines.find((l) => l.id === id)!.amount;

describe("Виджет карточки авто: вход ядра из данных Encar", () => {
  it("каждый вход ядра без поля в форме подан (RUNTIME_INPUT_IDS)", () => {
    for (const id of ["russia", "kazakhstan", "uzbekistan"] as const) {
      const input = carCustomsInput(id, CAR, RATES, RUNTIME)!;
      for (const key of RUNTIME_INPUT_IDS) expect(input[key]).toBe(RUNTIME[key]);
      for (const field of getCountry(id).calculator!.fields) {
        expect(input[field.id], `${id}.${field.id}`).not.toBeUndefined();
      }
    }
  });

  it("Россия: 3–5 лет, 1998 см³, 150 л.с. — 558 201 ₽", () => {
    const r = calc("russia", 150);
    // Пошлина: 1998 см³ × 2,7 €/см³ × 100 ₽/€ = 539 460 ₽.
    expect(line(r, "duty")).toBe(539_460);
    // Сбор: 1 600 000 ₽ — ступень до 2 700 000 ₽.
    expect(line(r, "customsFee")).toBe(13_541);
    // Утильсбор: ≤160 л.с. и ≤3000 см³, старше 3 лет — 20 000 × 0,26.
    expect(line(r, "recyclingFee")).toBe(5_200);
    expect(r.total).toEqual({ amount: 558_201, currency: "RUB" });
  });

  it("Казахстан: 10 000 000 ₸, 4 календарных года — 6 706 993 ₸", () => {
    const r = calc("kazakhstan");
    expect(line(r, "customsFee")).toBe(25_950); // 6 МРП × 4 325
    expect(line(r, "duty")).toBe(1_500_000); // 15%
    // НДС 16% от (10 000 000 + 1 500 000 + 25 950) = 1 844 152.
    expect(line(r, "vat")).toBe(1_844_152);
    expect(line(r, "registration")).toBe(2_162_500); // 500 МРП: 2026 − 2022 = 4
    expect(line(r, "registrationDocs")).toBe(17_516); // (2,8 + 1,25) МРП
    expect(line(r, "recyclingFee")).toBe(756_875); // 50 МРП × 3,5
    expect(r.total).toEqual({ amount: 6_706_993, currency: "KZT" });
  });

  it("Узбекистан: б/у по статусу, фрахт в базе — 325 137 840 сум", () => {
    const r = calc("uzbekistan");
    // Таможенная стоимость $20 000 + $2 250 фрахта = $22 250 → 2,5 БРВ.
    expect(line(r, "customsFee")).toBe(1_030_000);
    // Б/у: 40% × 22 250 + 1998 × $3 = $14 894 × 12 000.
    expect(line(r, "duty")).toBe(178_728_000);
    // НДС 12% от (267 000 000 + 178 728 000).
    expect(line(r, "vat")).toBe(53_487_360);
    expect(line(r, "recyclingFee")).toBe(86_520_000); // 210 БРВ, старше 3 лет
    expect(line(r, "registration")).toBe(5_372_480); // 13,04 БРВ
    expect(r.total).toEqual({ amount: 325_137_840, currency: "UZS" });
  });

  it("корейское топливо Encar раскладывается по типам", () => {
    expect(carFuelKind("가솔린")).toBe("petrol");
    expect(carFuelKind("LPG(일반인 구입)")).toBe("petrol");
    expect(carFuelKind("디젤")).toBe("diesel");
    expect(carFuelKind("가솔린+전기")).toBe("hybrid");
    expect(carFuelKind("디젤+전기")).toBe("hybrid");
    expect(carFuelKind("전기")).toBe("electric");
    expect(carFuelKind("수소")).toBe("electric");
    expect(carFuelKind(undefined)).toBe("petrol");
  });

  it("без года выпуска или цены расчёта нет, а не нули", () => {
    expect(parseYearMonth("")).toBeNull();
    expect(carCustomsInput("russia", { ...CAR, yearMonth: "" }, RATES, RUNTIME)).toBeNull();
    expect(carCustomsInput("uzbekistan", { ...CAR, priceKrw: 0 }, RATES, RUNTIME)).toBeNull();
  });
});
