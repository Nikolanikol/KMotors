"use client";

// ♥ на странице машины Encar (сама страница серверная). Запись — та же, что
// у сердечка на карточке каталога (useFavorites), чтобы машина, сохранённая
// в одном месте, была отмечена и в другом.

import { useFavorites, type FavoriteCar } from "@/hooks/useFavorites";

import HeartButton from "./HeartButton";
import { favText } from "./favText";

export default function EncarHeart({ car, lang }: { car: FavoriteCar; lang: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const on = isFavorite(car.id);
  return (
    <HeartButton
      size="sm"
      active={on}
      onToggle={() => toggleFavorite(car)}
      label={favText(lang)[on ? "remove" : "add"]}
    />
  );
}
