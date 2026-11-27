import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Supabase и Telegram подменены: тест не ходит ни в базу, ни в сеть.
const insert = vi.fn();
vi.mock("@/lib/supabase", () => ({
  createServerClient: () => ({ from: () => ({ insert }) }),
}));
const sendTelegram = vi.fn();
vi.mock("@/lib/telegram", () => ({ sendTelegram: (...a: unknown[]) => sendTelegram(...a) }));

import { POST } from "@/app/api/telegram/route";

let ipSeq = 0;
function post(body: unknown, ip = `10.0.0.${++ipSeq}`) {
  return POST(
    new NextRequest("http://localhost/api/telegram", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": ip },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );
}

const ok = { name: "Иван", phone: "+79000000000", source: "parts_no_results" };

beforeEach(() => {
  insert.mockReset().mockResolvedValue({ error: null });
  sendTelegram.mockReset().mockResolvedValue({ ok: true });
  vi.stubEnv("TELEGRAM_BOT_TOKEN", "T");
  vi.stubEnv("TELEGRAM_CHAT_ID", "111");
  vi.stubEnv("TELEGRAM_WORK_CHAT_ID", "222");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/telegram", () => {
  it("неверные типы полей — 400", async () => {
    expect((await post({ ...ok, name: 123 })).status).toBe(400);
    expect((await post({ ...ok, message: { a: 1 } })).status).toBe(400);
    expect((await post("[1,2]")).status).toBe(400);
    expect((await post("не json")).status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it("без имени или телефона — 400", async () => {
    expect((await post({ phone: "1" })).status).toBe(400);
    expect((await post({ name: "a" })).status).toBe(400);
  });

  it("сначала лид в базу, потом во все чаты, с таймаутом и swallow", async () => {
    const res = await post(ok);
    expect(res.status).toBe(200);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(sendTelegram).toHaveBeenCalledTimes(2);
    const arg = sendTelegram.mock.calls[0][0] as Record<string, unknown>;
    expect(arg.timeoutMs).toBe(8000);
    expect(arg.onError).toBe("swallow");
    expect(arg.parseMode).toBeUndefined();
    expect(String(arg.text)).toContain("ничего не найдено");
    expect(insert.mock.invocationCallOrder[0]).toBeLessThan(sendTelegram.mock.invocationCallOrder[0]);
  });

  it("Telegram упал, но лид сохранён — успех", async () => {
    sendTelegram.mockResolvedValue({ ok: false });
    expect((await post(ok)).status).toBe(200);
  });

  it("база упала, но Telegram принял — успех", async () => {
    insert.mockResolvedValue({ error: { message: "db down" } });
    expect((await post(ok)).status).toBe(200);
  });

  it("не сохранён и не доставлен — 500 без деталей", async () => {
    insert.mockRejectedValue(new Error("секрет базы"));
    sendTelegram.mockResolvedValue({ ok: false, description: "секрет telegram" });
    const res = await post(ok);
    expect(res.status).toBe(500);
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain("секрет");
  });

  it("длинный комментарий режется в Telegram, но полностью лежит в leads", async () => {
    const message = "x".repeat(5000);
    await post({ ...ok, message });
    expect((insert.mock.calls[0][0] as { message: string }).message).toHaveLength(5000);
    const text = String((sendTelegram.mock.calls[0][0] as { text: string }).text);
    expect(text).toContain("обрезан");
    expect(text.length).toBeLessThanOrEqual(4000);
  });

  it("tg_username проверяется по маске, мусорный source уходит в unknown", async () => {
    await post({ ...ok, source: "что-то левое", messenger: "telegram", tg_username: "bad name!" });
    const row = insert.mock.calls[0][0] as { tg_username: unknown; source_page: string };
    expect(row.tg_username).toBeNull();
    expect(row.source_page).toBe("unknown");
    await post({ ...ok, messenger: "telegram", tg_username: "@good_name" });
    expect((insert.mock.calls[1][0] as { tg_username: string }).tg_username).toBe("good_name");
  });

  it("источник без подписи сохраняется как есть (по нему считают воронки)", async () => {
    await post({ ...ok, source: "parts_price_request" });
    expect((insert.mock.calls[0][0] as { source_page: string }).source_page).toBe("parts_price_request");
    expect(String((sendTelegram.mock.calls[0][0] as { text: string }).text)).toContain("parts_price_request");
  });

  it("слишком большое тело — 413", async () => {
    const res = await post({ ...ok, message: "y".repeat(40_000) });
    expect(res.status).toBe(413);
  });

  it("больше лимита с одного IP — 429", async () => {
    const ip = "203.0.113.9";
    const codes: number[] = [];
    for (let i = 0; i < 10; i++) codes.push((await post(ok, ip)).status);
    expect(codes.slice(0, 8).every((c) => c === 200)).toBe(true);
    expect(codes[9]).toBe(429);
  });
});
