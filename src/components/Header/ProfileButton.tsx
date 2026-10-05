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
        className={`relative flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${size}`}
        style={{
          backgroundColor: signedIn ? "rgba(182,119,73,0.18)" : "rgba(255,255,255,0.08)",
          color: signedIn ? "var(--axis-orange)" : "var(--axis-silver)",
          border: signedIn ? "1.5px solid rgba(182,119,73,0.4)" : "1.5px solid rgba(255,255,255,0.12)",
        }}
      >
        {signedIn ? <UserRound className={icon} strokeWidth={2.2} /> : <User className={icon} strokeWidth={2.2} />}
      </button>

      {menu && (
        <div
          className="absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-xl border border-white/10 py-2 shadow-2xl"
          style={{ backgroundColor: "var(--axis-charcoal)" }}
        >
          <Link
            href={`/${lang}/account`}
            onClick={() => setMenu(false)}
            className="block px-4 py-2 text-sm font-medium transition-colors hover:text-[var(--axis-white)]"
            style={{ color: "var(--axis-gray)" }}
          >
            {l.account}
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium transition-colors hover:text-[var(--axis-white)]"
            style={{ color: "var(--axis-gray)" }}
          >
            <LogOut className="h-4 w-4" />
            {l.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
