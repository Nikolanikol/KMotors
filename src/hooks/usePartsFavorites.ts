"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "kmotors_parts_favorites";

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

export function usePartsFavorites() {
  const [favorites, setFavorites] = useState<FavoritePart[]>([]);

  useEffect(() => {
    setFavorites(readStorage());
  }, []);

  const isFavorite = useCallback(
    (id: number) => favorites.some((f) => f.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback((part: FavoritePart) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === part.id);
      const next = exists ? prev.filter((f) => f.id !== part.id) : [...prev, part];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: number) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}
