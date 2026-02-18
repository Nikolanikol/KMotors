import { createServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// Парсим источник трафика из URL реферера
function parseSource(referrer: string): string {
  if (!referrer) return "direct";
  try {
    const url = new URL(referrer);
    const hostname = url.hostname;
    if (hostname.includes("google")) return "google";
    if (hostname.includes("yandex")) return "yandex";
    if (hostname.includes("t.me") || hostname.includes("telegram")) return "telegram";
    if (hostname.includes("instagram")) return "instagram";
    if (hostname.includes("vk.com")) return "vk";
    if (hostname.includes("facebook")) return "facebook";
    // Возвращаем домен для остальных источников
    return hostname.replace("www.", "");
  } catch {
    return "direct";
  }
}

export async function POST(req: Request) {
  try {
    const { path, referrer } = await req.json();

    if (!path || typeof path !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const source = parseSource(referrer || "");

    const supabase = createServerClient();
    await supabase.from("page_views").insert({
      path: path.slice(0, 500), // ограничиваем длину
      referrer: source,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Тихо игнорируем ошибки — трекинг не должен ломать сайт
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
