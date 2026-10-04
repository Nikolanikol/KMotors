"use client";

// Наклон с бликом при наведении — тот же, что у карточек каталога Encar
// (src/components/Catalog/Row/CarCard.tsx): perspective-поворот на 0.025°
// за пиксель от центра, лёгкое увеличение, блик за курсором, бронзовая тень.
// Плитка каталога carnect серверная, поэтому клиентская здесь только обёртка.
//
// Коэффициент оттуда же и годится только для карточек такого размера (~300 px):
// на широком блоке он выворачивает его целиком — см. баннер партнёра в CLAUDE.md.

import { useCallback, useRef, type ReactNode } from "react";

const REST = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";

export default function TiltCard({ children }: { children: ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glossyRef = useRef<HTMLDivElement>(null);

  const move = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    const glossy = glossyRef.current;
    if (!card || !glossy) return;
    const r = card.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    card.style.transform = `perspective(1000px) rotateX(${-dy * 0.025}deg) rotateY(${dx * 0.025}deg) scale3d(1.02,1.02,1.02)`;
    const gx = ((e.clientX - r.left) / r.width) * 100;
    const gy = ((e.clientY - r.top) / r.height) * 100;
    glossy.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.08) 0%, transparent 60%)`;
  }, []);

  const leave = useCallback(() => {
    const card = cardRef.current;
    if (card) {
      card.style.transform = REST;
      card.style.boxShadow = "none";
      card.style.borderColor = "rgba(74,74,74,0.25)";
    }
    if (glossyRef.current) glossyRef.current.style.background = "transparent";
  }, []);

  return (
    <div
      ref={cardRef}
      className="group relative overflow-hidden rounded-xl"
      style={{
        border: "1px solid rgba(74,74,74,0.25)",
        transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease, border-color 0.4s ease",
      }}
      onMouseMove={move}
      onMouseLeave={leave}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 20px 60px rgba(182,119,73,0.12)";
        e.currentTarget.style.borderColor = "rgba(182,119,73,0.3)";
      }}
    >
      <div ref={glossyRef} className="pointer-events-none absolute inset-0 z-20 rounded-xl transition-all duration-200" />
      {children}
    </div>
  );
}
