"use client";

// ♥ для лота аукциона / машины HeyDealer: плитка каталога, похожие, страница
// машины. Плитки серверные, поэтому клиентская здесь только кнопка — снимок
// лота (FavoriteLot) собирает сервер и отдаёт пропом.

import HeartButton from "@/components/Favorites/HeartButton";
import { favText } from "@/components/Favorites/favText";
import { useAuctionFavorites, type FavoriteLot } from "@/hooks/useAuctionFavorites";

export default function AuctionHeart({
  lot,
  lang,
  size = "sm",
  className,
}: {
  lot: Omit<FavoriteLot, "savedAt">;
  lang: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const { isFavorite, toggleFavorite } = useAuctionFavorites();
  const on = isFavorite(lot.key);
  return (
    <HeartButton
      active={on}
      onToggle={() => toggleFavorite(lot)}
      label={favText(lang)[on ? "remove" : "add"]}
      size={size}
      className={className}
    />
  );
}
