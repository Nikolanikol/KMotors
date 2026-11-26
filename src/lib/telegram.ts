// Единый клиент Telegram Bot API.
//
// До 27.11.2026 отправка была размножена в 12 копиях (по одной на роут), и у каждой
// свой токен, свой чат, свой parse_mode и своя политика ошибок. Здесь собрана только
// механика: адрес, заголовки, JSON, таймаут. КУДА слать (чат), КАК (parse_mode) и ЧТО
// делать при сбое — всегда решает вызывающий, параметрами. Это принципиально:
// у лидов, рабочего чата, SEO-гейта и канального постера чаты РАЗНЫЕ, и общий
// клиент не должен выбирать чат за них. Чаты не сливать.
//
// Токен берётся из TELEGRAM_BOT_TOKEN в момент вызова (а не при загрузке модуля);
// опция `token` перекрывает его. Без токена запрос уходит как есть (на «botundefined»
// и получает {ok:false}) — как и в прежних копиях; защиту «нет токена — молча выйти»
// каждый вызывающий оставляет у себя.

const API_ROOT = "https://api.telegram.org";

export interface TelegramResult {
  ok?: boolean;
  description?: string;
  [key: string]: unknown;
}

export interface TelegramRequestOptions {
  /** Токен бота; по умолчанию TELEGRAM_BOT_TOKEN. */
  token?: string;
  /** Таймаут в мс (AbortSignal.timeout). Без него — как у голого fetch. */
  timeoutMs?: number;
}

/**
 * Низкоуровневый вызов метода Bot API. Возвращает СЫРОЙ Response: тело не читает,
 * `res.ok` не проверяет, ошибок не глотает — сетевой сбой и таймаут бросаются.
 * Нужен тем, кто сам решает, разбирать ли ответ (постер, ответы на колбэки).
 */
export function telegramRequest(
  method: string,
  payload: Record<string, unknown>,
  opts: TelegramRequestOptions = {},
): Promise<Response> {
  const token = opts.token ?? process.env.TELEGRAM_BOT_TOKEN;
  return fetch(`${API_ROOT}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    ...(opts.timeoutMs ? { signal: AbortSignal.timeout(opts.timeoutMs) } : {}),
  });
}

export interface SendTelegramOptions extends TelegramRequestOptions {
  text: string;
  chatId: string | number;
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  replyMarkup?: object;
  disableWebPagePreview?: boolean;
  /** Любые другие поля sendMessage; ложатся в тело ПОСЛЕДНИМИ и могут перекрыть прочие. */
  extra?: Record<string, unknown>;
  /**
   * Что делать при сетевом сбое, таймауте и нечитаемом ответе:
   * "throw" (по умолчанию) — бросить; "swallow" — вернуть `{ ok: false }`.
   */
  onError?: "throw" | "swallow";
  /** Если задан и Telegram ответил `ok: false` — console.error(logLabel, JSON ответа). */
  logLabel?: string;
}

/**
 * sendMessage. Возвращает разобранный ответ Telegram (`ok`, `description`, …).
 * `ok: false` от самого Telegram НЕ бросает — это решение вызывающего.
 */
export async function sendTelegram(o: SendTelegramOptions): Promise<TelegramResult> {
  try {
    const res = await telegramRequest(
      "sendMessage",
      {
        chat_id: o.chatId,
        text: o.text,
        parse_mode: o.parseMode,
        reply_markup: o.replyMarkup,
        disable_web_page_preview: o.disableWebPagePreview,
        ...o.extra,
      },
      { token: o.token, timeoutMs: o.timeoutMs },
    );
    const data = (await res.json()) as TelegramResult;
    if (!data.ok && o.logLabel) console.error(o.logLabel, JSON.stringify(data));
    return data;
  } catch (e) {
    if (o.onError === "swallow") return { ok: false };
    throw e;
  }
}
