// Манифест ядра «аукцион» (carnect, HeyDealer, K Car, витрины).
// Новый маршрут аукциона — добавить сюда, а не в middleware.

import { LANG_GROUP } from "./shared";

/** Страницы под запретом из Кореи («и вниз по дереву»). */
export const AUCTION_KR_BLOCKED_PAGES = ["auction"] as const;

/** API аукциона: `/api/<x>` и ниже. */
export const AUCTION_KR_BLOCKED_API = ["carnect", "kcar"] as const;

// Витрина аукциона без подпутей: /auction, /ru/auction. Лоты (/auction/lot/…)
// закрыты в robots.ts, /auction/lotte и /auction/sk только редиректят.
const AUCTION_SHOWCASE = new RegExp(`^\\/(?:${LANG_GROUP}\\/)?auction\\/?$`);

export function isAuctionShowcasePath(path: string): boolean {
  return AUCTION_SHOWCASE.test(path);
}
