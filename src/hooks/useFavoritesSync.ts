"use client";

import { useEffect, useState } from "react";
import { readStorage as readFavorites, writeStorage, FavoriteCar } from "./useFavorites";

const CHECK_INTERVAL = 60 * 60 * 1000; // раз в час максимум
const SYNC_KEY = "kmotors_favorites_last_sync";

export interface PriceChange {
  id: string;
  name: string;
  oldPrice: string;
  newPrice: string;
  diff: number; // отрицательный = снижение
}

async function fetchCarPrice(id: string): Promise<{ price: string | null; exists: boolean }> {
  try {
    const res = await fetch(
      `https://api.encar.com/search/car/list/premium?count=true&q=(And.Hidden.N._.Id.${id}.)&sr=%7CModifiedDate%7C0%7C1`,
      { headers: { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6)" }, cache: "no-store" }
    );
    const data = await res.json();
    const car = data?.SearchResults?.[0];
    if (!car) return { price: null, exists: false };
    return { price: String(car.Price), exists: true };
  } catch {
    return { price: null, exists: true }; // ошибка сети — не помечаем как продано
  }
}

export function useFavoritesSync() {
  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const lastSync = parseInt(localStorage.getItem(SYNC_KEY) || "0", 10);
    if (Date.now() - lastSync < CHECK_INTERVAL) return; // проверяли недавно

    const favorites = readFavorites();
    if (favorites.length === 0) return;

    localStorage.setItem(SYNC_KEY, Date.now().toString());

    // Проверяем по одному с небольшой задержкой чтобы не спамить API
    const check = async () => {
      const changes: PriceChange[] = [];
      const updated = [...favorites];

      for (let i = 0; i < updated.length; i++) {
        const car = updated[i];
        const { price, exists } = await fetchCarPrice(car.id);

        // Авто продано
        if (!exists) {
          updated[i] = { ...car, sold: true, priceCheckedAt: Date.now() };
          continue;
        }

        // Сбрасываем флаг продано если авто снова появилось
        if (car.sold) {
          updated[i] = { ...car, sold: false, priceCheckedAt: Date.now() };
        }

        // Цена изменилась
        if (price && price !== car.price) {
          const oldP = Number(car.price);
          const newP = Number(price);
          if (!isNaN(oldP) && !isNaN(newP)) {
            changes.push({
              id: car.id,
              name: `${car.manufacture} ${car.model} ${car.year}`,
              oldPrice: car.price,
              newPrice: price,
              diff: newP - oldP,
            });
            updated[i] = { ...car, price, priceCheckedAt: Date.now() };
          }
        }

        // Небольшая пауза между запросами
        await new Promise(r => setTimeout(r, 300));
      }

      writeStorage(updated);
      if (changes.length > 0) setPriceChanges(changes);
    };

    check();
  }, []);

  return { priceChanges, dismissed, dismiss: () => setDismissed(true) };
}
