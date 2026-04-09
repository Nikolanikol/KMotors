import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function ok() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

async function sendMessage(chatId: number, text: string, extra?: Record<string, unknown>) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error("Telegram sendMessage error:", JSON.stringify(data));
  }
  return data;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    console.warn("Telegram webhook: invalid secret token");
    return ok();
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return ok();
  }

  // Обработка команд (/generate, /topics, /status)
  const message = body?.message as
    | { text?: string; chat?: { id: number }; message_id?: number }
    | undefined;

  if (message?.text && message.chat?.id) {
    const chatId = message.chat.id;

    // Защита — только для владельца бота
    if (ALLOWED_CHAT_ID && String(chatId) !== String(ALLOWED_CHAT_ID)) {
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

    if (text === "/ping") {
      const r = await sendMessage(chatId, "🏓 pong");
      return NextResponse.json({ ok: true, telegram: r });
    }

    if (text === "/help") {
      await sendMessage(chatId,
        `🤖 <b>KMotors Blog Bot</b>\n\n` +
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
    | { id: string; data: string; message?: { message_id: number; chat?: { id: number } } }
    | undefined;

  if (!callbackQuery) return ok();

  const callbackId = callbackQuery.id;
  const data = callbackQuery.data || "";
  const messageId = callbackQuery.message?.message_id;
  const chatId = callbackQuery.message?.chat?.id;

  await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId }),
  });

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
  }

  return ok();
}

// /generate — запустить генерацию следующей статьи
async function handleGenerateCommand(chatId: number) {
  await sendMessage(chatId, "⏳ Генерирую статью, подождите 30–60 секунд...");

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kmotors.shop";
    const res = await fetch(`${baseUrl}/api/blog-generate`, { method: "POST" });
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
  await fetch(`${TELEGRAM_API}/editMessageReplyMarkup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } }),
  });
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: statusText, reply_to_message_id: messageId }),
  });
}

async function editMessage(chatId: number, messageId: number, text: string) {
  await fetch(`${TELEGRAM_API}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, reply_markup: { inline_keyboard: [] } }),
  });
}
