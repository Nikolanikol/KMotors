"use client";

import { langOrDefault } from "@/lib/lang";
import { useState, useEffect } from "react";
import { X, MessageCircle, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import CarRequestForm from "./CarRequestForm";
import { trackEvent } from "@/utils/gtag";
import { clarityEvent } from "@/utils/clarity";
import { carContactLinks } from "@/lib/carContactLinks";

interface StickyMobileCTAProps {
  carId: string;
  carName: string;
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]";

export default function StickyMobileCTA({ carId, carName }: StickyMobileCTAProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const segments = pathname.split("/");
  const lang = langOrDefault(segments[1]);

  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  // Заявка ушла: в модалке остаётся только экран «Заявка отправлена» и «Закрыть».
  const [sent, setSent] = useState(false);

  useEffect(() => {
    // Показываем сразу — не ждём 300px
    const handler = () => setVisible(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Пока плашка видна, круглая кнопка мессенджеров сайта (MessengerButtons)
  // поднимается над ней — правило body[data-sticky-cta] в globals.css. Без
  // этого она ложится на правый край кнопки «Хочу эту машину». Образец —
  // Carnect/LotStickyBar. Пока открыта модалка, кнопка прячется совсем
  // ("modal"): она рисуется позже страницы и лежала бы поверх формы.
  const stickyState = visible ? (modalOpen ? "modal" : "1") : null;
  useEffect(() => {
    if (!stickyState) return;
    document.body.dataset.stickyCta = stickyState;
    return () => {
      delete document.body.dataset.stickyCta;
    };
  }, [stickyState]);

  const closeModal = () => {
    setModalOpen(false);
    setSent(false);
  };

  const { waUrl, tgUrl } = carContactLinks(lang, carId, carName);

  if (!visible) return null;

  return (
    <>
      {/* Sticky панель снизу */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
        style={{
          backgroundColor: "var(--axis-charcoal)",
          borderTop: "1px solid rgba(182,119,73,0.25)",
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
            className={`flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 transition-all active:scale-95 hover:brightness-125 ${FOCUS_RING}`}
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
            className={`flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 transition-all active:scale-95 hover:brightness-125 ${FOCUS_RING}`}
            style={{ backgroundColor: "rgba(37,211,102,0.15)", color: "#25D366" }}
            aria-label="WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
          </a>

          {/* Главная CTA */}
          <button
            type="button"
            onClick={() => { setModalOpen(true); trackEvent("contact", { method: "form_sticky", car_id: carId }); clarityEvent("form_open"); }}
            className={`flex-1 h-12 rounded-xl font-bold text-sm text-white transition-all active:scale-95 hover:brightness-110 ${FOCUS_RING}`}
            // Заливка — bronze-deep: белый текст на светлой бронзе даёт 3.8:1.
            style={{
              backgroundColor: "var(--axis-bronze-deep)",
              backgroundImage: "var(--axis-bronze-fill)",
              boxShadow: "0 4px 16px rgba(182,119,73,0.3)",
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
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />

          <div
            className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6"
            style={{
              backgroundColor: "var(--axis-charcoal)",
              border: "1px solid rgba(74,74,74,0.3)",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.5), 0 24px 64px rgba(0,0,0,0.6), 0 0 32px rgba(182,119,73,0.12)",
            }}
          >
            <button
              type="button"
              onClick={closeModal}
              className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-white/10 ${FOCUS_RING}`}
              style={{ backgroundColor: "rgba(74,74,74,0.3)", color: "var(--axis-gray)" }}
              aria-label={t("car.close", "Закрыть")}
            >
              <X className="w-4 h-4" />
            </button>

            {!sent && (
              <>
                <p className="font-bold text-lg mb-1" style={{ color: "var(--axis-white)" }}>
                  {t("car.wantThisCarShort", "Хочу эту машину")}
                </p>
                <p className="text-sm mb-4" style={{ color: "var(--axis-gray)" }}>
                  {t("car.managerContact", "Менеджер свяжется в течение 1 часа")}
                </p>
              </>
            )}

            {/* Модалка НЕ закрывается на успехе: клиент должен увидеть
                подтверждение. Закрывает его кнопка на экране успеха. */}
            <CarRequestForm
              carId={carId}
              carName={carName}
              source="car_detail_mobile"
              onSuccess={() => setSent(true)}
              onClose={closeModal}
            />
          </div>
        </div>
      )}
    </>
  );
}
