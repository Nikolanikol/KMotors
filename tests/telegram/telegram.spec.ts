import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendTelegram, telegramRequest } from "@/lib/telegram";

/** Достаёт из последнего вызова fetch адрес, заголовки, тело и сигнал. */
function lastCall(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return {
    url,
    init,
    body: JSON.parse(String(init.body)) as Record<string, unknown>,
  };
}

const okResponse = (data: object = { ok: true }) =>
  Promise.resolve(new Response(JSON.stringify(data), { status: 200 }));

describe("telegramRequest", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset().mockImplementation(() => okResponse());
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "ENV_TOKEN");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("строит адрес из токена окружения и шлёт JSON POST", async () => {
    await telegramRequest("answerCallbackQuery", { callback_query_id: "1" });
    const c = lastCall(fetchMock);
    expect(c.url).toBe("https://api.telegram.org/botENV_TOKEN/answerCallbackQuery");
    expect(c.init.method).toBe("POST");
    expect(c.init.headers).toEqual({ "Content-Type": "application/json" });
    expect(c.body).toEqual({ callback_query_id: "1" });
  });

  it("опция token перекрывает окружение", async () => {
    await telegramRequest("sendPhoto", { chat_id: 1 }, { token: "OWN" });
    expect(lastCall(fetchMock).url).toBe("https://api.telegram.org/botOWN/sendPhoto");
  });

  it("без timeoutMs сигнала нет, с ним — есть", async () => {
    await telegramRequest("sendMessage", {});
    expect(lastCall(fetchMock).init.signal).toBeUndefined();
    await telegramRequest("sendMessage", {}, { timeoutMs: 5000 });
    expect(lastCall(fetchMock).init.signal).toBeInstanceOf(AbortSignal);
  });

  it("возвращает сырой Response и не проверяет res.ok", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: false }), { status: 400 })),
    );
    const res = await telegramRequest("sendMessage", {});
    expect(res.status).toBe(400);
  });
});

describe("sendTelegram", () => {
  const fetchMock = vi.fn();
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchMock.mockReset().mockImplementation(() => okResponse());
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "ENV_TOKEN");
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    errorSpy.mockRestore();
  });

  it("минимальное тело: только chat_id и text, без parse_mode", async () => {
    await sendTelegram({ text: "привет", chatId: "-100" });
    const c = lastCall(fetchMock);
    expect(c.url).toBe("https://api.telegram.org/botENV_TOKEN/sendMessage");
    expect(c.body).toEqual({ chat_id: "-100", text: "привет" });
    expect("parse_mode" in c.body).toBe(false);
  });

  it("parse_mode, клавиатура и отключение превью попадают в тело", async () => {
    const markup = { inline_keyboard: [[{ text: "x", callback_data: "y" }]] };
    await sendTelegram({
      text: "t",
      chatId: 42,
      parseMode: "HTML",
      replyMarkup: markup,
      disableWebPagePreview: true,
    });
    expect(lastCall(fetchMock).body).toEqual({
      chat_id: 42,
      text: "t",
      parse_mode: "HTML",
      reply_markup: markup,
      disable_web_page_preview: true,
    });
  });

  it("extra ложится последним и может перекрыть parse_mode", async () => {
    await sendTelegram({
      text: "t",
      chatId: 1,
      parseMode: "HTML",
      extra: { parse_mode: "MarkdownV2", reply_to_message_id: 7 },
    });
    expect(lastCall(fetchMock).body).toMatchObject({
      parse_mode: "MarkdownV2",
      reply_to_message_id: 7,
    });
  });

  it("чат выбирает вызывающий: два чата — два разных запроса", async () => {
    await Promise.all(["-1", "-2"].map((chatId) => sendTelegram({ text: "lead", chatId })));
    const chats = fetchMock.mock.calls.map(
      (c) => JSON.parse(String((c[1] as RequestInit).body)).chat_id,
    );
    expect(chats.sort()).toEqual(["-1", "-2"]);
  });

  it("токен из опции: другой бот", async () => {
    await sendTelegram({ text: "t", chatId: 1, token: "OTHER" });
    expect(lastCall(fetchMock).url).toContain("/botOTHER/");
  });

  it("timeoutMs подключает сигнал", async () => {
    await sendTelegram({ text: "t", chatId: 1, timeoutMs: 8000 });
    expect(lastCall(fetchMock).init.signal).toBeInstanceOf(AbortSignal);
  });

  it("ok:false от Telegram не бросает, возвращается как есть", async () => {
    fetchMock.mockImplementation(() => okResponse({ ok: false, description: "chat not found" }));
    const r = await sendTelegram({ text: "t", chatId: 1 });
    expect(r).toEqual({ ok: false, description: "chat not found" });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("logLabel: при ok:false пишет в console.error, при ok:true молчит", async () => {
    fetchMock.mockImplementationOnce(() => okResponse({ ok: false, description: "bad" }));
    await sendTelegram({ text: "t", chatId: 1, logLabel: "[x]" });
    expect(errorSpy).toHaveBeenCalledWith("[x]", JSON.stringify({ ok: false, description: "bad" }));

    errorSpy.mockClear();
    await sendTelegram({ text: "t", chatId: 1, logLabel: "[x]" });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("по умолчанию сетевой сбой бросается", async () => {
    fetchMock.mockImplementation(() => Promise.reject(new Error("network down")));
    await expect(sendTelegram({ text: "t", chatId: 1 })).rejects.toThrow("network down");
  });

  it('onError:"swallow" глотает сетевой сбой и нечитаемый ответ', async () => {
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error("network down")));
    expect(await sendTelegram({ text: "t", chatId: 1, onError: "swallow" })).toEqual({ ok: false });

    fetchMock.mockImplementationOnce(() =>
      Promise.resolve(new Response("<html>502</html>", { status: 502 })),
    );
    expect(await sendTelegram({ text: "t", chatId: 1, onError: "swallow" })).toEqual({ ok: false });
  });
});
