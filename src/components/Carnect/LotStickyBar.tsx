"use client";

// Плашка «Хочу эту машину» внизу экрана телефона — по образцу StickyMobileCTA
// карточки Encar. Зачем: на телефоне форма заявки стоит под фото, и стоит
// пролистать характеристики, лист осмотра и историю — до неё далеко.
//
// Кнопка не открывает вторую форму, а ПРОКРУЧИВАЕТ к той, что под фото
// (#lot-request): там выбор цели обращения (торги / под ключ / проверка),
// и двум формам с разным поведением на одной странице делать нечего.
// Пока форма на экране, плашка прячется — иначе она закрывает собственную цель.
//
// Только до lg: на широком экране форма и так липкая справа.

import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

export const REQUEST_ANCHOR = "lot-request";

export default function LotStickyBar({
  price,
  priceUsd,
  label,
  waHref,
}: {
  /** Главная цена строкой: «start ₩12,000,000» / «by bidding». */
  price: string;
  /** Справка в долларах, если есть. */
  priceUsd: string | null;
  label: string;
  waHref: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [formInView, setFormInView] = useState(false);

  useEffect(() => {
    // Как у Encar: не с первого пикселя, а когда человек начал листать.
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const form = document.getElementById(REQUEST_ANCHOR);
    const io = form && new IntersectionObserver(([e]) => setFormInView(e.isIntersecting), { threshold: 0.15 });
    if (form && io) io.observe(form);
    return () => {
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, []);

  const shown = scrolled && !formInView;

  // Пока плашка видна, круглая кнопка мессенджеров сайта (MessengerButtons)
  // поднимается над ней — правило body[data-sticky-cta] в globals.css. Без
  // этого она ложится ровно на «I want this car».
  useEffect(() => {
    if (!shown) return;
    document.body.dataset.stickyCta = "1";
    return () => {
      delete document.body.dataset.stickyCta;
    };
  }, [shown]);

  if (!shown) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
      style={{
        backgroundColor: "var(--axis-charcoal)",
        borderTop: "1px solid rgba(182,119,73,0.25)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
            {price}
          </div>
          {priceUsd && (
            <div className="text-xs" style={{ color: "var(--axis-gray)" }}>
              {priceUsd}
            </div>
          )}
        </div>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all active:scale-95"
          style={{ backgroundColor: "rgba(37,211,102,0.15)", color: "#25D366" }}
          aria-label="WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
        </a>
        <button
          type="button"
          onClick={() => document.getElementById(REQUEST_ANCHOR)?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="h-12 flex-shrink-0 rounded-xl px-5 text-sm font-bold text-white transition-all active:scale-95"
          // Заливка — тёмная бронза: на светлой белый текст не проходит AA (CLAUDE.md, «Бренд»).
          style={{
            backgroundColor: "var(--axis-bronze-deep)",
            backgroundImage: "var(--axis-bronze-fill)",
            boxShadow: "0 4px 16px rgba(182,119,73,0.3)",
          }}
        >
          {label}
        </button>
      </div>
    </div>
  );
}
