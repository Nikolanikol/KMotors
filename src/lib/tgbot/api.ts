// Вызовы Bot API для клиентского бота. Поверх механического `telegramRequest`:
// разбирают ответ и НИКОГДА не бросают — бот не должен ронять вебхук, иначе
// Telegram начнёт ретраить апдейт и клиент получит ответ дважды.

import { telegramRequest, type TelegramResult } from "@/lib/telegram";

export type Keyboard = { text: string; callback_data?: string; url?: string }[][];

export interface TgCall extends TelegramResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any;
  error_code?: number;
}

export async function tg(method: string, payload: Record<string, unknown>): Promise<TgCall> {
  try {
    const res = await telegramRequest(method, payload, { timeoutMs: 10_000 });
    const data = (await res.json()) as TgCall;
    if (!data.ok) console.error(`[tgbot] ${method}:`, data.error_code, data.description);
    return data;
  } catch (e) {
    console.error(`[tgbot] ${method} упал:`, (e as Error)?.message);
    return { ok: false };
  }
}

export function send(
  chatId: number | string,
  text: string,
  keyboard?: Keyboard,
  extra: Record<string, unknown> = {},
): Promise<TgCall> {
  return tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
    ...extra,
  });
}

export function edit(chatId: number | string, messageId: number, text: string, keyboard?: Keyboard): Promise<TgCall> {
  return tg("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: keyboard ?? [] },
  });
}

export function answerCallback(id: string, text?: string): Promise<TgCall> {
  return tg("answerCallbackQuery", { callback_query_id: id, ...(text ? { text } : {}) });
}

/** Клиент заблокировал бота или удалил аккаунт — писать ему бесполезно. */
export function isBlocked(r: TgCall): boolean {
  return r.error_code === 403;
}
