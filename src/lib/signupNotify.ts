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
// Здесь же уведомление о входе в личный кабинет — notifyAccountVisit.
// ⚠️ Только для свежих аккаунтов (младше NEW_ACCOUNT_MS): иначе первый вход
// давно зарегистрированного клиента после выкладки выглядел бы регистрацией.
//
// Не бросает: Telegram или база легли — регистрация человека важнее.

import type { User } from "@supabase/supabase-js";

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

/** Метод входа — из аккаунта, а не из того, откуда позвали. */
function methodOf(user: User): "google" | "email" {
  return user.app_metadata?.provider === "google" ? "google" : "email";
}

/** Отправить текст в оба чата менеджеров. true — принял хотя бы один. */
async function sendToManagers(text: string): Promise<boolean | "no_env"> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const targets = [process.env.TELEGRAM_CHAT_ID, process.env.TELEGRAM_WORK_CHAT_ID].filter(Boolean) as string[];
  if (!token || !targets.length) return "no_env";
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
  if (results.some((r) => r?.ok)) return true;
  console.error("[signup] Telegram не принял сообщение:", JSON.stringify(results[0]));
  return false;
}

/**
 * Отметка в user_metadata — сервисным ключом, а не сессией пользователя:
 * функцию зовёт и серверный компонент (/account), где сессия cookie писать не
 * может. Объект метаданных передаём ЦЕЛИКОМ со своей правкой, не полагаясь на
 * то, сливает ли GoTrue поля сам.
 */
async function markUser(user: User, patch: Record<string, unknown>) {
  const { error } = await createAdminClient().auth.admin.updateUserById(user.id, {
    user_metadata: { ...(user.user_metadata ?? {}), ...patch },
  });
  if (error) console.error("[signup] отметка в аккаунте не сохранилась:", error.message);
}

/** Строки «кто это» — общие у регистрации и входа в кабинет. */
function whoLines(user: User): { name: string; phone: string; lines: string[] } {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name = clip(meta.name ?? meta.full_name, 80) || "—";
  const phone = clip(meta.phone, 40);
  const wa = phone.replace(/\D/g, "");
  return {
    name,
    phone,
    lines: [
      `👤 Имя: ${name}`,
      phone ? `📞 Телефон: ${phone}` : "📞 Телефон: не указан (вход через Google)",
      wa.length >= 7 ? `🔗 https://wa.me/${wa}` : "",
      `✉️ Email: ${user.email ?? "—"}`,
      `🔑 Способ: ${methodOf(user) === "google" ? "Google" : "email"}`,
    ].filter(Boolean),
  };
}

/**
 * Шлёт уведомление о регистрации, если оно ещё не отправлялось и аккаунт свежий.
 * Каждый вызов пишет в лог результат с причиной — в Coolify видно, что
 * происходит (до 06.10.2026 «пропущено» не логировалось, и потерянные
 * уведомления было не отличить от невызванных).
 */
export async function notifySignup(user: User, ctx: SignupContext): Promise<"sent" | "skipped" | "failed"> {
  try {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    if (meta.signup_notified) return logResult("skipped", "уже уведомляли", user);
    if (Date.now() - Date.parse(user.created_at) > NEW_ACCOUNT_MS) return logResult("skipped", "аккаунт старше недели", user);

    const { name, phone, lines } = whoLines(user);
    const path = safePath(ctx.path);
    const title = clip(ctx.title, 160);
    // Простой текст без parse_mode, как у заявок: имена приходят от людей, и
    // кривой HTML-тег уронил бы отправку целиком.
    const text = [
      `🆕 Регистрация на сайте${path?.includes("/auction") ? " — ради цены аукциона" : ""}`,
      ...lines,
      path ? `🚗 Страница: ${title ? `${title}\n` : ""}${SITE}${path}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const sent = await sendToManagers(text);
    if (sent === "no_env") return logResult("failed", "нет TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID", user);
    if (!sent) return logResult("failed", "Telegram не принял", user);

    // Отметка — только после удачной отправки: иначе сбой Telegram съел бы лид.
    await markUser(user, { signup_notified: true });

    // В leads — рядом с заявками в админке. Сбой базы уведомление не отменяет.
    try {
      await createAdminClient().from("leads").insert({
        name,
        // Пустая строка, а не null: у leads телефон заполнен у всех заявок, и
        // у Google-регистраций без телефона запись не должна упасть на NOT NULL.
        phone: phone || "",
        message: [`Регистрация (${methodOf(user)})`, user.email, path && `${SITE}${path}`].filter(Boolean).join(" · "),
        source_page: "signup",
        site: "kmotors",
      });
    } catch (e) {
      console.error("[signup] запись в leads не удалась:", e);
    }
    return logResult("sent", ctx.method, user);
  } catch (e) {
    return logResult("failed", e instanceof Error ? e.message : String(e), user);
  }
}

/** Не чаще раза в 6 часов на человека: обновление страницы кабинета — не новость. */
const VISIT_COOLDOWN_MS = 6 * 3600 * 1000;

/**
 * Вход в личный кабинет — менеджеру в Telegram (решение владельца 06.10.2026).
 *
 * Зачем, если есть уведомление о регистрации: оно висит на колбэке входа, а
 * колбэк зависит от настроек Supabase (адрес возврата после Google). Кабинет же
 * открывается через наш сервер, и здесь мы ТОЧНО знаем, кто вошёл. Регистрация,
 * которую колбэк потерял, приходит здесь при первом заходе в кабинет.
 */
export async function notifyAccountVisit(user: User): Promise<void> {
  try {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    if (!meta.signup_notified && Date.now() - Date.parse(user.created_at) <= NEW_ACCOUNT_MS) {
      await notifySignup(user, { method: methodOf(user), path: "/account" });
      return;
    }
    const last = typeof meta.account_visit_notified_at === "string" ? Date.parse(meta.account_visit_notified_at) : 0;
    if (Date.now() - last < VISIT_COOLDOWN_MS) {
      logResult("skipped", "вход в кабинет: уже уведомляли за 6 часов", user);
      return;
    }
    const days = Math.floor((Date.now() - Date.parse(user.created_at)) / 86_400_000);
    const text = [
      "🔓 Вход в личный кабинет",
      ...whoLines(user).lines,
      `📅 Зарегистрирован: ${days === 0 ? "сегодня" : `${days} дн. назад`}`,
    ].join("\n");
    const sent = await sendToManagers(text);
    if (sent !== true) {
      logResult("failed", sent === "no_env" ? "вход в кабинет: нет переменных Telegram" : "вход в кабинет: Telegram не принял", user);
      return;
    }
    await markUser(user, { account_visit_notified_at: new Date().toISOString() });
    logResult("sent", "вход в кабинет", user);
  } catch (e) {
    logResult("failed", `вход в кабинет: ${e instanceof Error ? e.message : String(e)}`, user);
  }
}

function logResult<T extends "sent" | "skipped" | "failed">(result: T, reason: string, user: User): T {
  const line = `[signup] ${result}: ${reason} · ${user.email ?? user.id}`;
  if (result === "failed") console.error(line);
  else console.log(line);
  return result;
}
