"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingCart, X, ArrowRight } from "lucide-react";
import { usePartsCart } from "@/hooks/useCartCount";
import { CartLineItem } from "./CartLineItem";
import { cartText, cartSubtotal, usdFmt } from "./cartText";

/**
 * Выдвижная корзина в шапке.
 *
 * Смысл — не уводить человека со страницы: он смотрит и правит состав корзины
 * там, где стоит, и не теряет позицию в каталоге, фильтры и скролл. Уходит он
 * на `/[lang]/cart` только за оформлением заявки.
 *
 * ⚠️ Форма заявки (`OrderModal`) сюда НЕ переносится. Она переведена ключами
 * `parts.order.*`, а раздел `parts` подключается только на своих маршрутах
 * (ROUTE_SECTIONS) — в глобальной шапке эти ключи ушли бы клиенту сырыми на
 * главной, в блоге и в каталоге авто. Поэтому оформление живёт на странице
 * корзины, где словарь раздела есть.
 */

/** Событие «открыть корзину» — чтобы кнопки на страницах не тянули состояние шапки. */
export const CART_OPEN_EVENT = "kmotors_cart_open";

export function openCartDrawer() {
  window.dispatchEvent(new Event(CART_OPEN_EVENT));
}

export function CartDrawer({
  open,
  onClose,
  lang,
  krwToUsd,
}: {
  open: boolean;
  onClose: () => void;
  lang: string;
  krwToUsd: number;
}) {
  const l = cartText(lang);
  const { items, count, clear } = usePartsCart();
  const panelRef = useRef<HTMLDivElement>(null);

  // Панель висит в шапке, то есть на каждой странице сайта. До первого открытия
  // разметки нет вовсе — товары, картинки и обработчики не платятся зря.
  const [mounted, setMounted] = useState(false);
  // Отдельный флаг для анимации: в первый раз панель появляется в DOM уже
  // открытой, и без задержки на кадр браузеру нечего анимировать — она бы
  // возникала рывком, а не выезжала.
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    setMounted(true);
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open || !mounted) return;
    panelRef.current?.focus();
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [open, mounted, onClose]);

  if (!mounted) return null;

  const subtotal = cartSubtotal(items, krwToUsd);

  return (
    <div className={`fixed inset-0 z-[70] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={l.title}
        tabIndex={-1}
        id="cart-drawer"
        className={`parts-page absolute inset-y-0 right-0 w-full max-w-[420px] bg-[var(--pn-bg)] border-l border-[var(--pn-border)] shadow-2xl flex flex-col transition-transform duration-300 outline-none ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-[var(--pn-border)]">
          <h2 className="text-lg font-bold text-[var(--pn-text)] flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[var(--pn-orange)]" />
            {l.title}
            {count > 0 && <span className="text-[var(--pn-text-dim)] text-base font-semibold">({count})</span>}
          </h2>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button onClick={clear} className="text-sm text-[var(--pn-text-dim)] hover:text-[var(--pn-error)] transition-colors cursor-pointer">
                {l.clear}
              </button>
            )}
            <button
              onClick={onClose}
              aria-label={l.close}
              className="w-8 h-8 rounded-full bg-[var(--pn-surface-2)] border border-[var(--pn-border)] flex items-center justify-center text-[var(--pn-text-muted)] hover:text-[var(--pn-orange)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--pn-surface-2)] border border-[var(--pn-border)] flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-[var(--pn-text-dim)]" />
            </div>
            <p className="font-semibold text-[var(--pn-text)]">{l.empty}</p>
            <p className="text-sm text-[var(--pn-text-muted)]">{l.emptyDesc}</p>
            <Link
              href={`/${lang}/parts`}
              onClick={onClose}
              className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-full bg-[var(--pn-orange-deep)] bg-[image:var(--pn-fill)] text-white font-semibold text-sm hover:brightness-110 transition-all"
            >
              {l.toCatalog}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {items.map((i) => (
                <CartLineItem key={i.id} item={i} lang={lang} krwToUsd={krwToUsd} dense onNavigate={onClose} />
              ))}
            </div>

            <div className="border-t border-[var(--pn-border)] px-4 py-4 bg-[var(--pn-surface)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[var(--pn-text)] font-bold">{l.total}</span>
                <span className="text-2xl font-bold text-[var(--pn-orange)]">${usdFmt.format(subtotal)}</span>
              </div>
              <Link
                href={`/${lang}/cart`}
                onClick={onClose}
                className="w-full h-12 rounded-xl bg-[var(--pn-orange-deep)] bg-[image:var(--pn-fill)] text-white font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all"
              >
                {l.checkoutShort}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={onClose}
                className="w-full mt-2 h-11 rounded-xl text-[var(--pn-text-muted)] font-medium hover:text-[var(--pn-orange)] transition-colors cursor-pointer"
              >
                {l.continueShopping}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
