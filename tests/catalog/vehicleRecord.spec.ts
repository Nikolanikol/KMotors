import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchVehicleRecord } from "@/lib/vehicleRecord";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchVehicleRecord", () => {
  it("шлёт браузерный User-Agent — без него Encar отвечает 404 и блок истории пропадает", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ firstDate: "2023-02-01" }) });
    vi.stubGlobal("fetch", fetchMock);

    const record = await fetchVehicleRecord(43179799, "385서9467");

    expect(record?.firstDate).toBe("2023-02-01");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/v1/readside/record/vehicle/43179799/open");
    expect(String(url)).toContain(encodeURIComponent("385서9467"));
    expect(init.headers["user-agent"]).toMatch(/iPhone/);
  });

  it("не-ok ответ: null, но с записью в лог (раньше блок исчезал молча)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(await fetchVehicleRecord(1, "12가3456")).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("404"));
  });

  it("сетевой сбой: null, без исключения", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(await fetchVehicleRecord(1, "12가3456")).toBeNull();
  });

  it("без id или номера запрос не уходит", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchVehicleRecord(undefined, "12가3456")).toBeNull();
    expect(await fetchVehicleRecord(1, undefined)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
