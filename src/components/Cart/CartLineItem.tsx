"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Wrench } from "lucide-react";
import { setPartsCartQty, removeFromPartsCart, type CartItem } from "@/hooks/useCartCount";
import { formatUsd } from "@/lib/pricing";
import { generatePartSlug } from "@/utils/partSlug";
import { cartItemName, cartText } from "./cartText";

/** Строка корзины — общая для страницы `/[lang]/cart` и выдвижной панели. */
export function CartLineItem({
  item,
  lang,
  krwToUsd,
  dense = false,
  onNavigate,
}: {
  item: CartItem;
  lang: string;
  krwToUsd: number;
  /** Узкий вариант для панели: картинка меньше. */
  dense?: boolean;
  onNavigate?: () => void;
}) {
  // Мутаторы берутся импортом, а не через usePartsCart(): хук подписывает
  // компонент на весь стор, и каждая строка перерисовывалась бы на любое
  // изменение соседней.
  const name = cartItemName(item, lang);
  const href = `/${lang}/parts/${generatePartSlug(item.part_number, name, lang as "ru" | "en" | "ko", item.id)}`;
  const imgBox = dense ? "w-16 h-16" : "w-20 h-20";

  return (
    <div className="flex gap-3 sm:gap-4 bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl p-3">
      <Link href={href} onClick={onNavigate} className={`${imgBox} shrink-0 rounded-lg overflow-hidden bg-white flex items-center justify-center`}>
        {item.image_url ? (
          <Image src={item.image_url} alt={name} width={80} height={80} unoptimized className="object-contain w-full h-full p-1.5" />
        ) : (
          <Wrench className="w-7 h-7 text-gray-300" />
        )}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col">
        <Link href={href} onClick={onNavigate} className="text-sm font-semibold text-[var(--pn-text)] line-clamp-2 hover:text-[var(--pn-orange)] transition-colors">
          {name}
        </Link>
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--pn-orange-soft)] mt-0.5">{item.part_number}</span>

        <div className="flex items-center justify-between gap-2 mt-auto pt-2">
          <div className="flex items-center border border-[var(--pn-border)] bg-[var(--pn-surface-2)] rounded-lg">
            <button onClick={() => setPartsCartQty(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-[var(--pn-text-muted)] hover:text-[var(--pn-orange)] transition text-lg leading-none">−</button>
            <span className="w-8 text-center text-sm font-semibold text-[var(--pn-text)]">{item.quantity}</span>
            <button onClick={() => setPartsCartQty(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-[var(--pn-text-muted)] hover:text-[var(--pn-orange)] transition text-lg leading-none">+</button>
          </div>
          <span className="text-base font-bold text-[var(--pn-orange)]">{formatUsd(item.price_krw, krwToUsd)}</span>
        </div>
      </div>

      <button
        onClick={() => removeFromPartsCart(item.id)}
        className="self-start text-[var(--pn-text-dim)] hover:text-[var(--pn-error)] transition-colors cursor-pointer shrink-0"
        aria-label={`${cartText(lang).remove}: ${name}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
