// Сторона менеджера: закрытая форум-группа, тема на каждого клиента.
//
//   клиент пишет боту  → бот копирует сообщение в тему клиента;
//   менеджер пишет в теме → бот копирует сообщение клиенту от имени бота;
//   сообщение менеджера, начатое с «!» или «/», — заметка: клиенту НЕ уходит.
//
// В начале темы — шапка: кто клиент, с чем пришёл, ответы на вопросы и кнопки
// статуса (Беру / Договор / Отказ). Статус живёт в tg_bot_clients.
//
// Группа не настроена (нет TELEGRAM_INBOX_CHAT_ID) или Telegram отказал в теме —
// бот откатывается на прежнее поведение: шлёт уведомления в чаты admins, а
// менеджер пишет клиенту напрямую по ссылке tg://user. Сообщение клиента не
// теряется ни в одной ветке — это главное требование.

import { SITE_URL } from "@/lib/site";
import { telegramChatId, telegramChatIds } from "@/lib/telegramChats";
import { send, edit, tg, isBlocked, type Keyboard, type TgCall } from "./api";
import { updateClient, getClientByTopic, type BotClient, type BotStatus } from "./store";
import { esc, labelOf, COUNTRIES, BUDGETS, TIMEFRAMES } from "./texts";

const STATUS_LABEL: Record<BotStatus, string> = {
  new: "🆕 новая",
  in_work: "🔵 в работе",
  deal: "✅ договор",
  lost: "❌ отказ",
};

const SOURCE_LABEL: Record<string, string> = {
  car: "кнопка Telegram на машине",
  sold: "страница проданной машины",
  part: "страница запчасти",
  website: "плавающая кнопка сайта",
  direct: "написал боту сам",
};

export function inboxChatId(): string | null {
  return telegramChatId("inbox");
}

function clientName(c: BotClient): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Без имени";
}

function sourceKind(source: string | null): string {
  if (!source) return "direct";
  const k = source.split("_")[0];
  return SOURCE_LABEL[k] ? k : "direct";
}

/** Текст шапки темы — всё, что менеджеру надо знать о клиенте, на одном экране. */
export function headerText(c: BotClient, inTopic = true): string {
  const lines = [
    // Ссылка tg://user — в тексте, не кнопкой: кнопку Telegram отвергает целиком
    // (BUTTON_USER_PRIVACY_RESTRICTED), если клиент закрыл профиль, и шапка не встала бы.
    `👤 <b>${esc(clientName(c))}</b>${c.username ? ` (@${esc(c.username)})` : ""} · <a href="tg://user?id=${c.chat_id}">профиль</a>`,
    `🗣 ${c.lang.toUpperCase()} · откуда: ${SOURCE_LABEL[sourceKind(c.source)]}`,
  ];
  if (c.car_id || c.car_name) {
    lines.push(
      `🚗 ${esc(c.car_name || `машина №${c.car_id}`)}` +
        (c.car_id ? ` — <a href="${SITE_URL}/ru/catalog/${encodeURIComponent(c.car_id)}">на сайте</a>` : ""),
    );
  }
  if (c.part_number) lines.push(`🔧 Деталь: <code>${esc(c.part_number)}</code>`);
  const answers = [
    c.country && `🌍 ${labelOf(COUNTRIES, c.country, "ru")}`,
    c.budget && `💰 ${labelOf(BUDGETS, c.budget, "ru")}`,
    c.timeframe && `⏱ ${labelOf(TIMEFRAMES, c.timeframe, "ru")}`,
  ].filter(Boolean);
  if (answers.length) lines.push(answers.join(" · "));
  if (!inTopic) return lines.join("\n");
  lines.push("", `Статус: <b>${STATUS_LABEL[c.status]}</b>${c.taken_by ? ` · ведёт ${esc(c.taken_by)}` : ""}`);
  lines.push(
    "",
    "<i>Пишите в этой теме — бот перешлёт клиенту. Начните сообщение с «!» — это заметка, клиенту не уйдёт.</i>",
  );
  return lines.join("\n");
}

function headerKeyboard(c: BotClient): Keyboard {
  return [
    [
      { text: "✋ Беру", callback_data: `m:take:${c.chat_id}` },
      { text: "✅ Договор", callback_data: `m:deal:${c.chat_id}` },
      { text: "❌ Отказ", callback_data: `m:lost:${c.chat_id}` },
    ],
  ];
}

/** Обновить шапку темы после смены статуса или ответов клиента. */
export async function refreshHeader(c: BotClient): Promise<void> {
  const inbox = inboxChatId();
  if (!inbox || !c.header_message_id) return;
  await edit(inbox, c.header_message_id, headerText(c), headerKeyboard(c));
}

/**
 * Тема клиента: существующая или новая. null — группы нет или Telegram отказал
 * (бот не админ, у группы выключены темы); тогда вызывающий уходит в фолбэк.
 */
export async function ensureTopic(c: BotClient): Promise<number | null> {
  const inbox = inboxChatId();
  if (!inbox) return null;
  if (c.topic_id) return c.topic_id;

  const title = [clientName(c), c.car_name || (c.part_number ? `деталь ${c.part_number}` : "")]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 120);
  const created = await tg("createForumTopic", { chat_id: inbox, name: title });
  const topicId = created.ok ? (created.result?.message_thread_id as number | undefined) : undefined;
  if (!topicId) return null;

  c.topic_id = topicId;
  const head = await send(inbox, headerText(c), headerKeyboard(c), { message_thread_id: topicId });
  c.header_message_id = head.ok ? (head.result?.message_id as number) : null;
  await updateClient(c.chat_id, { topic_id: topicId, header_message_id: c.header_message_id });
  return topicId;
}

function threadGone(r: TgCall): boolean {
  return !r.ok && /thread|topic/i.test(r.description ?? "");
}

/** Служебная строка в тему клиента (или админам, если темы нет). */
export async function notifyManagers(c: BotClient, text: string): Promise<void> {
  const inbox = inboxChatId();
  let topicId = await ensureTopic(c);
  if (inbox && topicId) {
    let r = await send(inbox, text, undefined, { message_thread_id: topicId });
    // Тему удалили руками — заводим новую и повторяем один раз.
    if (threadGone(r)) {
      c.topic_id = null;
      await updateClient(c.chat_id, { topic_id: null, header_message_id: null });
      topicId = await ensureTopic(c);
      if (topicId) r = await send(inbox, text, undefined, { message_thread_id: topicId });
    }
    if (r.ok) return;
  }
  await notifyAdminsFallback(c, text);
}

// Без группы менеджер не видит шапку темы, поэтому кладём её в каждое уведомление:
// кто клиент, с какой машиной или деталью, что ответил на вопросы. Кнопок статуса
// здесь нет — статус без темы вести негде.
async function notifyAdminsFallback(c: BotClient, text: string): Promise<void> {
  const body = `${text}\n\n${headerText(c, false)}`;
  await Promise.all(telegramChatIds("admins").map((id) => send(id, body)));
}

/** Копия сообщения клиента в его тему. Без группы — пересылка админам. */
export async function relayFromClient(c: BotClient, messageId: number): Promise<void> {
  const inbox = inboxChatId();
  let topicId = await ensureTopic(c);
  if (inbox && topicId) {
    let r = await tg("copyMessage", { chat_id: inbox, from_chat_id: c.chat_id, message_id: messageId, message_thread_id: topicId });
    if (threadGone(r)) {
      c.topic_id = null;
      await updateClient(c.chat_id, { topic_id: null, header_message_id: null });
      topicId = await ensureTopic(c);
      if (topicId) r = await tg("copyMessage", { chat_id: inbox, from_chat_id: c.chat_id, message_id: messageId, message_thread_id: topicId });
    }
    if (r.ok) return;
  }
  // Фолбэк: подпись + пересылка оригинала в личный и рабочий чаты.
  const admins = telegramChatIds("admins");
  await Promise.all(
    admins.map(async (id) => {
      await send(id, `💬 <b>Сообщение в боте</b> от ${esc(clientName(c))}${c.username ? ` (@${esc(c.username)})` : ""} · <a href="tg://user?id=${c.chat_id}">ответить</a>`);
      await tg("forwardMessage", { chat_id: id, from_chat_id: c.chat_id, message_id: messageId });
    }),
  );
}

// ── Апдейты из группы менеджеров ─────────────────────────────────────────────

interface GroupMessage {
  message_id: number;
  message_thread_id?: number;
  is_topic_message?: boolean;
  text?: string;
  caption?: string;
  from?: { id: number; is_bot?: boolean; first_name?: string };
  chat: { id: number };
  [k: string]: unknown;
}

// То, что имеет смысл переслать клиенту. Служебные сообщения (тема создана,
// закреп, вступление в группу) сюда не попадают.
const CONTENT_KEYS = ["text", "photo", "document", "video", "voice", "audio", "animation", "sticker", "video_note", "location", "contact"];

export function isInboxChat(chatId: number | undefined): boolean {
  const inbox = inboxChatId();
  return !!inbox && chatId !== undefined && String(chatId) === String(inbox);
}

/** Сообщение менеджера в теме → клиенту. */
export async function handleInboxMessage(m: GroupMessage): Promise<void> {
  if (m.from?.is_bot) return;
  if (!m.is_topic_message || !m.message_thread_id) return;
  if (!CONTENT_KEYS.some((k) => k in m)) return;
  const body = (m.text ?? m.caption ?? "").trim();
  if (body.startsWith("!") || body.startsWith("/")) return;

  const c = await getClientByTopic(m.message_thread_id);
  if (!c) return;

  const r = await tg("copyMessage", { chat_id: c.chat_id, from_chat_id: m.chat.id, message_id: m.message_id });
  if (!r.ok) {
    if (isBlocked(r)) await updateClient(c.chat_id, { blocked: true });
    await send(m.chat.id, isBlocked(r) ? "⚠️ Клиент заблокировал бота — сообщение не доставлено." : `⚠️ Не доставлено: ${esc(r.description ?? "ошибка Telegram")}`, undefined, {
      message_thread_id: m.message_thread_id,
      reply_to_message_id: m.message_id,
    });
    return;
  }

  // Первый ответ менеджера сам переводит заявку в работу.
  const patch: Partial<BotClient> = { last_manager_msg_at: new Date().toISOString() };
  if (c.status === "new") {
    patch.status = "in_work";
    patch.taken_by = c.taken_by ?? m.from?.first_name ?? null;
  }
  await updateClient(c.chat_id, patch);
  if (patch.status) await refreshHeader({ ...c, ...patch });
}

/** Кнопки статуса в шапке темы. Возвращает текст всплывашки. */
export async function handleManagerCallback(
  data: string,
  from: { first_name?: string } | undefined,
  getClient: (id: number) => Promise<BotClient | null>,
): Promise<string> {
  const [, action, idRaw] = data.split(":");
  const c = await getClient(Number(idRaw));
  if (!c) return "Клиент не найден";
  const status: BotStatus | null = action === "take" ? "in_work" : action === "deal" ? "deal" : action === "lost" ? "lost" : null;
  if (!status) return "";
  const patch: Partial<BotClient> = { status, taken_by: from?.first_name ?? c.taken_by };
  await updateClient(c.chat_id, patch);
  await refreshHeader({ ...c, ...patch });
  return `Статус: ${STATUS_LABEL[status]}`;
}
