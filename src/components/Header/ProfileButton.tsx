"use client";

// Иконка профиля в шапке (05.10.2026, вместо Instagram — шапку разгрузили).
//
//   гость     — клик открывает окно входа (то же, что у замка цены аукциона);
//   вошедший  — иконка в бронзе, клик раскрывает меню: кабинет, выход.
//
// ⚠️ Вход определяется по cookie сессии (hasSessionCookie), БЕЗ клиента
// Supabase: шапка на каждой странице, а библиотека — ~62 КБ (см. authEvents.ts).
// Выход грузит клиент лениво, только по нажатию. После входа/выхода
// приходит AUTH_CHANGED_EVENT — иконка перерисовывается без перезагрузки.

import { LogOut, User, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AUTH_CHANGED_EVENT, hasSessionCookie, notifyAuthChanged, openAuthModal } from "@/components/Auth/authEvents";
import { trackEvent } from "@/utils/gtag";

const TEXT: Record<string, { signIn: string; account: string; signOut: string; profile: string }> = {
  ru: { signIn: "Войти", account: "Личный кабинет", signOut: "Выйти", profile: "Профиль" },
  en: { signIn: "Sign in", account: "My account", signOut: "Sign out", profile: "Profile" },
  ka: { signIn: "შესვლა", account: "პირადი კაბინეტი", signOut: "გასვლა", profile: "პროფილი" },
  ar: { signIn: "تسجيل الدخول", account: "حسابي", signOut: "تسجيل الخروج", profile: "الملف الشخصي" },
};

export default function ProfileButton({ lang, small = false }: { lang: string; small?: boolean }) {
  const router = useRouter();
  const l = TEXT[lang] ?? TEXT.en;
  // До монтирования — «гость»: сервер cookie браузера не видит в этом компоненте,
  // а первая клиентская отрисовка обязана совпасть с серверной.
  const [signedIn, setSignedIn] = useState(false);
  const [menu, setMenu] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setSignedIn(hasSessionCookie());
    sync();
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    window.addEventListener("focus", sync); // вошёл в другой вкладке
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const signOut = async () => {
    setMenu(false);
    const { createClient } = await import("@/lib/supabase/client");
    await createClient().auth.signOut();
    trackEvent("logout");
    notifyAuthChanged();
    router.refresh(); // страницы с ценами по входу перерисуются уже для гостя
  };

  const size = small ? "w-9 h-9" : "w-10 h-10 hover:scale-110 hover:shadow-[0_0_12px_rgba(182,119,73,0.4)]";
  const icon = small ? "w-[18px] h-[18px]" : "w-5 h-5";

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={signedIn ? l.profile : l.signIn}
        title={signedIn ? l.profile : l.signIn}
        aria-expanded={signedIn ? menu : undefined}
        onClick={() =>
          signedIn ? setMenu((v) => !v) : openAuthModal({ lang: lang === "ru" ? "ru" : "en", reason: "header" })
        }
        className={`relative flex cursor-pointer items-center justify-center rounded-full transition-all duration-200 hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)] ${size}`}
        style={{
          backgroundColor: signedIn ? "rgba(182,119,73,0.18)" : "rgba(255,255,255,0.08)",
          color: signedIn ? "var(--axis-orange)" : "var(--axis-silver)",
          border: signedIn ? "1.5px solid rgba(182,119,73,0.4)" : "1.5px solid rgba(255,255,255,0.12)",
        }}
      >
        {signedIn ? <UserRound className={icon} strokeWidth={2.2} /> : <User className={icon} strokeWidth={2.2} />}
      </button>

      {/* ⚠️ Цвет пунктов — КЛАССАМИ, а не style: инлайн-цвет перебивает hover:text-*,
          и подсветка при наведении молча не работала. */}
      {menu && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[220px] overflow-hidden rounded-xl border border-white/10 p-1.5 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.85),0_0_0_1px_rgba(182,119,73,0.12)]"
          style={{ backgroundColor: "var(--axis-charcoal)" }}
        >
          <Link
            href={`/${lang}/account`}
            role="menuitem"
            onClick={() => setMenu(false)}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--axis-silver)] transition-colors hover:bg-white/[0.07] hover:text-[var(--axis-white)] focus-visible:bg-white/[0.07] focus-visible:text-[var(--axis-white)] focus-visible:outline-none"
          >
            <UserRound className="h-4 w-4 text-[var(--axis-bronze)]" />
            {l.account}
          </Link>
          <div className="my-1 h-px bg-white/[0.06]" />
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--axis-gray)] transition-colors hover:bg-red-500/10 hover:text-red-300 focus-visible:bg-red-500/10 focus-visible:text-red-300 focus-visible:outline-none"
          >
            <LogOut className="h-4 w-4" />
            {l.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
