import { afterEach, describe, expect, it, vi } from "vitest";
import { getCars } from "@/components/Home/CarSlider/getCars";

const PROXY = "https://encar-proxy-main.onrender.com/api/catalog?count=true&q=x";
const DIRECT = "https://api.encar.com/search/car/list/general?count=true&q=x";

/** fetch, который не отвечает, пока не сработает переданный signal — как настоящий. */
function hangingFetch() {
  return vi.fn((_url: string, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal!.reason));
    })
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("getCars", () => {
  it("зависший Encar: по таймауту отдаёт [] и не бросает", async () => {
    const ctrl = new AbortController();
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout").mockReturnValue(ctrl.signal);
    vi.stubGlobal("fetch", hangingFetch());

    const pending = getCars(PROXY);
    ctrl.abort(new DOMException("timeout", "TimeoutError"));

    await expect(pending).resolves.toEqual([]);
    expect(timeoutSpy).toHaveBeenCalledWith(20000);
  });

  it("реальный AbortSignal.timeout + фейковые таймеры не нужны: сигнал передан в fetch", async () => {
    const fetchMock = hangingFetch();
    vi.stubGlobal("fetch", fetchMock);
    const ctrl = new AbortController();
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(ctrl.signal);

    const pending = getCars(DIRECT);
    ctrl.abort();
    await pending;

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBe(ctrl.signal);
  });

  it("прямой Encar — 8 с, прокси Render — 20 с", async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));

    await getCars(DIRECT);
    await getCars(PROXY);

    expect(timeoutSpy.mock.calls.map((c) => c[0])).toEqual([8000, 20000]);
  });

  it("не-200 → []", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("blocked", { status: 404 })));
    await expect(getCars(PROXY)).resolves.toEqual([]);
  });

  it("сеть упала / битый JSON → []", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    await expect(getCars(PROXY)).resolves.toEqual([]);

    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { status: 200 })));
    await expect(getCars(PROXY)).resolves.toEqual([]);
  });

  it("исправный ответ: строки в Price/Mileage, одно фото, нет Photos — не падает", async () => {
    const body = {
      Count: 2,
      SearchResults: [
        { Id: "1", Price: 3000, Mileage: 12000, Photos: [{ location: "a" }, { location: "b" }] },
        { Id: "2", Price: 100 },
      ],
    };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })));

    const cars = await getCars(PROXY);
    expect(cars).toHaveLength(2);
    expect(cars[0]).toMatchObject({ Price: "3000", Mileage: "12000", Photos: [{ location: "a" }] });
    expect(cars[1]).toMatchObject({ Price: "100", Mileage: "", Photos: [] });
  });
});
