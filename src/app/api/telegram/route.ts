import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

interface ContactPayload {
  name: string;
  phone: string;
  message?: string;
  source?: string;
  carId?: string;
  carName?: string;
  messenger?: string;
  vin?: string;
  tg_username?: string;
}

function formatWaLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactPayload;
    const { name, phone, message, source, carId, carName, messenger, vin, tg_username } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Имя и телефон обязательны" },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error("Missing env vars. BOT_TOKEN exists:", !!botToken, "CHAT_ID exists:", !!chatId);
      return NextResponse.json({ error: "Ошибка конфигурации сервера" }, { status: 500 });
    }

    const sourceLabel: Record<string, string> = {
      header: "Шапка сайта",
      contact: "Страница /contact",
      parts: "Страница /parts",
      car_detail: "Карточка машины",
      car_calculator: "Калькулятор таможни",
      blog: "Блог",
    };

    const sourceText = source ? (sourceLabel[source] ?? source) : "Сайт";

    const messengerLine = (() => {
      if (!messenger) return "";
      if (messenger === "whatsapp") {
        return `\n📱 Мессенджер: 💚 WhatsApp\n🔗 ${formatWaLink(phone)}`;
      }
      if (messenger === "telegram") {
        const tgLink = tg_username
          ? `\n🔗 https://t.me/${tg_username.replace(/^@/, "")}`
          : "";
        return `\n📱 Мессенджер: ✈️ Telegram${tgLink}`;
      }
      return `\n📱 Мессенджер: ${messenger}`;
    })();

    const text = `📬 Новая заявка — ${sourceText}
👤 Имя: ${name}
📞 Телефон: ${phone}${messengerLine}${vin ? `\n🔑 VIN: ${vin.toUpperCase()}` : ""}${carName ? `\n🚗 Авто: ${carName}` : ""}${carId ? `\n🔗 encar.com/md/sl/mdsl_regcar.do?method=inspectionViewNew&carid=${carId}` : ""}${message ? `\n💬 Комментарий: ${message}` : ""}`;

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

    try {
      const supabase = createServerClient();
      await supabase.from("leads").insert({
        name,
        phone,
        message: message ?? null,
        source_page: source ?? "unknown",
        car_id: carId ?? null,
        car_name: carName ?? null,
        messenger: messenger ?? null,
        vin: vin ?? null,
        tg_username: tg_username ?? null,
      });
    } catch (err) {
      console.error("Supabase leads insert failed:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Ошибка сервера", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
