"use client";

import { langOrDefault } from "@/lib/lang";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "cookie-consent";

const TEXT: Record<string, { message: string; accept: string; more: string }> = {
  ru: {
    message: "Мы используем файлы cookie для аналитики и улучшения сайта.",
    accept: "Принять",
    more: "Подробнее",
  },
  en: {
    message: "We use cookies for analytics and to improve your experience.",
    accept: "Accept",
    more: "Learn more",
  },
  ko: {
    message: "저희는 분석 및 서비스 개선을 위해 쿠키를 사용합니다.",
    accept: "동의",
    more: "자세히",
  },
  ka: {
    message: "ჩვენ ვიყენებთ ქუქიებს ანალიტიკისა და საიტის გასაუმჯობესებლად.",
    accept: "მიღება",
    more: "დეტალები",
  },
  ar: {
    message: "نستخدم ملفات تعريف الارتباط للتحليل وتحسين تجربتك.",
    accept: "قبول",
    more: "المزيد",
  },
};

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const segments = pathname.split("/");
  const lang = langOrDefault(segments[1]);
  const t = TEXT[lang] ?? TEXT.ru;

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // небольшая задержка чтобы не мешать первому рендеру
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Пока баннер виден, <body data-cookie-banner> — крючок для globals.css: на карточке
  // машины с мобильной плашкой заявки баннер встаёт НАД плашкой, а не закрывает её.
  useEffect(() => {
    if (!visible) return;
    document.body.dataset.cookieBanner = "1";
    return () => {
      delete document.body.dataset.cookieBanner;
    };
  }, [visible]);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      // cookie-banner — крючок для globals.css (положение над мобильной плашкой заявки).
      // На телефоне баннер в ОДНУ строку: двухстрочный (текст + кнопка) занимал ~120px и
      // целиком закрывал нижнюю кнопку «Хочу эту машину» и кнопку чата.
      className="cookie-banner fixed bottom-0 left-0 right-0 z-[100] px-4 sm:px-6 py-2.5 sm:py-3 flex flex-row items-center gap-3 sm:gap-5"
      style={{
        backgroundColor: "var(--axis-charcoal)",
        borderTop: "1px solid rgba(182,119,73,0.2)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
      }}
    >
      <p className="text-xs sm:text-sm flex-1 text-left leading-snug" style={{ color: "var(--axis-gray)" }}>
        {t.message}{" "}
        <Link
          href={`/${lang}/privacy`}
          className="underline underline-offset-2 transition-colors"
          style={{ color: "var(--axis-orange)" }}
          aria-label="Политика конфиденциальности и cookies"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        >
          {t.more}
        </Link>
      </p>
      <button
        onClick={accept}
        className="px-4 sm:px-6 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
        style={{ backgroundColor: "var(--axis-bronze-deep)", backgroundImage: "var(--axis-bronze-fill)", color: "white" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
      >
        {t.accept}
      </button>
    </div>
  );
}
