"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import CarRequestForm from "./CarRequestForm";

interface StickyMobileCTAProps {
  carId: string;
  carName: string;
}

export default function StickyMobileCTA({ carId, carName }: StickyMobileCTAProps) {
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
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-white border-t-2 border-orange-200 shadow-2xl lg:hidden">
        <button
          onClick={() => setModalOpen(true)}
          className="w-full bg-orange-500 active:bg-orange-600 text-white py-3.5 rounded-xl font-bold text-base"
        >
          Хочу эту машину — оставить заявку
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

          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            <p className="font-bold text-lg mb-1">Хочу эту машину</p>
            <p className="text-sm text-gray-500 mb-4">
              Менеджер свяжется в течение 1 часа
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
