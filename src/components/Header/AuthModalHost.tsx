"use client";

// Ленивая загрузка окна входа (AuthModal) для шапки.
//
// ⚠️ AuthModal тянет клиент Supabase (~62 КБ по сети), а шапка есть на каждой
// странице сайта. Поэтому здесь только слушатель события: модуль окна
// загружается при ПЕРВОМ openAuthModal, а то первое событие передаётся ему
// пропом — сам он к тому моменту ещё не слушал. Дальше окно живёт и ловит
// события само.

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { AUTH_OPEN_EVENT, type AuthOpenDetail } from "@/components/Auth/authEvents";

const AuthModal = dynamic(() => import("@/components/Auth/AuthModal"), { ssr: false });

export default function AuthModalHost() {
  const [first, setFirst] = useState<AuthOpenDetail | null>(null);

  useEffect(() => {
    if (first) return;
    const onOpen = (e: Event) => setFirst((e as CustomEvent<AuthOpenDetail>).detail ?? { lang: "en", reason: "unknown" });
    window.addEventListener(AUTH_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(AUTH_OPEN_EVENT, onOpen);
  }, [first]);

  return first ? <AuthModal initial={first} /> : null;
}
