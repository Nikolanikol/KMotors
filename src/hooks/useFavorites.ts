"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "kmotors_favorites";
const SYNC_EVENT = "kmotors_favorites_sync";

export interface FavoriteCar {
  id: string;
  photo: string;
  model: string;
  manufacture: string;
  year: string;
  mileage: string;
  transmission: string;
  fuel: string;
  price: string;
}

function readStorage(): FavoriteCar[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStorage(next: FavoriteCar[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(SYNC_EVENT));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteCar[]>([]);

  useEffect(() => {
    setFavorites(readStorage());
    const sync = () => setFavorites(readStorage());
    window.addEventListener(SYNC_EVENT, sync);
    return () => window.removeEventListener(SYNC_EVENT, sync);
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback((car: FavoriteCar) => {
    const prev = readStorage();
    const exists = prev.some((f) => f.id === car.id);
    const next = exists ? prev.filter((f) => f.id !== car.id) : [...prev, car];
    writeStorage(next);
  }, []);

  const removeFavorite = useCallback((id: string) => {
    const next = readStorage().filter((f) => f.id !== id);
    writeStorage(next);
  }, []);

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}
