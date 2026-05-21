"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import CarRequestForm from "./CarRequestForm";

interface StickyMobileCTAProps {
  carId: string;
  carName: string;
}

export default function StickyMobileCTA({ carId, carName }: StickyMobileCTAProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Полоска внизу экрана — только мобильный */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 shadow-2xl lg:hidden" style={{ backgroundColor: "var(--axis-charcoal)", borderTop: "1px solid rgba(255,69,0,0.3)" }}>
        <button
          onClick={() => setModalOpen(true)}
          className="w-full py-3.5 rounded-xl font-bold text-base text-white"
          style={{ backgroundColor: "var(--axis-orange)" }}
        >
          {t("car.wantThisCar", "Хочу эту машину — оставить заявку")}
        </button>
      </div>

      {/* Модалка с формой */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center lg:hidden"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          {/* Затемнение фона */}
          <div className="absolute inset-0 bg-black/50" />

          <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1"
              style={{ color: "var(--axis-gray)" }}
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            <p className="font-bold text-lg mb-1" style={{ color: "var(--axis-white)" }}>{t("car.wantThisCarShort", "Хочу эту машину")}</p>
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
