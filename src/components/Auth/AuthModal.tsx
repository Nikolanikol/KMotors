"use client";

// Окно входа и регистрации поверх страницы — для цен аукционов (решение
// владельца 05.10.2026: цены лотов видят только зарегистрированные).
//
// Почему окно, а не страница /auth: человек упёрся в «войдите, чтобы увидеть
// цену» на КОНКРЕТНОЙ машине. Уход на отдельную страницу и возврат — лишний шаг,
// на котором его теряем. После входа router.refresh() перерисовывает страницу
// на сервере уже с ценой, человек остаётся на месте.
//
// Открывается событием (openAuthModal из authEvents.ts), как панели корзины и
// избранного. ⚠️ Модуль тянет клиент Supabase, поэтому грузится ЛЕНИВО: шапка
// монтирует его только при первом открытии (AuthModalHost в Header) и передаёт
// то самое первое событие пропом `initial` — слушатель ещё не существовал.
//
// ⚠️ Телефон при регистрации по email ОБЯЗАТЕЛЕН — ради него регистрация и
// затевалась: менеджеру нужно, кому писать по лоту. Лежит в user_metadata.phone.
// У входа через Google телефона нет — Google его не отдаёт.
//
// ⚠️ Подтверждение email: если в Supabase оно включено, signUp не возвращает
// сессию — тогда просим открыть письмо. Если выключено — человек сразу внутри.
// Обе ветки рабочие, поведение решает настройка Supabase, а не этот код.
//
// Аналитика: auth_modal_open → sign_up / login (method: email | google).

import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { pick, type CardLang } from "@/lib/carnect/lang";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/utils/gtag";

import { AUTH_OPEN_EVENT, notifyAuthChanged, type AuthOpenDetail } from "./authEvents";
import { AUTH_TEXT as T } from "./authModalText";

type Mode = "register" | "login";

export default function AuthModal({ initial }: { initial?: AuthOpenDetail }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<CardLang>("en");
  const [reason, setReason] = useState("price");
  const [mode, setMode] = useState<Mode>("register");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const t = (k: keyof typeof T) => pick(lang, T[k]);

  useEffect(() => {
    const show = (d: AuthOpenDetail | undefined) => {
      setLang(d?.lang ?? "en");
      setReason(d?.reason ?? "price");
      setError("");
      setNotice("");
      setOpen(true);
      trackEvent("auth_modal_open", { reason: d?.reason });
    };
    // Первое открытие пришло ДО монтирования (окно грузится лениво) — оно в initial.
    if (initial) show(initial);
    const onOpen = (e: Event) => show((e as CustomEvent<AuthOpenDetail>).detail);
    window.addEventListener(AUTH_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(AUTH_OPEN_EVENT, onOpen);
  }, [initial]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  // Замок цены (price, price_filter) — «войдите, чтобы увидеть цену»; иконка
  // профиля в шапке — общий «вход в K-Axis».
  const fromPrice = reason.startsWith("price");

  /** Вошёл — закрываем и перерисовываем страницу на сервере уже с ценой. */
  const done = (event: "sign_up" | "login", method: "email" | "google") => {
    trackEvent(event, { method, reason });
    // Менеджеру в Telegram — регистрация это лид (src/lib/signupNotify.ts).
    // Зовём и после входа: подтвердивший email позже приходит именно «входом»,
    // а дубль сервер отсечёт сам (отметка signup_notified). Ждать не нужно.
    fetch("/api/auth/signup-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, path: `${pathname}${window.location.search}`, title: document.title }),
      keepalive: true,
    }).catch(() => {});
    setOpen(false);
    notifyAuthChanged(); // иконка профиля в шапке
    router.refresh(); // сервер перерисует страницу уже с ценой
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (password.length < 6) return setError(t("errorWeak"));
    if (mode === "register" && phone.replace(/\D/g, "").length < 7) return setError(t("errorPhone"));
    setBusy(true);
    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) return setError(t("errorInvalid"));
        return done("login", "email");
      }
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim() || null,
            phone: phone.trim(),
            preferred_lang: lang,
            signup_source: `auction_${reason}`,
          },
        },
      });
      if (err) {
        if (/already|registered|exists/i.test(err.message)) {
          setMode("login");
          return setError(t("errorExists"));
        }
        return setError(err.message || t("errorGeneric"));
      }
      // Без сессии — в Supabase включено подтверждение email (см. шапку файла).
      if (!data.session) {
        trackEvent("sign_up", { method: "email", reason, confirmed: false });
        return setNotice(t("checkEmail"));
      }
      done("sign_up", "email");
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    // Вернуться ровно на эту страницу (с фильтром каталога и т.п.). Колбэк
    // /auth/callback сам обменяет код на сессию.
    const next = `${pathname}${window.location.search}`;
    trackEvent("login_start", { method: "google", reason });
    await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  };

  const input =
    "w-full rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[rgba(182,119,73,0.6)]";
  const inputStyle = {
    backgroundColor: "#1E1E1E",
    border: "1px solid rgba(74,74,74,0.5)",
    color: "var(--axis-cream, #F5F0EB)",
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={t(fromPrice ? "titlePrice" : "titleHeader")}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div
        className="relative w-full max-w-md rounded-t-3xl p-6 shadow-2xl sm:rounded-2xl"
        style={{ backgroundColor: "var(--axis-charcoal, #141414)", border: "1px solid rgba(182,119,73,0.35)" }}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t("close")}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(74,74,74,0.3)", color: "var(--axis-gray)" }}
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="pr-8 text-lg font-bold" style={{ color: "var(--axis-white)" }}>
          {t(fromPrice ? "titlePrice" : "titleHeader")}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--axis-gray)" }}>
          {t(fromPrice ? "subPrice" : "subHeader")}
        </p>

        <button
          type="button"
          onClick={google}
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "#fff", color: "#1f1f1f" }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          {t("google")}
        </button>

        <div className="my-4 flex items-center gap-3 text-xs" style={{ color: "var(--axis-gray)" }}>
          <span className="h-px flex-1" style={{ backgroundColor: "rgba(74,74,74,0.5)" }} />
          {t("or")}
          <span className="h-px flex-1" style={{ backgroundColor: "rgba(74,74,74,0.5)" }} />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <>
              <input className={input} style={inputStyle} placeholder={t("name")} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              <input
                className={input}
                style={inputStyle}
                placeholder={t("phone")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                autoComplete="tel"
                required
              />
            </>
          )}
          <input className={input} style={inputStyle} placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required />
          <input
            className={input}
            style={inputStyle}
            placeholder={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />

          {error && <p className="text-sm" style={{ color: "#E5484D" }}>{error}</p>}
          {notice && <p className="text-sm" style={{ color: "#3FB950" }}>{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="h-11 w-full rounded-xl text-sm font-bold text-white transition disabled:opacity-60"
            style={{ backgroundColor: "var(--axis-bronze-deep)", backgroundImage: "var(--axis-bronze-fill)" }}
          >
            {busy ? "…" : t(mode === "register" ? "submitRegister" : "submitLogin")}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "register" ? "login" : "register");
            setError("");
          }}
          className="mt-3 w-full text-center text-sm"
          style={{ color: "var(--axis-bronze)" }}
        >
          {t(mode === "register" ? "haveAccount" : "noAccount")}
        </button>
        {mode === "register" && (
          <p className="mt-3 text-center text-[11px]" style={{ color: "var(--axis-gray)" }}>
            {t("terms")}
          </p>
        )}
      </div>
    </div>
  );
}
