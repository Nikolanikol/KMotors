import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  approveBatch, rejectBatch, approveOne, rejectOne, sendItemMessages, sendSeoDigest,
} from "@/lib/seo-telegram";
import { publishApproved } from "@/lib/seo-publish";
import { deactivateAllForChat, deactivateOwn } from "@/lib/savedSearches";
import { SITE_URL } from "@/lib/site";
import { sendTelegram, telegramRequest } from "@/lib/telegram";
import { telegramChatId, telegramChatIds } from "@/lib/telegramChats";
import { handleStart, handleClientMessage, handleClientCallback } from "@/lib/tgbot/flows";
import { isInboxChat, handleInboxMessage, handleManagerCallback } from "@/lib/tgbot/inbox";
import { getClient as getBotClient } from "@/lib/tgbot/store";

// Все администраторы — могут получать уведомления и запускать команды
function isAdmin(chatId: number) {
  return telegramChatIds("admins").some(id => String(chatId) === String(id));
}

function ok() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

async function sendMessage(chatId: number, text: string, extra?: Record<string, unknown>) {
  return sendTelegram({
    text,
    chatId,
    parseMode: "HTML",
    extra,
    logLabel: "Telegram sendMessage error:",
  });
}

export async function GET() {
  // Никогда не отдаём реальные значения env — только факт наличия
  return NextResponse.json({
    ok: true,
    env: {
      hasToken:   !!process.env.TELEGRAM_BOT_TOKEN,
      hasChatId:  telegramChatId("admins") !== null,
      hasSecret:  !!process.env.TELEGRAM_WEBHOOK_SECRET,
      hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
    },
    version: "v4",
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  // Секрет обязателен — если не задан в env, отклоняем все запросы
  if (!expectedSecret || secret !== expectedSecret) {
    console.warn("Telegram webhook: invalid or missing secret token");
    return ok(); // Возвращаем 200 чтобы Telegram не ретраил
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return ok();
  }

  // Обработка команд (/generate, /topics, /status)
  const message = body?.message as
    | {
        text?: string;
        chat?: { id: number; type?: string };
        message_id?: number;
        message_thread_id?: number;
        is_topic_message?: boolean;
        from?: { id: number; is_bot?: boolean; first_name?: string; last_name?: string; username?: string; language_code?: string };
        [k: string]: unknown;
      }
    | undefined;

  // Группа менеджеров: сообщения в темах клиентов уходят клиентам.
  if (message?.chat && isInboxChat(message.chat.id)) {
    await handleInboxMessage(message as Parameters<typeof handleInboxMessage>[0]);
    return ok();
  }

  // Личка с ботом, не команда (текст, фото, файл, голосовое) — это клиент.
  // Раньше такие сообщения молча отбрасывались гейтом isAdmin ниже, хотя бот
  // сам писал «просто напишите в этот чат». Команды админов начинаются с «/».
  if (
    message?.chat?.type === "private" &&
    message.message_id &&
    message.from &&
    !message.from.is_bot &&
    !(message.text ?? "").trim().startsWith("/")
  ) {
    await handleClientMessage(message as Parameters<typeof handleClientMessage>[0]);
    return ok();
  }

  // DEBUG: только для администраторов и без утечки sensitive данных
  if (message?.text?.startsWith("/debug")) {
    const chatId = message.chat?.id;
    if (!chatId || !isAdmin(chatId)) return ok();
    return NextResponse.json({
      ok: true,
      debug: {
        text: message.text,
        isAdmin: isAdmin(chatId),
        hasToken: !!process.env.TELEGRAM_BOT_TOKEN,
      }
    });
  }

  if (message?.text && message.chat?.id) {
    const chatId = message.chat.id;

    // /myid — любой пользователь получает свой chat_id (для настройки)
    if (message.text.trim() === "/myid") {
      await sendMessage(chatId, `🆔 Ваш chat_id: <code>${chatId}</code>`);
      return ok();
    }

    // /stop — отписка от рассылки похожих машин. Публичная команда, поэтому
    // стоит ДО гейта isAdmin, рядом с /start.
    if (message.text.trim() === "/stop") {
      const n = await deactivateAllForChat(chatId);
      await sendMessage(
        chatId,
        n > 0
          ? `✅ Отписал вас от подбора похожих машин (подписок: ${n}).\n\nЕсли передумаете — нажмите «Пришлите похожие» на любой странице проданной машины.`
          : `У вас нет активных подписок на подбор машин.`
      );
      return ok();
    }

    // /start от клиентов — ДО проверки на владельца. Диалог ведёт src/lib/tgbot:
    // карточка машины с ценой, вопросы кнопками, тема клиента в группе менеджеров.
    if (message.text.startsWith("/start")) {
      const param = message.text.slice("/start".length).trim(); // "car_41289593", "sold_…", "part_…", "website" или ""
      if (message.from) await handleStart(message.from, param);
      return ok();
    }


    // Защита — только для администраторов
    if (telegramChatIds("admins").length > 0 && !isAdmin(chatId)) {
      return ok();
    }

    const text = message.text.trim();

    if (text === "/generate" || text === "/gen") {
      await handleGenerateCommand(chatId);
      return ok();
    }

    if (text === "/topics") {
      await handleTopicsCommand(chatId);
      return ok();
    }

    if (text === "/status") {
      await handleStatusCommand(chatId);
      return ok();
    }

    if (text === "/seo") {
      await handleSeoCommand(chatId);
      return ok();
    }

    if (text === "/ping") {
      const r = await sendMessage(chatId, "🏓 pong");
      return NextResponse.json({ ok: true, telegram: r });
    }

    if (text === "/help") {
      await sendMessage(chatId,
        `🤖 <b>K-Axis Blog Bot</b>\n\n` +
        `/generate — сгенерировать следующую статью\n` +
        `/topics — список ближайших тем\n` +
        `/status — статистика блога\n` +
        `/help — это сообщение`
      );
      return ok();
    }
  }

  // Обработка нажатий кнопок (publish / delete)
  const callbackQuery = body?.callback_query as
    | {
        id: string;
        data: string;
        from?: { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string };
        message?: { message_id: number; chat?: { id: number } };
      }
    | undefined;

  if (!callbackQuery) return ok();

  // Кнопки клиента в боте («b:…») — до гейта isAdmin.
  if (callbackQuery.data?.startsWith("b:") && callbackQuery.from) {
    await handleClientCallback({ ...callbackQuery, from: callbackQuery.from });
    return ok();
  }

  // Кнопки статуса в шапке темы («m:…») — только из группы менеджеров.
  if (callbackQuery.data?.startsWith("m:")) {
    if (!isInboxChat(callbackQuery.message?.chat?.id)) {
      await telegramRequest("answerCallbackQuery", { callback_query_id: callbackQuery.id, text: "⛔ Нет доступа" });
      return ok();
    }
    const note = await handleManagerCallback(callbackQuery.data, callbackQuery.from, getBotClient);
    await telegramRequest("answerCallbackQuery", { callback_query_id: callbackQuery.id, text: note });
    return ok();
  }

  const callbackId = callbackQuery.id;
  const data = callbackQuery.data || "";
  const messageId = callbackQuery.message?.message_id;
  const chatId = callbackQuery.message?.chat?.id;

  // «Отписаться» под рассылкой похожих машин — кнопка ОБЫЧНОГО пользователя,
  // поэтому обрабатывается до гейта isAdmin. Отписать можно только свои
  // подписки: сверяем chat_id из подписки с тем, кто нажал.
  if (chatId && data.startsWith("unsub:")) {
    const subId = Number(data.slice("unsub:".length));
    const ok0 = Number.isFinite(subId) && (await deactivateOwn(subId, chatId));
    await telegramRequest("answerCallbackQuery", {
      callback_query_id: callbackId,
      text: ok0 ? "Отписал. Больше не пишем." : "Подписка уже неактивна",
    });
    if (ok0 && messageId) {
      await telegramRequest("editMessageReplyMarkup", { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } });
    }
    return ok();
  }

  // Callback-кнопки (publish/delete) — только для администраторов
  if (!chatId || !isAdmin(chatId)) {
    await telegramRequest("answerCallbackQuery", { callback_query_id: callbackId, text: "⛔ Нет доступа", show_alert: true });
    return ok();
  }

  await telegramRequest("answerCallbackQuery", { callback_query_id: callbackId });

  const supabase = createServerClient();

  if (data.startsWith("publish:")) {
    const postId = data.slice("publish:".length);
    const { error } = await supabase
      .from("blog_posts")
      .update({ published: true, published_at: new Date().toISOString() })
      .eq("id", postId);

    if (error) {
      if (chatId && messageId) await editMessage(chatId, messageId, "❌ Ошибка при публикации: " + error.message);
      return ok();
    }
    if (chatId && messageId) await editMessageRemoveButtons(chatId, messageId, "✅ Опубликовано");

  } else if (data.startsWith("delete:")) {
    const postId = data.slice("delete:".length);
    const { error } = await supabase.from("blog_posts").delete().eq("id", postId);

    if (error) {
      if (chatId && messageId) await editMessage(chatId, messageId, "❌ Ошибка при удалении: " + error.message);
      return ok();
    }
    if (chatId && messageId) await editMessageRemoveButtons(chatId, messageId, "🗑 Удалено");

  // ── SEO-гейт (Фаза 4) ──────────────────────────────────────────────────────
  } else if (data.startsWith("seo_all:")) {
    const batchId = data.slice("seo_all:".length);
    const n = await approveBatch(supabase, batchId);
    const pub = await publishApproved(supabase, { batch_id: batchId });
    if (chatId && messageId) await editMessageRemoveButtons(chatId, messageId,
      `✅ Опубликовано ${pub.published}/${n}${pub.indexnow ? " · IndexNow ✓" : ""}`);

  } else if (data.startsWith("seo_none:")) {
    const n = await rejectBatch(supabase, data.slice("seo_none:".length));
    if (chatId && messageId) await editMessageRemoveButtons(chatId, messageId, `❌ Отклонено ${n}`);

  } else if (data.startsWith("seo_one:")) {
    const n = await sendItemMessages(supabase, data.slice("seo_one:".length));
    if (chatId && messageId) await editMessageRemoveButtons(chatId, messageId, `📝 Разбор по одному (${n})`);

  } else if (data.startsWith("seo_ok:")) {
    const id = Number(data.slice("seo_ok:".length));
    await approveOne(supabase, id);
    const pub = await publishApproved(supabase, { id });
    if (chatId && messageId) await editMessageRemoveButtons(chatId, messageId,
      pub.published ? `✅ Опубликовано${pub.indexnow ? " · IndexNow ✓" : ""}` : "✅ Одобрено");

  } else if (data.startsWith("seo_no:")) {
    await rejectOne(supabase, Number(data.slice("seo_no:".length)));
    if (chatId && messageId) await editMessageRemoveButtons(chatId, messageId, "❌ Отклонено");
  }

  return ok();
}

// /generate — запустить генерацию следующей статьи
async function handleGenerateCommand(chatId: number) {
  await sendMessage(chatId, "⏳ Генерирую статью, подождите 30–60 секунд...");

  try {
    const baseUrl = SITE_URL;
    // /api/blog-generate закрыт POSTER_CRON_SECRET — без заголовка получим 401.
    const res = await fetch(`${baseUrl}/api/blog-generate`, {
      method: "POST",
      headers: { "x-poster-secret": process.env.POSTER_CRON_SECRET ?? "" },
    });
    const result = await res.json();

    if (!res.ok || !result.ok) {
      await sendMessage(chatId, `❌ Ошибка генерации:\n${result.error || "Неизвестная ошибка"}`);
      return;
    }

    if (result.message === "No pending topics available") {
      await sendMessage(chatId, "📭 Все темы уже сгенерированы. Добавь новые в Supabase → blog_topics");
      return;
    }

    // Статья уже отправлена в Telegram через /api/blog-generate
    // Здесь ничего не нужно — пользователь получит отдельное сообщение с кнопками

  } catch (err) {
    await sendMessage(chatId, `❌ Не удалось запустить генерацию: ${String(err)}`);
  }
}

// /topics — показать ближайшие pending-темы
async function handleTopicsCommand(chatId: number) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("blog_topics")
    .select("topic, type, priority, status")
    .order("priority", { ascending: false })
    .limit(10);

  if (!data || data.length === 0) {
    await sendMessage(chatId, "📭 Тем не найдено");
    return;
  }

  const typeEmoji: Record<string, string> = {
    comparison: "⚖️", review: "🔍", guide: "📋", education: "🎓",
  };
  const statusEmoji: Record<string, string> = {
    pending: "⏳", generated: "✅", skipped: "⏭",
  };

  const lines = data.map((t, i) =>
    `${i + 1}. ${statusEmoji[t.status] || "•"} ${typeEmoji[t.type] || "📝"} <b>${t.topic}</b>\n   Приоритет: ${t.priority}/10`
  ).join("\n\n");

  await sendMessage(chatId, `📋 <b>Ближайшие темы:</b>\n\n${lines}`);
}

// /seo — переслать дайджест последнего батча черновиков на ревью
async function handleSeoCommand(chatId: number) {
  const supabase = createServerClient();

  const { count } = await supabase
    .from("seo_suggestions")
    .select("*", { count: "exact", head: true })
    .eq("status", "draft");

  if (!count) {
    await sendMessage(chatId, "📭 Черновиков на ревью нет. Запусти генерацию: <code>/api/seo/generate</code>");
    return;
  }

  // последний батч с черновиками
  const { data: latest } = await supabase
    .from("seo_suggestions")
    .select("batch_id")
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest?.batch_id) {
    await sendMessage(chatId, "📭 Активного батча не найдено");
    return;
  }

  const res = await sendSeoDigest(supabase, latest.batch_id);
  if (!res.sent) await sendMessage(chatId, "⚠️ Не удалось собрать дайджест");
}

// /status — статистика блога
async function handleStatusCommand(chatId: number) {
  const supabase = createServerClient();

  const [{ count: totalPosts }, { count: published }, { count: pending }] = await Promise.all([
    supabase.from("blog_posts").select("*", { count: "exact", head: true }),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("published", true),
    supabase.from("blog_topics").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  await sendMessage(chatId,
    `📊 <b>Статистика блога</b>\n\n` +
    `📝 Всего статей: ${totalPosts || 0}\n` +
    `✅ Опубликовано: ${published || 0}\n` +
    `📦 Черновики: ${(totalPosts || 0) - (published || 0)}\n` +
    `⏳ Тем в очереди: ${pending || 0}`
  );
}

async function editMessageRemoveButtons(chatId: number, messageId: number, statusText: string) {
  await telegramRequest("editMessageReplyMarkup", { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } });
  await telegramRequest("sendMessage", { chat_id: chatId, text: statusText, reply_to_message_id: messageId });
}

async function editMessage(chatId: number, messageId: number, text: string) {
  await telegramRequest("editMessageText", { chat_id: chatId, message_id: messageId, text, reply_markup: { inline_keyboard: [] } });
}
