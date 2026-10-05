// Уведомление менеджеру о новой регистрации (решение владельца 05.10.2026).
//
// Регистрация на сайте — это лид: человек оставил телефон, чтобы увидеть цену
// лота аукциона. Уходит тем же ботом и в те же чаты, что заявки с форм
// (/api/telegram: TELEGRAM_CHAT_ID + TELEGRAM_WORK_CHAT_ID), и ложится в
// таблицу leads — видно в админке рядом с заявками (source_page = signup).
//
// ⚠️ Отправляет ТОЛЬКО сервер и только по проверенной сессии (supabase getUser):
// телефон и имя берутся из профиля пользователя, а не из тела запроса, —
// подделать уведомление или заспамить чат нельзя.
// ⚠️ Одно уведомление на человека: после отправки в user_metadata ставится
// signup_notified. Пользователь может менять свои метаданные сам, но худшее,
// что он этим сделает, — пришлёт о себе второе уведомление.
// ⚠️ Только для свежих аккаунтов (младше NEW_ACCOUNT_MS): иначе первый вход
// давно зарегистрированного клиента после выкладки выглядел бы регистрацией.
//
// Не бросает: Telegram или база легли — регистрация человека важнее.

import type { SupabaseClient, User } from "@supabase/supabase-js";

import { createServerClient as createAdminClient } from "@/lib/supabase";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kmotors.shop";
/** Неделя: письмо подтверждения могут открыть не сразу. */
const NEW_ACCOUNT_MS = 7 * 24 * 3600 * 1000;

export interface SignupContext {
  /** email | google — как зарегистрировался. */
  method: string;
  /** Путь страницы, с которой регистрировался (лот, каталог…). Только путь. */
  path?: string;
  /** Заголовок той страницы — обычно название машины. */
  title?: string;
}

/** Путь страницы — только наш, только путь: в сообщение не уйдёт чужая ссылка. */
function safePath(p: string | undefined): string | null {
  return p && /^\/[^\s]{0,300}$/.test(p) && !p.startsWith("//") ? p : null;
}

const clip = (s: unknown, n: number) => (typeof s === "string" ? s.trim().slice(0, n) : "");

/**
 * Шлёт уведомление, если оно ещё не отправлялось и аккаунт свежий.
 * `supabase` — серверный клиент С СЕССИЕЙ пользователя (cookies): через него
 * ставится отметка signup_notified.
 */
export async function notifySignup(supabase: SupabaseClient, user: User, ctx: SignupContext): Promise<"sent" | "skipped" | "failed"> {
  try {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    if (meta.signup_notified) return "skipped";
    if (Date.now() - Date.parse(user.created_at) > NEW_ACCOUNT_MS) return "skipped";

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const targets = [process.env.TELEGRAM_CHAT_ID, process.env.TELEGRAM_WORK_CHAT_ID].filter(Boolean) as string[];
    if (!token || !targets.length) {
      console.error("[signup] нет TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID — уведомление не отправлено");
      return "failed";
    }

    const name = clip(meta.name ?? meta.full_name, 80) || "—";
    const phone = clip(meta.phone, 40);
    const path = safePath(ctx.path);
    const title = clip(ctx.title, 160);
    const wa = phone.replace(/\D/g, "");
    // Простой текст без parse_mode, как у заявок: имена приходят от людей, и
    // кривой HTML-тег уронил бы отправку целиком.
    const text = [
      `🆕 Регистрация на сайте${path?.includes("/auction") ? " — ради цены аукциона" : ""}`,
      `👤 Имя: ${name}`,
      phone ? `📞 Телефон: ${phone}` : "📞 Телефон: не указан (вход через Google)",
      wa.length >= 7 ? `🔗 https://wa.me/${wa}` : null,
      `✉️ Email: ${user.email ?? "—"}`,
      `🔑 Способ: ${ctx.method === "google" ? "Google" : "email"}`,
      path ? `🚗 Страница: ${title ? `${title}\n` : ""}${SITE}${path}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const results = await Promise.all(
      targets.map((chat_id) =>
        fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id, text }),
          signal: AbortSignal.timeout(8000),
        })
          .then((r) => r.json())
          .catch(() => ({ ok: false })),
      ),
    );
    if (!results.some((r) => r?.ok)) {
      console.error("[signup] Telegram не принял уведомление:", JSON.stringify(results[0]));
      return "failed";
    }

    // Отметка — только после удачной отправки: иначе сбой Telegram съел бы лид.
    await supabase.auth.updateUser({ data: { signup_notified: true } });

    // В leads — рядом с заявками в админке. Сбой базы уведомление не отменяет.
    try {
      await createAdminClient().from("leads").insert({
        name,
        // Пустая строка, а не null: у leads телефон заполнен у всех заявок, и
        // у Google-регистраций без телефона запись не должна упасть на NOT NULL.
        phone: phone || "",
        message: [`Регистрация (${ctx.method})`, user.email, path && `${SITE}${path}`].filter(Boolean).join(" · "),
        source_page: "signup",
        site: "kmotors",
      });
    } catch (e) {
      console.error("[signup] запись в leads не удалась:", e);
    }
    return "sent";
  } catch (e) {
    console.error("[signup] уведомление не отправлено:", e instanceof Error ? e.message : e);
    return "failed";
  }
}
