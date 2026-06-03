"use client";

import { useState, useEffect } from "react";
import { X, MessageCircle, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import CarRequestForm from "./CarRequestForm";
import { trackEvent } from "@/utils/gtag";

const WA_PHONE = "821058654344";
const SUPPORTED_LANGS = ["ru", "en", "ko", "ka", "ar"];

const WA_TEXT: Record<string, (id: string, name: string) => string> = {
  ru: (id, name) => `Здравствуйте! Интересует ${name}, ID: ${id} — https://www.kmotors.shop/ru/catalog/${id}`,
  en: (id, name) => `Hello! I'm interested in ${name}, ID: ${id} — https://www.kmotors.shop/en/catalog/${id}`,
  ko: (id, name) => `안녕하세요! ${name} 차량에 관심 있습니다, ID: ${id}`,
  ka: (id, name) => `გამარჯობა! მაინტერესებს ${name}, ID: ${id}`,
  ar: (id, name) => `مرحباً! أنا مهتم بـ ${name}, ID: ${id}`,
};

interface StickyMobileCTAProps {
  carId: string;
  carName: string;
}

export default function StickyMobileCTA({ carId, carName }: StickyMobileCTAProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const segments = pathname.split("/");
  const lang = SUPPORTED_LANGS.includes(segments[1]) ? segments[1] : "ru";

  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Показываем сразу — не ждём 300px
    const handler = () => setVisible(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const waUrl = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent((WA_TEXT[lang] ?? WA_TEXT.ru)(carId, carName))}`;
  const tgUrl = `https://t.me/KMOTORS_form_bot?start=car_${carId}`;

  if (!visible) return null;

  return (
    <>
      {/* Sticky панель снизу */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
        style={{
          backgroundColor: "var(--axis-charcoal)",
          borderTop: "1px solid rgba(255,69,0,0.25)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
        }}
      >
        <div className="flex items-center gap-2 p-3">
          {/* Telegram */}
          <a
            href={tgUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("contact", { method: "telegram_sticky", car_id: carId })}
            className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 transition-all active:scale-95"
            style={{ backgroundColor: "rgba(34,158,217,0.15)", color: "#229ED9" }}
            aria-label="Telegram"
          >
            <Send className="w-5 h-5" />
          </a>

          {/* WhatsApp */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("contact", { method: "whatsapp_sticky", car_id: carId })}
            className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 transition-all active:scale-95"
            style={{ backgroundColor: "rgba(37,211,102,0.15)", color: "#25D366" }}
            aria-label="WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
          </a>

          {/* Главная CTA */}
          <button
            onClick={() => { setModalOpen(true); trackEvent("contact", { method: "form_sticky", car_id: carId }); }}
            className="flex-1 h-12 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, var(--axis-orange), var(--axis-amber))",
              boxShadow: "0 4px 16px rgba(255,69,0,0.3)",
            }}
          >
            {t("car.wantThisCar", "Хочу эту машину")}
          </button>
        </div>
      </div>

      {/* Модалка с формой */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center lg:hidden"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

          <div
            className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl"
            style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}
          >
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(74,74,74,0.3)", color: "var(--axis-gray)" }}
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>

            <p className="font-bold text-lg mb-1" style={{ color: "var(--axis-white)" }}>
              {t("car.wantThisCarShort", "Хочу эту машину")}
            </p>
            <p className="text-sm mb-4" style={{ color: "var(--axis-gray)" }}>
              {t("car.managerContact", "Менеджер свяжется в течение 1 часа")}
            </p>

            <CarRequestForm
              carId={carId}
              carName={carName}
              source="car_detail_mobile"
              onSuccess={() => setModalOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
