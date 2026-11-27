import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  carPageTarget,
  classifyVehicleResponse,
  isEncarBlockBody,
  isRenderableVehicle,
  verdictHttpStatus,
} from "@/lib/vehicleStatus";
import { probeVehicle, resetVehicleProbe, UNKNOWN_TTL_MS, VERDICT_TTL_MS } from "@/lib/vehicleProbe";

const LIVE_JSON = JSON.stringify({
  category: { manufacturerEnglishName: "Hyundai" },
  advertisement: { price: 2300 },
});

// Настоящий 404 Encar (замер 27.11.2026): content-length 0, без content-type.
const SOLD = { status: 404, contentType: null, body: "" };
// Блокировка по IP: тоже 404, но HTML со ссылкой на has_been_cr_blocked (постмортем 13.11.2026).
const BLOCK = {
  status: 404,
  contentType: "text/html",
  body: '<html><body><a href="/has_been_cr_blocked_AWS.html">blocked</a></body></html>',
};

describe("classifyVehicleResponse", () => {
  it("200 с маркой и ценой — жива", () => {
    expect(classifyVehicleResponse({ status: 200, contentType: "application/json", body: LIVE_JSON })).toBe("live");
  });

  it("строгий 404 без тела — продана", () => {
    expect(classifyVehicleResponse(SOLD)).toBe("sold");
  });

  it("404 со страницей блокировки Encar — НЕ продана", () => {
    expect(classifyVehicleResponse(BLOCK)).toBe("unknown");
  });

  it("404 с HTML даже без ссылки на блокировку — НЕ продана", () => {
    expect(classifyVehicleResponse({ status: 404, contentType: "text/html; charset=utf-8", body: "<html></html>" })).toBe("unknown");
  });

  it("404 с телом has_been_cr_blocked без content-type — НЕ продана", () => {
    expect(classifyVehicleResponse({ status: 404, contentType: null, body: "see has_been_cr_blocked_X.html" })).toBe("unknown");
  });

  it.each([500, 502, 503, 429, 403])("%i — авария, не продана", (status) => {
    expect(classifyVehicleResponse({ status, contentType: null, body: "" })).toBe("unknown");
  });

  it("200, но не JSON (HTML вместо данных) — авария", () => {
    expect(classifyVehicleResponse({ status: 200, contentType: "text/html", body: "<html>oops</html>" })).toBe("unknown");
    expect(classifyVehicleResponse({ status: 200, contentType: "application/json", body: "{not json" })).toBe("unknown");
    expect(classifyVehicleResponse({ status: 200, contentType: "application/json", body: "null" })).toBe("unknown");
  });

  it("200 без цены или без марки — битая (страница зовёт notFound)", () => {
    const noPrice = JSON.stringify({ category: { manufacturerEnglishName: "Kia" }, advertisement: { price: 0 } });
    const noBrand = JSON.stringify({ category: {}, advertisement: { price: 100 } });
    expect(classifyVehicleResponse({ status: 200, contentType: "application/json", body: noPrice })).toBe("invalid");
    expect(classifyVehicleResponse({ status: 200, contentType: "application/json", body: noBrand })).toBe("invalid");
    expect(classifyVehicleResponse({ status: 200, contentType: "application/json", body: "{}" })).toBe("invalid");
  });
});

describe("verdictHttpStatus", () => {
  it("продана — 410, битая — 404, остальное — не вмешиваемся", () => {
    expect(verdictHttpStatus("sold")).toBe(410);
    expect(verdictHttpStatus("invalid")).toBe(404);
    expect(verdictHttpStatus("live")).toBeNull();
    expect(verdictHttpStatus("unknown")).toBeNull();
  });
});

describe("isRenderableVehicle / isEncarBlockBody", () => {
  it("null, пустой объект и объявление без цены не пригодны к показу", () => {
    expect(isRenderableVehicle(null)).toBe(false);
    expect(isRenderableVehicle({})).toBe(false);
    expect(isRenderableVehicle({ category: { manufacturerEnglishName: "Kia" }, advertisement: { price: 1 } })).toBe(true);
  });

  it("HTML и ссылка на блокировку распознаются", () => {
    expect(isEncarBlockBody("text/html", "")).toBe(true);
    expect(isEncarBlockBody(null, "x has_been_cr_blocked y")).toBe(true);
    expect(isEncarBlockBody("application/json", "{}")).toBe(false);
    expect(isEncarBlockBody(null, "")).toBe(false);
  });
});

describe("carPageTarget", () => {
  it("карточка авто на любой нашей локали", () => {
    expect(carPageTarget("/ru/catalog/43179799")).toEqual({ lang: "ru", id: "43179799" });
    expect(carPageTarget("/ar/catalog/42226630")).toEqual({ lang: "ar", id: "42226630" });
  });

  it("листинг, og-картинка, нечисловой id, чужая локаль и ko — не карточка", () => {
    expect(carPageTarget("/ru/catalog")).toBeNull();
    expect(carPageTarget("/ru/catalog/43179799/opengraph-image-ln5hc1")).toBeNull();
    expect(carPageTarget("/ru/catalog/abc")).toBeNull();
    expect(carPageTarget("/ru/catalog/123")).toBeNull();
    expect(carPageTarget("/de/catalog/43179799")).toBeNull();
    expect(carPageTarget("/ko/catalog/43179799")).toBeNull();
    expect(carPageTarget("/ru/parts/43179799")).toBeNull();
  });
});

function fakeRes(r: { status: number; contentType: string | null; body: string }) {
  return {
    status: r.status,
    headers: { get: (n: string) => (n.toLowerCase() === "content-type" ? r.contentType : null) },
    text: async () => r.body,
  };
}

describe("probeVehicle", () => {
  beforeEach(() => {
    resetVehicleProbe();
    vi.restoreAllMocks();
  });

  it("продана: вердикт sold, второй заход из кеша без запроса", async () => {
    const f = vi.fn().mockResolvedValue(fakeRes(SOLD));
    expect(await probeVehicle("42226630", f)).toBe("sold");
    expect(await probeVehicle("42226630", f)).toBe("sold");
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("шлёт мобильный User-Agent и не использует кеш Next", async () => {
    const f = vi.fn().mockResolvedValue(fakeRes({ status: 200, contentType: "application/json", body: LIVE_JSON }));
    expect(await probeVehicle("43179799", f)).toBe("live");
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://api.encar.com/v1/readside/vehicle/43179799");
    expect(init.headers["user-agent"]).toMatch(/iPhone/);
    expect(init.cache).toBe("no-store");
  });

  it("блокировка Encar: unknown, и кешируется коротко (не на полчаса)", async () => {
    let t = 1_000_000;
    const f = vi.fn().mockResolvedValue(fakeRes(BLOCK));
    expect(await probeVehicle("1", f, () => t)).toBe("unknown");
    t += UNKNOWN_TTL_MS - 1;
    await probeVehicle("1", f, () => t);
    expect(f).toHaveBeenCalledTimes(1);
    t += 2;
    await probeVehicle("1", f, () => t);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("продана кешируется на VERDICT_TTL_MS, потом проверяется заново", async () => {
    let t = 5_000_000;
    const f = vi.fn().mockResolvedValue(fakeRes(SOLD));
    await probeVehicle("2", f, () => t);
    t += VERDICT_TTL_MS - 1;
    await probeVehicle("2", f, () => t);
    expect(f).toHaveBeenCalledTimes(1);
    t += 2;
    await probeVehicle("2", f, () => t);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("исключение fetch (таймаут, сеть) не пробрасывается: unknown", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const f = vi.fn().mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" }));
    expect(await probeVehicle("3", f)).toBe("unknown");
  });

  it("5xx — unknown", async () => {
    const f = vi.fn().mockResolvedValue(fakeRes({ status: 503, contentType: "text/html", body: "<html>down</html>" }));
    expect(await probeVehicle("4", f)).toBe("unknown");
  });

  it("одновременные заходы на одну машину — один запрос", async () => {
    const f = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 10));
      return fakeRes(SOLD);
    });
    const res = await Promise.all([probeVehicle("5", f), probeVehicle("5", f), probeVehicle("5", f)]);
    expect(res).toEqual(["sold", "sold", "sold"]);
    expect(f).toHaveBeenCalledTimes(1);
  });
});
