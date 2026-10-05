"use client";

// «🔒 Войдите, чтобы увидеть цену» — на месте цены лота у гостя.
//
// Цены в разметке у гостя НЕТ вовсе (её не отдаёт сервер — CatalogView и
// страница лота проверяют вход через getViewer). Этот компонент только
// предлагает войти: клик открывает AuthModal поверх страницы.
//
// Аналитика: price_gate_view — гость увидел замок (раз за страницу),
// price_gate_click — нажал. Вместе с sign_up это и есть воронка регистрации.

import { Lock } from "lucide-react";
import { useEffect } from "react";

import { pick, type CardLang, type Pair } from "@/lib/carnect/lang";
import { trackEvent, trackOnce } from "@/utils/gtag";

import { openAuthModal } from "./AuthModal";

const LABEL: Pair = ["Войдите, чтобы увидеть цену", "Sign in to see the price"];
const SHORT: Pair = ["Цена после входа", "Sign in for price"];

export default function PriceLock({
  lang,
  reason = "price",
  size = "md",
  className = "",
}: {
  lang: CardLang;
  /** Откуда открыли окно — в аналитику (price, price_filter, price_sort…). */
  reason?: string;
  /** sm — плитка каталога, md — блок цены на странице лота. */
  size?: "sm" | "md";
  className?: string;
}) {
  useEffect(() => {
    trackOnce("price_gate_view", "price_gate_view", { reason });
  }, [reason]);

  return (
    <button
      type="button"
      onClick={(e) => {
        // Замок лежит внутри ссылки на лот (плитка) — клик не должен её открывать.
        e.preventDefault();
        e.stopPropagation();
        trackEvent("price_gate_click", { reason });
        openAuthModal({ lang, reason });
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition hover:brightness-110 ${
        size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
      } ${className}`}
      style={{
        color: "var(--axis-bronze)",
        border: "1px solid rgba(182,119,73,0.45)",
        backgroundColor: "rgba(182,119,73,0.08)",
      }}
    >
      <Lock className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {pick(lang, size === "sm" ? SHORT : LABEL)}
    </button>
  );
}
