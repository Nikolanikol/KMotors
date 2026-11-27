import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendTelegram } from "@/lib/telegram";
import { telegramChatIds } from "@/lib/telegramChats";

/**
 * Приём заявок со всех форм сайта. Публичная ручка без авторизации, поэтому:
 * - размер тела и частота запросов с одного IP ограничены (память процесса);
 * - поля проверяются по типам и длинам ДО любой работы с базой и Telegram;
 * - сначала заявка сохраняется в `leads`, и только потом уходит в Telegram:
 *   сбой Telegram больше не теряет лид, а сбой базы не теряет уведомление;
 * - наружу клиенту не уходят тексты исключений и ответы Telegram.
 */

export const dynamic = "force-dynamic";

interface ContactPayload {
  name?: unknown;
  phone?: unknown;
  message?: unknown;
  source?: unknown;
  carId?: unknown;
  carName?: unknown;
  messenger?: unknown;
  vin?: unknown;
  tg_username?: unknown;
}

// ── Лимиты ──────────────────────────────────────────────────────────────────
const MAX_BODY_BYTES = 32_000;
const MAX_NAME = 100;
const MAX_PHONE = 40;
const MAX_VIN = 17;
const MAX_CAR_ID = 40;
const MAX_CAR_NAME = 200;
const MAX_SOURCE = 40;
const SOURCE_ID_RE = /^[a-z0-9_]{1,40}$/;
const MAX_MESSENGER = 20;
/** В Telegram уходит не больше; в `leads` лежит полный текст (до MAX_MESSAGE_STORED). */
const MAX_MESSAGE_TELEGRAM = 3000;
const MAX_MESSAGE_STORED = 10_000;
/** Жёсткий потолок sendMessage — 4096; оставляем запас. */
const MAX_TELEGRAM_TEXT = 4000;
const TG_TIMEOUT_MS = 8000;
const TG_USERNAME_RE = /^[A-Za-z0-9_]{3,32}$/;

// ── Rate limit по IP: окно в памяти процесса (тот же приём, что в /api/ems/track) ──
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_LIMIT = 8;
const RATE_MAP_MAX = 5000;
const hits = new Map<string, { count: number; windowStart: number }>();

function pruneExpired(now: number) {
  for (const [key, entry] of hits) {
    if (now - entry.windowStart > RATE_WINDOW_MS) hits.delete(key);
  }
  // Страховка от разрастания карты при переборе IP: при переполнении сбрасываем всё.
  if (hits.size > RATE_MAP_MAX) hits.clear();
}

function isRateLimited(ip: string, now: number): boolean {
  const entry = hits.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

// ── Подписи источников для сообщения менеджеру. Источника нет в списке — в сообщении будет
//    сам идентификатор; мусорный (не [a-z0-9_]) сохраняется как "unknown". ──
const sourceLabel: Record<string, string> = {
  header: "Шапка сайта",
  contact: "Страница /contact",
  parts: "Страница /parts",
  parts_product: "Заказ детали",
  parts_fitment: "Проверка совместимости",
  parts_cart: "Заказ из корзины",
  parts_no_results: "Каталог запчастей — ничего не найдено",
  car_detail: "Карточка машины",
  car_detail_mobile: "Карточка машины (моб. плашка)",
  auction_lot: "Лот аукциона",
  car_calculator: "Калькулятор таможни",
  blog: "Блог",
  home_cta: "Главная — форма внизу страницы",
};

function formatWaLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

/** Строка или undefined — иначе null (признак «неверный тип»). */
function optString(v: unknown): string | undefined | null {
  if (v === undefined || v === null) return undefined;
  return typeof v === "string" ? v : null;
}

export async function POST(req: NextRequest) {
  const now = Date.now();
  pruneExpired(now);

  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown";
  if (isRateLimited(ip, now)) {
    return NextResponse.json({ error: "Слишком много заявок, попробуйте позже" }, { status: 429 });
  }

  try {
    // ── Тело: размер, затем JSON ──────────────────────────────────────────────
    const declared = Number(req.headers.get("content-length") ?? "0");
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Слишком большой запрос" }, { status: 413 });
    }
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Слишком большой запрос" }, { status: 413 });
    }

    let body: ContactPayload;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
      body = parsed as ContactPayload;
    } catch {
      return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
    }

    // ── Типы: каждое поле — строка или отсутствует ────────────────────────────
    const nameRaw = optString(body.name);
    const phoneRaw = optString(body.phone);
    const messageRaw = optString(body.message);
    const sourceRaw = optString(body.source);
    const carIdRaw = optString(body.carId);
    const carNameRaw = optString(body.carName);
    const messengerRaw = optString(body.messenger);
    const vinRaw = optString(body.vin);
    const tgRaw = optString(body.tg_username);
    if (
      [nameRaw, phoneRaw, messageRaw, sourceRaw, carIdRaw, carNameRaw, messengerRaw, vinRaw, tgRaw].some(
        (v) => v === null
      )
    ) {
      return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
    }

    const name = (nameRaw as string | undefined)?.trim().slice(0, MAX_NAME);
    const phone = (phoneRaw as string | undefined)?.trim().slice(0, MAX_PHONE);
    if (!name || !phone) {
      return NextResponse.json({ error: "Имя и телефон обязательны" }, { status: 400 });
    }

    // Полный текст сохраняется в leads; в Telegram режется ниже.
    const messageFull = ((messageRaw as string | undefined) ?? "").trim().slice(0, MAX_MESSAGE_STORED) || undefined;
    const vin = ((vinRaw as string | undefined) ?? "").trim().slice(0, MAX_VIN) || undefined;
    const carId = ((carIdRaw as string | undefined) ?? "").trim().slice(0, MAX_CAR_ID) || undefined;
    const carName = ((carNameRaw as string | undefined) ?? "").trim().slice(0, MAX_CAR_NAME) || undefined;
    const messenger = ((messengerRaw as string | undefined) ?? "").trim().slice(0, MAX_MESSENGER) || undefined;
    const tgClean = ((tgRaw as string | undefined) ?? "").trim().replace(/^@/, "");
    const tg_username = TG_USERNAME_RE.test(tgClean) ? tgClean : undefined;

    const sourceIn = ((sourceRaw as string | undefined) ?? "").trim().slice(0, MAX_SOURCE);
    // В leads.source_page пишется сам идентификатор, если он «чистый» (латиница, цифры, _):
    // по нему считают воронки, и источников у форм больше, чем подписей (auth_page, cta_main,
    // header_modal, parts_price_request…). Подпись берётся из sourceLabel, иначе сам идентификатор.
    const source = SOURCE_ID_RE.test(sourceIn) ? sourceIn : sourceIn ? "unknown" : undefined;
    const sourceText =
      source && source !== "unknown"
        ? (Object.hasOwn(sourceLabel, source) ? sourceLabel[source] : source)
        : "Сайт";

    // ── 1. Сохраняем лид ПЕРВЫМ ───────────────────────────────────────────────
    let saved = false;
    try {
      const supabase = createServerClient();
      const { error } = await supabase.from("leads").insert({
        name,
        phone,
        message: messageFull ?? null,
        source_page: source ?? "unknown",
        car_id: carId ?? null,
        car_name: carName ?? null,
        messenger: messenger ?? null,
        vin: vin ?? null,
        tg_username: tg_username ?? null,
        site: "kmotors",
      });
      if (error) {
        console.error("Supabase leads insert failed:", error.message);
      } else {
        saved = true;
      }
    } catch (err) {
      console.error("Supabase leads insert failed:", err);
    }

    // ── 2. Уведомление в Telegram ─────────────────────────────────────────────
    const messengerLine = (() => {
      if (!messenger) return "";
      if (messenger === "whatsapp") {
        return `\n📱 Мессенджер: 💚 WhatsApp\n🔗 ${formatWaLink(phone)}`;
      }
      if (messenger === "telegram") {
        const tgLink = tg_username ? `\n🔗 https://t.me/${tg_username}` : "";
        return `\n📱 Мессенджер: ✈️ Telegram${tgLink}`;
      }
      return `\n📱 Мессенджер: ${messenger}`;
    })();

    const messageForTelegram = messageFull
      ? messageFull.length > MAX_MESSAGE_TELEGRAM
        ? `${messageFull.slice(0, MAX_MESSAGE_TELEGRAM)}\n… [текст обрезан, полный — в заявке в базе]`
        : messageFull
      : "";

    const text = `📬 Новая заявка — ${sourceText}
👤 Имя: ${name}
📞 Телефон: ${phone}${messengerLine}${vin ? `\n🔑 VIN: ${vin.toUpperCase()}` : ""}${carName ? `\n🚗 Авто: ${carName}` : ""}${carId ? `\n🔗 encar.com/md/sl/mdsl_regcar.do?method=inspectionViewNew&carid=${carId}` : ""}${messageForTelegram ? `\n💬 Комментарий: ${messageForTelegram}` : ""}`.slice(
      0,
      MAX_TELEGRAM_TEXT
    );

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const targets = telegramChatIds("leads");
    let delivered = 0;

    if (!botToken || targets.length === 0) {
      console.error("Telegram leads: нет токена или чатов. BOT_TOKEN:", !!botToken, "chats:", targets.length);
    } else {
      const results = await Promise.all(
        targets.map((chatId) =>
          sendTelegram({ text, chatId, token: botToken, timeoutMs: TG_TIMEOUT_MS, onError: "swallow" })
        )
      );
      results.forEach((r, i) => {
        if (r.ok) delivered += 1;
        else console.error("Telegram leads: чат", i, "не принял сообщение:", r.description ?? "нет ответа / таймаут");
      });
    }

    if (!saved && delivered === 0) {
      console.error("Lead lost: не сохранён и не доставлен ни в один чат");
      return NextResponse.json({ error: "Не удалось отправить заявку. Попробуйте позже." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error /api/telegram:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
