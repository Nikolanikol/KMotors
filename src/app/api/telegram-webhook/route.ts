import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// Always return 200 to Telegram to prevent retries
function ok() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function POST(req: NextRequest) {
  // Validate webhook secret sent by Telegram
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    // Return 200 anyway to avoid Telegram retries on wrong requests
    console.warn("Telegram webhook: invalid secret token");
    return ok();
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return ok();
  }

  // We only handle callback_query (button presses)
  const callbackQuery = body?.callback_query as
    | {
        id: string;
        data: string;
        message?: { message_id: number; chat?: { id: number } };
      }
    | undefined;

  if (!callbackQuery) {
    return ok();
  }

  const callbackId = callbackQuery.id;
  const data = callbackQuery.data || "";
  const messageId = callbackQuery.message?.message_id;
  const chatId = callbackQuery.message?.chat?.id;

  // Answer the callback query immediately (removes loading spinner in Telegram)
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
      .update({
        published: true,
        published_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (error) {
      console.error("Telegram webhook publish error:", error);
      // Edit message to show error
      if (chatId && messageId) {
        await editMessage(chatId, messageId, "❌ Ошибка при публикации: " + error.message);
      }
      return ok();
    }

    // Edit message: remove buttons, mark as published
    if (chatId && messageId) {
      await editMessageRemoveButtons(chatId, messageId, "✅ Опубликовано");
    }
  } else if (data.startsWith("delete:")) {
    const postId = data.slice("delete:".length);

    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error("Telegram webhook delete error:", error);
      if (chatId && messageId) {
        await editMessage(chatId, messageId, "❌ Ошибка при удалении: " + error.message);
      }
      return ok();
    }

    // Edit message: remove buttons, mark as deleted
    if (chatId && messageId) {
      await editMessageRemoveButtons(chatId, messageId, "🗑 Удалено");
    }
  }

  return ok();
}

async function editMessageRemoveButtons(
  chatId: number,
  messageId: number,
  statusText: string
) {
  // Get the original message text and append status
  await fetch(`${TELEGRAM_API}/editMessageReplyMarkup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: [] }, // remove all buttons
    }),
  });

  // Send a reply with the status
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: statusText,
      reply_to_message_id: messageId,
    }),
  });
}

async function editMessage(chatId: number, messageId: number, text: string) {
  await fetch(`${TELEGRAM_API}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      reply_markup: { inline_keyboard: [] },
    }),
  });
}
