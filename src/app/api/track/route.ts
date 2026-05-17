import { createServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

const OWN_DOMAINS = ["kmotors.shop", "localhost"];

// Страны датацентров — высокий риск ботов при direct трафике
const DATACENTER_COUNTRIES = new Set(["US", "HK", "SG", "NL", "DE", "GB", "JP", "CA", "AU"]);

// Целевые рынки — всегда пишем (KR = Николай физически в Корее)
const TARGET_COUNTRIES = new Set(["RU", "KZ", "UZ", "GE", "AM", "AZ", "BY", "MD", "KG", "TJ", "TM", "KR", "AE", "SA"]);

function isLikelyBot(country: string, referrer: string): boolean {
  // Целевые рынки — всегда пропускаем
  if (TARGET_COUNTRIES.has(country)) return false;

  // Датацентровая страна + direct трафик (нет реферера) = бот из датацентра
  if (DATACENTER_COUNTRIES.has(country) && !referrer) return true;

  return false;
}

function parseSource(referrer: string): string {
  if (!referrer) return "direct";
  try {
    const url = new URL(referrer);
    const hostname = url.hostname.replace("www.", "");

    // Саморефералы — не источник
    if (OWN_DOMAINS.some((d) => hostname.includes(d))) return "direct";

    if (hostname.includes("google")) return "google";
    if (hostname.includes("yandex")) return "yandex";
    if (hostname.includes("t.me") || hostname.includes("telegram")) return "telegram";
    if (hostname.includes("instagram")) return "instagram";
    if (hostname.includes("vk.com")) return "vk";
    if (hostname.includes("facebook") || hostname.includes("fb.com")) return "facebook";
    if (hostname.includes("youtube") || hostname.includes("youtu.be")) return "youtube";
    if (hostname.includes("tiktok")) return "tiktok";
    if (hostname.includes("whatsapp")) return "whatsapp";
    if (hostname.includes("dzen.ru") || hostname.includes("zen.yandex")) return "dzen";
    if (hostname.includes("avito")) return "avito";
    if (hostname.includes("auto.ru")) return "auto.ru";

    return hostname;
  } catch {
    return "direct";
  }
}

export async function POST(req: Request) {
  try {
    const { path, referrer, country, device, event, properties, sessionId } = await req.json();

    // Гео-фильтр: второй слой после middleware (ловит IP-based ботов из датацентров)
    if (isLikelyBot(country || "", referrer || "")) {
      return NextResponse.json({ ok: true, filtered: true });
    }

    const supabase = createServerClient();

    // Событие (car_view и др.) → таблица events
    if (event) {
      await supabase.from("events").insert({
        event,
        session_id: sessionId || null,
        properties: properties || {},
      });

      // car_view — дополнительно кэшируем имя машины для топа страниц
      if (event === "car_view" && properties?.car_id && properties?.car_name) {
        await supabase.from("car_names").upsert({
          car_id: String(properties.car_id),
          car_name: String(properties.car_name),
          path: `/ru/catalog/${properties.car_id}`,
          updated_at: new Date().toISOString(),
        }, { onConflict: "car_id" });
      }

      return NextResponse.json({ ok: true });
    }

    // Стандартный pageview → таблица page_views
    if (!path || typeof path !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const source = parseSource(referrer || "");

    await supabase.from("page_views").insert({
      path: path.slice(0, 500),
      referrer: source,
      country: country || null,
      device: device || null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
