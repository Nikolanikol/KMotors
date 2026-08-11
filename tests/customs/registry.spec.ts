import { describe, expect, it } from "vitest";
import {
  COUNTRIES,
  RUNTIME_INPUT_IDS,
  isVerificationStale,
} from "@/lib/customs/core/registry";

/**
 * Страны, чьи ядра эталоном ещё не сверены. Список ЯВНЫЙ намеренно: без него
 * проверка «у страны с ядром есть источник» просто исчезла бы, и следующая
 * незаверенная страна проехала бы молча.
 *
 * Обе страны сверялись по опубликованным ставкам, и у обеих есть golden с
 * ручным счётом, но обе остаются здесь: сверен не весь чек.
 *
 * Казахстан — открыты шкала регистрации для электромобилей, гибриды и состав
 * базы НДС. Узбекистан — ядро переписано по текстам актов 11.08.2026 и
 * покрыто кейсами целиком, однако две ставки держатся не на первоисточнике:
 * 30% для гибрида с пробегом выведены из структуры приложения к ПП-3818, а
 * шкала таможенного сбора снята со вторичных источников, потому что lex.uz
 * отдаёт ПКМ № 55 только на узбекском.
 *
 * Пока такие ветки открыты, дату актуальности показывать нельзя — она обещала
 * бы больше, чем проверено. Разбор — в блоках `pending` самих golden-файлов.
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

  it("вход ядра без поля в форме перечислен в RUNTIME_INPUT_IDS", () => {
    // ⚠️ Обратная сторона предыдущей проверки, и она дороже. Поля формы ядро
    // получает от пользователя, а расчётный момент — от интерфейса. Когда
    // интерфейс подал год, но забыл месяц, возраст стал NaN: сравнения с NaN
    // ложны, машина молча упала в последний возрастной бракет, и калькулятор
    // России считал ЛЮБУЮ машину как «старше 5 лет». Ядро при этом было
    // исправно и все его тесты зелены — вход в них подавался полный.
    //
    // Здесь закрыта половина связки: ядро не может завести новый рантайм-вход
    // мимо списка. Вторая половина — тип RuntimeInputs, из-за которого
    // CalculatorPanel не соберётся, пока не подаст каждый ключ списка.
    const known = new Set<string>(RUNTIME_INPUT_IDS);
    for (const country of COUNTRIES) {
      const calculator = country.calculator;
      if (!calculator) continue;

      const fieldIds = new Set(calculator.fields.map((f) => f.id));
      const unlisted = Object.keys(calculator.defaults).filter(
        (id) => !fieldIds.has(id) && !known.has(id),
      );
      expect(
        unlisted,
        `у "${country.id}" вход ${unlisted.join(", ")} не имеет ни поля формы, ` +
          `ни места в RUNTIME_INPUT_IDS — ядро получит undefined`,
      ).toEqual([]);
    }
  });

  it("потеря рантайм-входа не проходит незаметно", () => {
    // Смысл не в том, что ядро обязано пережить пропажу, а в том, что пропажа
    // ДОЛЖНА быть видна. Пока это NaN в meta — если ядро когда-нибудь начнёт
    // молча подставлять ноль, тест упадёт и заставит подумать.
    const russia = COUNTRIES.find((c) => c.id === "russia")!.calculator!;
    for (const missing of RUNTIME_INPUT_IDS) {
      const input: Record<string, unknown> = { ...russia.defaults };
      delete input[missing];
      const meta = russia.calculate(input).meta ?? {};
      expect(
        Object.values(meta),
        `без входа "${missing}" расчёт выглядит нормальным`,
      ).toContain("NaN");
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
