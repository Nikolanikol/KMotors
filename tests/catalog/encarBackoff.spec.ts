import { describe, expect, it, vi } from "vitest";
import {
  BACKOFF_CAP_MS,
  RATE_LIMIT_RETRIES,
  backoffMs,
  fetchWithBackoff,
  isRateLimited,
} from "@/lib/encarBackoff";

const res = (status: number, headers: Record<string, string> = {}) =>
  new Response(status === 204 ? null : "{}", { status, headers });

describe("backoffMs", () => {
  it("без Retry-After — экспонента 2 → 4 → 8 с, не больше потолка", () => {
    expect(backoffMs(0)).toBe(2_000);
    expect(backoffMs(1)).toBe(4_000);
    expect(backoffMs(2)).toBe(8_000);
    expect(backoffMs(10)).toBe(BACKOFF_CAP_MS);
  });

  it("Retry-After в секундах слушаем, но не дольше потолка и не короче пола", () => {
    expect(backoffMs(0, "3")).toBe(3_000);
    expect(backoffMs(0, "120")).toBe(BACKOFF_CAP_MS);
    expect(backoffMs(0, "0")).toBe(500);
  });

  it("Retry-After датой: разница с «сейчас»", () => {
    const now = Date.parse("2026-11-27T06:00:00Z");
    expect(backoffMs(0, "Fri, 27 Nov 2026 06:00:05 GMT", now)).toBe(5_000);
    // дата в прошлом — пол
    expect(backoffMs(0, "Fri, 27 Nov 2026 05:00:00 GMT", now)).toBe(500);
  });

  it("мусор в Retry-After — обычная экспонента", () => {
    expect(backoffMs(1, "скоро")).toBe(4_000);
    expect(backoffMs(0, "")).toBe(2_000);
    expect(backoffMs(0, null)).toBe(2_000);
  });
});

describe("isRateLimited", () => {
  it("429 и 503 — подождать; остальное — нет", () => {
    expect(isRateLimited(429)).toBe(true);
    expect(isRateLimited(503)).toBe(true);
    for (const s of [200, 403, 404, 500, 502]) expect(isRateLimited(s)).toBe(false);
  });
});

describe("fetchWithBackoff", () => {
  it("429 → пауза по Retry-After → повтор → 200: один повтор", async () => {
    const sleep = vi.fn(async (_ms: number) => {});
    const doFetch = vi.fn().mockResolvedValueOnce(res(429, { "retry-after": "2" })).mockResolvedValueOnce(res(200));
    const out = await fetchWithBackoff(doFetch, { sleep });
    expect(out.res.status).toBe(200);
    expect(out.retries).toBe(1);
    expect(sleep).toHaveBeenCalledWith(2_000);
  });

  it("429 не отпускает — после RATE_LIMIT_RETRIES повторов возвращаем последний 429", async () => {
    const sleep = vi.fn(async (_ms: number) => {});
    const doFetch = vi.fn().mockImplementation(async () => res(429));
    const out = await fetchWithBackoff(doFetch, { sleep });
    expect(out.res.status).toBe(429);
    expect(out.retries).toBe(RATE_LIMIT_RETRIES);
    expect(doFetch).toHaveBeenCalledTimes(RATE_LIMIT_RETRIES + 1);
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([2_000, 4_000, 8_000]);
  });

  it("обычные ответы (200, 404, 500) не повторяются", async () => {
    for (const status of [200, 404, 500]) {
      const sleep = vi.fn(async (_ms: number) => {});
      const doFetch = vi.fn().mockResolvedValue(res(status));
      const out = await fetchWithBackoff(doFetch, { sleep });
      expect(out.retries).toBe(0);
      expect(doFetch).toHaveBeenCalledTimes(1);
      expect(sleep).not.toHaveBeenCalled();
    }
  });

  it("сетевой сбой не повторяется: исключение уходит наверх, источник считается недоступным", async () => {
    const sleep = vi.fn(async (_ms: number) => {});
    const doFetch = vi.fn().mockRejectedValue(new Error("fetch failed"));
    await expect(fetchWithBackoff(doFetch, { sleep })).rejects.toThrow("fetch failed");
    expect(doFetch).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("onRetry получает номер попытки, статус и паузу", async () => {
    const onRetry = vi.fn();
    const doFetch = vi.fn().mockResolvedValueOnce(res(503)).mockResolvedValueOnce(res(200));
    await fetchWithBackoff(doFetch, { sleep: async () => {}, onRetry });
    expect(onRetry).toHaveBeenCalledWith({ attempt: 1, status: 503, waitMs: 2_000 });
  });
});
