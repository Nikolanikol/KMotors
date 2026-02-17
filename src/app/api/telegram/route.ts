import { NextRequest, NextResponse } from "next/server";

interface ContactPayload {
  name: string;
  phone: string;
  message?: string;
  source?: string; // "header" | "contact" | "parts"
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactPayload;
    const { name, phone, message, source } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Имя и телефон обязательны" },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error(
        "Missing env vars. BOT_TOKEN exists:",
        !!botToken,
        "CHAT_ID exists:",
        !!chatId
      );
      return NextResponse.json(
        { error: "Ошибка конфигурации сервера" },
        { status: 500 }
      );
    }

    const sourceLabel: Record<string, string> = {
      header: "Шапка сайта",
      contact: "Страница /contact",
      parts: "Страница /parts",
    };

    const sourceText = source ? (sourceLabel[source] ?? source) : "Сайт";

    const text = `📬 Новая заявка — ${sourceText}
👤 Имя: ${name}
📞 Телефон: ${phone}${message ? `\n💬 Комментарий: ${message}` : ""}`;

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      }
    );

    const data = await telegramResponse.json();

    if (!data.ok) {
      console.error("Telegram API error:", JSON.stringify(data));
      return NextResponse.json(
        { error: "Ошибка отправки в Telegram", details: data.description },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error: "Ошибка сервера",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
