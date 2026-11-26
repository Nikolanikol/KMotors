import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFx } from "@/lib/fx";
import { FX_SNAPSHOT } from "@/lib/fx/snapshot";
import { CBR_URL } from "@/lib/fx/sources/cbr";
import { ERAPI_URL } from "@/lib/fx/sources/erapi";
import { FRANKFURTER_URL } from "@/lib/fx/sources/frankfurter";
import { KB_URL } from "@/lib/fx/sources/kb";

/** Ответ ЦБ РФ: рубли за Nominal единиц. */
const CBR_OK = {
  Date: "2026-08-27T11:30:00+03:00",
  Valute: {
    USD: { Value: 84.28, Nominal: 1 },
    EUR: { Value: 97.1, Nominal: 1 },
    KRW: { Value: 6.09, Nominal: 100 },
    GEL: { Value: 31.3, Nominal: 1 },
  },
};

const FRANKFURTER_OK = { date: "2026-08-26", rates: { USD: 0.00072 } };

const ERAPI_OK = {
  result: "success",
  time_last_update_utc: "Wed, 26 Aug 2026 00:02:31 +0000",
  rates: {
    USD: 1, EUR: 0.86, KRW: 1390, ALL: 80, GEL: 2.6, AMD: 366,
    KGS: 87, RUB: 84, KZT: 470, UZS: 11900,
  },
};

/** Строка таблицы KB: шесть чисел, третье — 송금 받으실 때. */
function kbRow(code: string, cells: number[]): string {
  return `<tr><td><a onclick="uf_goLink('${code}')">${code}</a></td>${cells
    .map((n) => `<td class="tRight">${n.toLocaleString("en-US")}</td>`)
    .join("")}</tr>`;
}
const KB_OK =
  `<p>2026.08.27&nbsp;19:29:01 (412회차)</p><table>` +
  kbRow("USD", [1381.6, 1395, 1368.2, 1405.77, 1357.43, 1]) +
  kbRow("RUB", [16.9, 17.3, 16.6, 18.1, 15.9, 0.012]) +
  `</table>`;

type Reply = { status?: number; json?: unknown; text?: string; throws?: boolean };

/** Подмена fetch по URL. Возвращает спай, чтобы считать походы к источникам. */
function stubFetch(replies: Record<string, Reply>) {
  const spy = vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    const reply = replies[url];
    if (!reply || reply.throws) throw new Error(`сеть недоступна: ${url}`);
    const status = reply.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => reply.json,
      text: async () => reply.text ?? JSON.stringify(reply.json),
    } as Response;
  });
  vi.stubGlobal("fetch", spy);
  return spy;
}

const calls = (spy: ReturnType<typeof stubFetch>, url: string) =>
  spy.mock.calls.filter(([input]) => String(input) === url).length;

let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ЦБ РФ упал → снимок с логом", () => {
  it("рыночный вид берёт рубль из снимка и пишет в лог, что и почему", async () => {
    stubFetch({
      [CBR_URL]: { status: 503 },
      [FRANKFURTER_URL]: { json: FRANKFURTER_OK },
    });
    const rates = await getFx("market");

    expect(rates.krwToUsd).toBe(0.00072);
    expect(rates.krwToRub).toBeCloseTo(FX_SNAPSHOT.perUsd.RUB / FX_SNAPSHOT.perUsd.KRW, 12);
    expect(rates.rubToUsd).toBeCloseTo(1 / FX_SNAPSHOT.perUsd.RUB, 12);
    expect(rates.updatedAt).toBe("2026-08-26");

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const line = String(errorSpy.mock.calls[0][0]);
    expect(line).toContain("[fx:market] упали на фолбэк");
    expect(line).toContain("KRW→RUB");
    expect(line).toContain("HTTP 503");
  });

  it("всё легло → весь рыночный вид из снимка, дата «fallback»", async () => {
    stubFetch({});
    const rates = await getFx("market");
    expect(rates.updatedAt).toBe("fallback");
    expect(rates.krwToUsd).toBeCloseTo(1 / FX_SNAPSHOT.perUsd.KRW, 12);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("таможенный вид без обоих провайдеров заполнен снимком и логирует", async () => {
    stubFetch({});
    const rates = await getFx("customs");
    expect(rates.degraded).toBe(true);
    expect(rates.asOf).toBe(FX_SNAPSHOT.asOf);
    expect(rates.perUsd.UZS).toBe(FX_SNAPSHOT.perUsd.UZS);
    expect(String(errorSpy.mock.calls[0][0])).toContain("[fx:customs] упали на фолбэк");
  });

  it("на живых источниках лог молчит", async () => {
    stubFetch({
      [CBR_URL]: { json: CBR_OK },
      [FRANKFURTER_URL]: { json: FRANKFURTER_OK },
      [ERAPI_URL]: { json: ERAPI_OK },
    });
    await Promise.all([getFx("market"), getFx("customs")]);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

describe("Кукмин-банк вернул бессмыслицу → рыночный с логом", () => {
  const market = {
    [CBR_URL]: { json: CBR_OK },
    [FRANKFURTER_URL]: { json: FRANKFURTER_OK },
  };

  it("живая страница KB даёт покупной телеграфный курс", async () => {
    stubFetch({ ...market, [KB_URL]: { text: KB_OK } });
    const rates = await getFx("car");
    expect(rates).toEqual({
      krwToUsd: 1 / 1368.2,
      krwToRub: 1 / 16.6,
      source: "kb",
      updatedAt: "2026.08.27 19:29:01",
    });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("переставленные колонки (число вне правдоподобия) → рыночный", async () => {
    const broken = KB_OK.replace("1,368.2", "1.37");
    stubFetch({ ...market, [KB_URL]: { text: broken } });
    const rates = await getFx("car");
    expect(rates.source).toBe("market");
    expect(rates.krwToUsd).toBe(0.00072);
    expect(rates.krwToRub).toBeCloseTo(6.09 / 100, 12);
    expect(String(errorSpy.mock.calls[0][0])).toContain("[fx:car] упали на фолбэк");
  });

  it("заглушка вместо таблицы → рыночный с логом", async () => {
    stubFetch({ ...market, [KB_URL]: { text: "<html>점검 중</html>" } });
    const rates = await getFx("car");
    expect(rates.source).toBe("market");
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("пока KB отвечает, к рыночным источникам не ходим", async () => {
    const spy = stubFetch({ ...market, [KB_URL]: { text: KB_OK } });
    await getFx("car");
    expect(calls(spy, CBR_URL)).toBe(0);
    expect(calls(spy, FRANKFURTER_URL)).toBe(0);
  });
});

describe("Одна загрузка ЦБ на всё", () => {
  it("рыночный и таможенный одновременно — один запрос к ЦБ", async () => {
    const spy = stubFetch({
      [CBR_URL]: { json: CBR_OK },
      [FRANKFURTER_URL]: { json: FRANKFURTER_OK },
      [ERAPI_URL]: { json: ERAPI_OK },
    });
    const [market, customs] = await Promise.all([getFx("market"), getFx("customs")]);
    expect(calls(spy, CBR_URL)).toBe(1);

    // Из одного ответа ЦБ: рубль рыночного вида и кросс таможенного.
    expect(market.krwToRub).toBeCloseTo(6.09 / 100, 12);
    expect(market.rubToUsd).toBeCloseTo(1 / 84.28, 12);
    expect(customs.perUsd.ALL).toBe(80);
    expect(customs.perUsd.GEL).toBe(2.6);
  });

  it("таможенный вид берёт из того же ответа ЦБ рубль и кроссы, если er-api лёг", async () => {
    const spy = stubFetch({ [CBR_URL]: { json: CBR_OK }, [FRANKFURTER_URL]: { json: FRANKFURTER_OK } });
    const [market, customs] = await Promise.all([getFx("market"), getFx("customs")]);
    expect(calls(spy, CBR_URL)).toBe(1);
    expect(customs.perUsd.RUB).toBe(84.28);
    expect(customs.perUsd.KRW).toBeCloseTo(84.28 / (6.09 / 100), 9);
    expect(customs.sources.KRW).toBe("cbr");
    // Тот же курс, что у рыночного вида, только в другой форме.
    expect(1 / customs.perUsd.RUB).toBeCloseTo(market.rubToUsd, 12);
  });

  it("опции запроса к ЦБ одинаковые у всех видов — Next схлопнет их в рендере", async () => {
    const spy = stubFetch({ [CBR_URL]: { json: CBR_OK } });
    await getFx("market");
    await getFx("customs");
    const inits = spy.mock.calls
      .filter(([input]) => String(input) === CBR_URL)
      .map((c) => JSON.stringify((c as unknown[])[1]));
    expect(inits).toHaveLength(2);
    expect(new Set(inits).size).toBe(1);
    expect(inits[0]).toContain('"revalidate":21600');
  });
});
