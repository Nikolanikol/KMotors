import { describe, expect, it } from "vitest";
import { COUNTRIES, isVerificationStale } from "@/lib/customs/core/registry";

/**
 * Страны, чьи ядра перенесены из прежнего калькулятора сайта и эталоном ещё
 * не сверены. Список ЯВНЫЙ намеренно: без него проверка «у страны с ядром
 * есть источник» просто исчезла бы, и следующая незаверенная страна проехала
 * бы молча. Убирать отсюда страну — по мере снятия golden-кейсов.
 */
const VERIFICATION_PENDING = new Set(["kazakhstan", "uzbekistan"]);

describe("Реестр стран", () => {
  it("страны, ожидающие сверки, перечислены явно и не выдают себя за сверенные", () => {
    for (const id of VERIFICATION_PENDING) {
      const country = COUNTRIES.find((c) => c.id === id);
      expect(country, `в реестре нет страны "${id}"`).toBeDefined();
      expect(
        country!.verification,
        `у "${id}" появился источник — убери её из VERIFICATION_PENDING`,
      ).toBeUndefined();
    }
  });

  it("у каждой сверенной страны заполнен источник сверки", () => {
    for (const country of COUNTRIES) {
      if (country.calculator && !VERIFICATION_PENDING.has(country.id)) {
        expect(
          country.verification,
          `у страны "${country.id}" есть ядро, но нет verification`,
        ).toBeDefined();
        // Название источника обязательно всегда, ссылка — нет: на конкурента
        // мы ссылаться не обязаны, но назвать его должны.
        expect(
          country.verification!.sourceName.key.trim().length,
        ).toBeGreaterThan(0);
        if (country.verification!.sourceUrl !== undefined) {
          expect(country.verification!.sourceUrl).toMatch(/^https:\/\//);
        }
        expect(country.verification!.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it("id страны совпадает с id её калькулятора", () => {
    for (const country of COUNTRIES) {
      if (country.calculator) {
        expect(country.calculator.id).toBe(country.id);
      }
    }
  });

  it("дефолты калькулятора покрывают все поля формы", () => {
    // Иначе поле стартует пустым, а ядро получает 0 или undefined.
    for (const country of COUNTRIES) {
      if (!country.calculator) continue;
      for (const field of country.calculator.fields) {
        expect(
          country.calculator.defaults[field.id],
          `у "${country.id}" нет дефолта для поля "${field.id}"`,
        ).toBeDefined();
      }
    }
  });
});

describe("Актуальность сверки", () => {
  it("свежая сверка не помечается устаревшей", () => {
    expect(isVerificationStale("2026-08-09", 2026)).toBe(false);
  });

  it("сверка прошлого года помечается устаревшей", () => {
    // Ставки пересматриваются с начала календарного года, поэтому признак —
    // смена года, а не количество прошедших дней.
    expect(isVerificationStale("2026-08-09", 2027)).toBe(true);
    expect(isVerificationStale("2026-12-31", 2027)).toBe(true);
  });

  it("сверка будущим годом устаревшей не считается", () => {
    expect(isVerificationStale("2027-01-01", 2026)).toBe(false);
  });

  it("битая дата не роняет расчёт и не помечает сверку устаревшей", () => {
    expect(isVerificationStale("", 2027)).toBe(false);
    expect(isVerificationStale("не дата", 2027)).toBe(false);
  });
});
