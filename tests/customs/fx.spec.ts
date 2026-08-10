import { describe, expect, it, vi } from "vitest";
import { logDegradation } from "@/lib/customs/fx/getRates";
import { parseErApi } from "@/lib/customs/fx/providers/erapi";
import { parseCbr } from "@/lib/customs/fx/providers/cbr";
import { mergeRates } from "@/lib/customs/fx/getRates";
import { FALLBACK_PER_USD } from "@/lib/customs/fx/fallback";
import {
  TRACKED_CURRENCIES,
  formatRateValue,
  rateBetween,
  type ProviderRates,
} from "@/lib/customs/fx/types";

/** Сокращённый ответ open.er-api.com — форма та же, что у живого. */
const ER_OK = {
  result: "success",
  time_last_update_utc: "Sun, 09 Aug 2026 00:02:31 +0000",
  rates: {
    USD: 1,
    EUR: 0.865939,
    KRW: 1412.197474,
    ALL: 80.785937,
    GEL: 2.619746,
    AMD: 366.081469,
    KGS: 87.487992,
    XYZ: 42,
  },
};

/** Сокращённый ответ ЦБ РФ: рубли за Nominal единиц, лека нет. */
const CBR_OK = {
  Date: "2026-08-08T11:30:00+03:00",
  Valute: {
    USD: { Value: 82.1234, Nominal: 1 },
    EUR: { Value: 94.8366, Nominal: 1 },
    KRW: { Value: 5.7913, Nominal: 100 },
    GEL: { Value: 31.3338, Nominal: 1 },
  },
};

describe("Провайдер open.er-api", () => {
  it("разбирает нормальный ответ и берёт только нужные валюты", () => {
    const result = parseErApi(ER_OK);
    expect(result.source).toBe("erapi");
    expect(result.asOf).toBe("2026-08-09");
    expect(result.perUsd.ALL).toBe(80.785937);
    expect(result.perUsd).not.toHaveProperty("XYZ");
  });

  it("падает на неуспешном результате", () => {
    expect(() => parseErApi({ result: "error", rates: {} })).toThrow();
  });

  it("падает на битом JSON вместо объекта", () => {
    expect(() => parseErApi("не объект")).toThrow();
    expect(() => parseErApi(null)).toThrow();
  });

  it("падает, если нужных валют в ответе нет вовсе", () => {
    expect(() =>
      parseErApi({ result: "success", rates: { XYZ: 1, ABC: 2 } }),
    ).toThrow();
  });

  it("отбрасывает нулевые и отрицательные курсы", () => {
    const result = parseErApi({
      ...ER_OK,
      rates: { ...ER_OK.rates, ALL: 0, GEL: -1 },
    });
    expect(result.perUsd).not.toHaveProperty("ALL");
    expect(result.perUsd).not.toHaveProperty("GEL");
    expect(result.perUsd.KRW).toBe(1412.197474);
  });

  it("битую дату не выдумывает", () => {
    const result = parseErApi({ ...ER_OK, time_last_update_utc: "вчера" });
    expect(result.asOf).toBe("");
  });
});

describe("Провайдер ЦБ РФ", () => {
  it("строит кросс к доллару с учётом Nominal", () => {
    const result = parseCbr(CBR_OK);
    expect(result.source).toBe("cbr");
    expect(result.asOf).toBe("2026-08-08");
    expect(result.perUsd.USD).toBe(1);
    // 82.1234 руб/USD ÷ 0.057913 руб/KRW
    expect(result.perUsd.KRW).toBeCloseTo(82.1234 / (5.7913 / 100), 6);
    expect(result.perUsd.GEL).toBeCloseTo(82.1234 / 31.3338, 6);
  });

  it("лек не отдаёт — это и делает его резервным", () => {
    expect(parseCbr(CBR_OK).perUsd).not.toHaveProperty("ALL");
  });

  it("падает без доллара: кросс построить не из чего", () => {
    expect(() =>
      parseCbr({ Date: "2026-08-08", Valute: { GEL: { Value: 31, Nominal: 1 } } }),
    ).toThrow();
  });

  it("падает на битом ответе", () => {
    expect(() => parseCbr({ Valute: null })).toThrow();
    expect(() => parseCbr("<html>ошибка</html>")).toThrow();
  });

  it("пропускает валюту с испорченным Nominal, не роняя остальные", () => {
    const result = parseCbr({
      ...CBR_OK,
      Valute: { ...CBR_OK.Valute, GEL: { Value: 31.3338, Nominal: 0 } },
    });
    expect(result.perUsd).not.toHaveProperty("GEL");
    expect(result.perUsd.EUR).toBeDefined();
  });
});

describe("Сборка курсов и деградация", () => {
  const er = parseErApi(ER_OK);
  const cbr = parseCbr(CBR_OK);

  it("набор заполнен всегда, даже когда оба провайдера отвалились", () => {
    const rates = mergeRates([]);
    for (const code of TRACKED_CURRENCIES) {
      expect(rates.perUsd[code], `нет курса ${code}`).toBeGreaterThan(0);
      expect(rates.sources[code]).toBe("fallback");
    }
    expect(rates.degraded).toBe(true);
    expect(rates.perUsd.ALL).toBe(FALLBACK_PER_USD.ALL);
  });

  it("основной провайдер закрывает всё и деградации не даёт", () => {
    const rates = mergeRates([er]);
    expect(rates.degraded).toBe(false);
    for (const code of TRACKED_CURRENCIES) {
      expect(rates.sources[code]).toBe("erapi");
    }
  });

  it("ЦБ подхватывает валюты, которых не дал основной", () => {
    const partial: ProviderRates = {
      source: "erapi",
      asOf: "2026-08-09",
      perUsd: { ALL: 80.785937 },
    };
    const rates = mergeRates([partial, cbr]);
    expect(rates.sources.ALL).toBe("erapi");
    expect(rates.sources.GEL).toBe("cbr");
    // Лека у ЦБ нет, поэтому без основного провайдера он ушёл бы в снимок.
    expect(mergeRates([cbr]).sources.ALL).toBe("fallback");
    expect(mergeRates([cbr]).degraded).toBe(true);
  });

  it("падение на снимок пишется в лог с перечнем валют", () => {
    // Правило KMotors: «падение на фолбэк должно логироваться». Провайдер
    // может ответить успехом и молча не отдать часть валют — тогда исключения
    // нет, и без этой записи расхождение осталось бы невидимым.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      logDegradation(mergeRates([cbr]));
      expect(spy).toHaveBeenCalledTimes(1);
      // Лек — единственное, чего у ЦБ нет, значит он и должен быть назван.
      expect(String(spy.mock.calls[0][0])).toContain("ALL");
    } finally {
      spy.mockRestore();
    }
  });

  it("на живых курсах лог молчит", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      logDegradation(mergeRates([er]));
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it("показывает самую старую дату среди использованных источников", () => {
    // Не самую свежую: иначе подпись выглядела бы новее, чем часть курсов.
    const partial: ProviderRates = {
      source: "erapi",
      asOf: "2026-08-09",
      perUsd: { ALL: 80.785937 },
    };
    expect(mergeRates([partial, cbr]).asOf).toBe("2026-08-08");
    expect(mergeRates([er]).asOf).toBe("2026-08-09");
  });

  it("приоритет у основного провайдера при пересечении валют", () => {
    const rates = mergeRates([er, cbr]);
    expect(rates.perUsd.GEL).toBe(2.619746);
    expect(rates.sources.GEL).toBe("erapi");
  });
});

describe("Пересчёт пар", () => {
  const rates = mergeRates([parseErApi(ER_OK)]);

  it("одинаковая валюта даёт единицу", () => {
    expect(rateBetween(rates, "USD", "USD")).toBe(1);
  });

  it("лек за доллар берётся напрямую", () => {
    expect(rateBetween(rates, "USD", "ALL")).toBeCloseTo(80.785937, 6);
  });

  it("лек за вону считается кроссом", () => {
    expect(rateBetween(rates, "KRW", "ALL")).toBeCloseTo(
      80.785937 / 1412.197474,
      9,
    );
  });

  it("значение для поля формы не теряет значащих цифр у воны", () => {
    const value = rateBetween(rates, "KRW", "ALL")!;
    // Курс ALL/KRW — сотые доли: округление до двух знаков обнулило бы поле.
    expect(Number(formatRateValue(value))).toBeGreaterThan(0);
    expect(formatRateValue(value)).toMatch(/^0\.0\d+$/);
  });
});
