"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * Ссылка пагинации. Обычный <Link> (клиентская навигация, а индикатор перехода
 * NavigationStatus ловит клик сам), плюс прокрутка к началу сетки карточек: сам
 * Link без `scroll={false}` бросил бы страницу к самому верху — на мобиле это выше
 * фильтра, и список пришлось бы искать заново.
 */
export default function PaginationLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      prefetch={false}
      scroll={false}
      onClick={(e) => {
        onClick?.(e);
        // Модификаторы — открытие в новой вкладке, прокручивать нечего.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        document.getElementById("cars-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    />
  );
}
