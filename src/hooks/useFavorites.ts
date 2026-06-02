"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "kmotors_favorites";

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

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteCar[]>([]);

  useEffect(() => {
    setFavorites(readStorage());
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback((car: FavoriteCar) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === car.id);
      const next = exists ? prev.filter((f) => f.id !== car.id) : [...prev, car];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}
