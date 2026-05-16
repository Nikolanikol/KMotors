"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

const TG_URL = "https://t.me/KMOTORS_form_bot";

const LABEL: Record<string, string> = {
  ru: "Написать в Telegram",
  en: "Write on Telegram",
  ko: "텔레그램으로 문의",
  ka: "Telegram-ზე დაწერა",
  ar: "اكتب على تيليغرام",
};

export default function TelegramFloat() {
  const { i18n } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const label = LABEL[i18n.language] ?? LABEL.ru;

  return (
    <a
      href={TG_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#229ED9] hover:bg-[#1a8bc2] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
      style={{ padding: hovered ? "14px 20px 14px 16px" : "14px" }}
    >
      {/* Telegram SVG icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6 flex-shrink-0"
      >
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.48 13.617l-2.95-.924c-.64-.203-.654-.64.136-.948l11.52-4.44c.532-.194 1 .12.376.943z" />
      </svg>

      {/* Label — показывается при hover */}
      <span
        className="text-sm font-semibold whitespace-nowrap overflow-hidden transition-all duration-300"
        style={{ maxWidth: hovered ? "180px" : "0px", opacity: hovered ? 1 : 0 }}
      >
        {label}
      </span>
    </a>
  );
}
