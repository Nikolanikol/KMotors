"use client";

// Избранное для лотов аукционов и машин HeyDealer (carnect).
//
// ⚠️ Хранится СНИМОК, а не только id. Лот живёт дни: после торгов страница
// отдаёт «ушла с торгов», и в избранном без снимка осталась бы пустая строка.
// Со снимком человек видит, что сохранял (фото, название, цена, площадка), а
// «торги прошли» и ссылка на похожие в каталоге — на месте самой машины.
//
// Отдельный ключ, а не общий с Encar (kmotors_favorites): у тех и других
// разная форма записи, а Encar-избранное читают ещё /favorites и /compare.
// Сводит их вместе панель избранного (FavoritesDrawer), каждый раздел — со
// своим источником.

import { useCallback, useEffect, useState } from "react";

import { trackEvent } from "@/utils/gtag";

const STORAGE_KEY = "kaxis:auction_favorites";
const SYNC_EVENT = "kaxis_auction_favorites_sync";

export interface FavoriteLot {
  /** «glovis/<lotId>», «heydealer/<id>» — то же, что в адресе страницы. */
  key: string;
  house: string;
  externalId: string;
  title: string;
  /** «Lotte Auto Auction · Bundang», «HeyDealer · Zero». */
  source: string;
  photo: string | null;
  priceKrw: number | null;
  priceKind: "start" | "fixed" | "none";
  /** День торгов YYYY-MM-DD или точное время (ISO) — чтобы показать «торги прошли». */
  auctionDate: string | null;
  endAt: string | null;
  make: string | null;
  modelGroup: string | null;
  savedAt: number;
}

function read(): FavoriteLot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function write(next: FavoriteLot[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Приватный режим или переполнено — избранное не сохранится, но и страница не упадёт.
  }
  window.dispatchEvent(new Event(SYNC_EVENT));
}

export function useAuctionFavorites() {
  const [favorites, setFavorites] = useState<FavoriteLot[]>([]);

  useEffect(() => {
    setFavorites(read());
    const sync = () => setFavorites(read());
    window.addEventListener(SYNC_EVENT, sync);
    // Другая вкладка поменяла избранное — подхватываем без перезагрузки.
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && sync();
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const isFavorite = useCallback((key: string) => favorites.some((f) => f.key === key), [favorites]);

  const toggleFavorite = useCallback((lot: Omit<FavoriteLot, "savedAt">) => {
    const prev = read();
    const exists = prev.some((f) => f.key === lot.key);
    // Новые сверху: в панели последним сохранённое ищут первым.
    const next = exists ? prev.filter((f) => f.key !== lot.key) : [{ ...lot, savedAt: Date.now() }, ...prev];
    write(next);
    // Стандартное имя GA4, общее с избранным Encar и запчастей. Раздел ставит trackEvent.
    trackEvent(exists ? "remove_from_wishlist" : "add_to_wishlist", {
      car_id: lot.key,
      car_name: lot.title,
      source: "auction",
      favorites_count: next.length,
    });
  }, []);

  const removeFavorite = useCallback((key: string) => write(read().filter((f) => f.key !== key)), []);

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}
