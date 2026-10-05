// События окна входа — ОТДЕЛЬНЫМ модулем, без единого импорта Supabase.
//
// ⚠️ Зачем отдельно: шапка (на каждой странице сайта) и замок цены должны
// уметь открыть окно и узнать о входе, НЕ затягивая к себе клиент Supabase
// (~62 КБ по сети). Его уже однажды убирали из общего пути ради скорости
// (CLAUDE.md, «AuthProvider с публичных страниц снят»). Само окно (AuthModal)
// грузится лениво, при первом открытии — см. AuthModalHost в Header.

import type { CardLang } from "@/lib/carnect/lang";

export const AUTH_OPEN_EVENT = "kaxis_auth_open";
/** Вход или выход случился — шапка перерисовывает иконку профиля. */
export const AUTH_CHANGED_EVENT = "kaxis_auth_changed";

export interface AuthOpenDetail {
  lang: CardLang;
  /** Откуда открыли — в аналитику: price, price_filter, header… */
  reason: string;
}

export function openAuthModal(detail: AuthOpenDetail) {
  window.dispatchEvent(new CustomEvent<AuthOpenDetail>(AUTH_OPEN_EVENT, { detail }));
}

export function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

/**
 * Вошёл ли посетитель — по НАЛИЧИЮ cookie сессии Supabase (`sb-<проект>-auth-token`,
 * бывает порезан на .0/.1), без библиотеки. Это только для вида иконки в шапке:
 * настоящую проверку (подпись токена) делает сервер — getViewer, src/lib/viewer.ts.
 * Протухшая cookie покажет «вошёл», и это безопасно: цену всё равно решает сервер.
 */
export function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return /(?:^|;\s*)sb-[^=]+-auth-token(?:\.\d+)?=/.test(document.cookie);
}

/**
 * Сообщить серверу о входе — менеджеру уйдёт уведомление о регистрации
 * (src/lib/signupNotify.ts). Звать после КАЖДОГО удачного входа или регистрации
 * по email: и окно входа (AuthModal), и страница /auth. Сервер сам отсекает
 * старые аккаунты и повторы, поэтому лишний вызов безвреден, а пропущенный —
 * потерянный лид: так страница /auth с первого дня регистрировала людей мимо
 * Telegram (найдено 05.10.2026 по пустой метке signup_source в auth.users).
 * Не ждём ответа: keepalive доставит запрос и после перехода на другую страницу.
 */
export function reportSignIn(method: "email" | "google") {
  fetch("/api/auth/signup-notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, path: `${location.pathname}${location.search}`, title: document.title }),
    keepalive: true,
  }).catch(() => {});
}
