"use client";

// Сердечко «в избранное» — одно на весь сайт: карточки Encar, плитки и
// страница машины аукциона. Свой компонент, чтобы правка вида была одной.
//
// Вид — как у кнопки корзины в шапке: круг на полупрозрачной подложке, в
// активном состоянии бронзовая заливка сердца и бронзовое свечение. Цвета —
// токены бренда (CLAUDE.md, «Бренд»): светлая бронза для иконки, тёмная — для
// заливки фона не используется, белого текста здесь нет.
//
// ⚠️ Кнопка обычно лежит ПОВЕРХ ссылки на машину (фото в карточке), поэтому
// клик гасит и всплытие, и переход: иначе сохранение открывало бы машину.

import { Heart } from "lucide-react";
import { useState } from "react";

export default function HeartButton({
  active,
  onToggle,
  label,
  size = "md",
  className = "",
}: {
  active: boolean;
  onToggle: () => void;
  /** aria-label: «В избранное» / «Убрать из избранного» на языке страницы. */
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  // Короткий «пульс» только при добавлении — удаление не празднуем.
  const [pop, setPop] = useState(false);
  const box = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!active) {
          setPop(true);
          window.setTimeout(() => setPop(false), 300);
        }
        onToggle();
      }}
      className={`flex flex-shrink-0 cursor-pointer items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-95 ${box} ${className}`}
      style={{
        backgroundColor: active ? "rgba(182,119,73,0.22)" : "rgba(10,10,10,0.55)",
        border: active ? "1.5px solid rgba(182,119,73,0.55)" : "1.5px solid rgba(255,255,255,0.18)",
        boxShadow: active ? "0 0 14px rgba(182,119,73,0.35)" : "none",
        color: active ? "var(--axis-bronze)" : "var(--axis-cream, #F5F0EB)",
      }}
    >
      <Heart
        className={`${icon} transition-transform duration-300 ${pop ? "scale-125" : "scale-100"}`}
        strokeWidth={2.2}
        fill={active ? "currentColor" : "none"}
      />
    </button>
  );
}
