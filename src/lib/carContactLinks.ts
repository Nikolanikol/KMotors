// Ссылки «написать по этой машине» — Telegram и WhatsApp С ПРИВЯЗКОЙ К МАШИНЕ.
//
// Один источник на мобильную плашку (StickyMobileCTA) и боковую колонку
// десктопа (CarDetailSidebar): менеджер должен получить id машины и ссылку на
// карточку независимо от того, с какого экрана клиент написал. Раньше текст
// жил внутри StickyMobileCTA, и у десктопа привязки не было вовсе.
//
// ⚠️ Чистая функция, без React и window: покрыта tests/catalog/carContactLinks.spec.ts.
import { SITE_URL } from "@/lib/site";
import { WA_PHONE } from "@/lib/contact";

/** Бот заявок. Параметр `start=car_<id>` бот превращает в «клиент смотрит машину <id>». */
export const TG_BOT_URL = "https://t.me/KMOTORS_form_bot";

/** Текст первого сообщения в WhatsApp. Адрес карточки — на всех языках. */
const WA_TEXT: Record<string, (id: string, name: string) => string> = {
  ru: (id, name) => `Здравствуйте! Интересует ${name}, ID: ${id} — ${SITE_URL}/ru/catalog/${id}`,
  en: (id, name) => `Hello! I'm interested in ${name}, ID: ${id} — ${SITE_URL}/en/catalog/${id}`,
  ko: (id, name) => `안녕하세요! ${name} 차량에 관심 있습니다, ID: ${id} — ${SITE_URL}/ko/catalog/${id}`,
  ka: (id, name) => `გამარჯობა! მაინტერესებს ${name}, ID: ${id} — ${SITE_URL}/ka/catalog/${id}`,
  ar: (id, name) => `مرحباً! أنا مهتم بـ ${name}, ID: ${id} — ${SITE_URL}/ar/catalog/${id}`,
};

export interface CarContactLinks {
  waUrl: string;
  tgUrl: string;
}

export function carContactLinks(lang: string, carId: string, carName: string): CarContactLinks {
  const text = (WA_TEXT[lang] ?? WA_TEXT.ru)(carId, carName);
  return {
    waUrl: `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`,
    tgUrl: `${TG_BOT_URL}?start=car_${encodeURIComponent(carId)}`,
  };
}
