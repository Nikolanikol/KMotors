"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "kmotors_parts_favorites";
const SYNC_EVENT = "kmotors_parts_favorites_sync";

export interface FavoritePart {
  id: number;
  name_ru: string;
  name_en: string;
  name_ko: string | null;
  part_number: string;
  price_krw: number;
  image_url: string | null;
  is_new: boolean;
}

function readStorage(): FavoritePart[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStorage(next: FavoritePart[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(SYNC_EVENT));
}

export function usePartsFavorites() {
  const [favorites, setFavorites] = useState<FavoritePart[]>([]);

  useEffect(() => {
    setFavorites(readStorage());
    const sync = () => setFavorites(readStorage());
    window.addEventListener(SYNC_EVENT, sync);
    return () => window.removeEventListener(SYNC_EVENT, sync);
  }, []);

  const isFavorite = useCallback(
    (id: number) => favorites.some((f) => f.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback((part: FavoritePart) => {
    const prev = readStorage();
    const exists = prev.some((f) => f.id === part.id);
    const next = exists ? prev.filter((f) => f.id !== part.id) : [...prev, part];
    writeStorage(next);
  }, []);

  const removeFavorite = useCallback((id: number) => {
    const next = readStorage().filter((f) => f.id !== id);
    writeStorage(next);
  }, []);

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}
