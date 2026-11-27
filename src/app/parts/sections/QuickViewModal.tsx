"use client";
import { useEffect, useRef, useState } from "react";
import { X, Wrench, ShoppingCart, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import type { Product } from "./PartsCatalogClient";
import { formatUsd } from "@/lib/pricing";
import { addToPartsCart, removeFromPartsCart } from "@/hooks/useCartCount";

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  krwToUsd: number;
  lang: string;
  inCart: boolean;
}

export function QuickViewModal({
  product,
  isOpen,
  onClose,
  krwToUsd,
  lang,
  inCart,
}: QuickViewModalProps) {
  const { t } = useTranslation();
  const [qty, setQty] = useState(1);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQty(1);
      // Фокус в диалог: иначе клавиатурный пользователь остаётся «под» затемнением.
      closeRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!product) return null;

  // Имя — по тем же правилам, что в сетке (FitmentProductsGrid / каталог): для ka/ar
  // это английское название, а не русское.
  const name =
    lang === "ru"
      ? product.name_ru || product.name_en || product.part_number
      : lang === "ko"
        ? product.name_ko || product.name_en || product.name_ru || product.part_number
        : product.name_en || product.name_ru || product.part_number;

  const price = formatUsd(product.price_krw, krwToUsd);

  // Как и на карточке товара в сетке, кнопка — переключатель: `inCart` приходит
  // из стора корзины и обновляется сразу после записи, поэтому своего состояния
  // «добавлено» тут нет.
  const handleCart = () => {
    if (inCart) {
      removeFromPartsCart(product.id);
      return;
    }
    addToPartsCart({
      id: product.id,
      name_ru: product.name_ru,
      name_en: product.name_en,
      name_ko: product.name_ko,
      part_number: product.part_number,
      price_krw: product.price_krw,
      image_url: product.image_url,
      is_new: product.is_new,
    }, qty);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-[opacity,visibility] duration-300 ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      }`}
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        className={`relative bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl shadow-2xl max-w-[700px] w-full max-h-[90vh] overflow-y-auto transition-transform duration-300 ${
          isOpen ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t("parts.detail.close")}
          title={t("parts.detail.close")}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--pn-surface-3)] flex items-center justify-center cursor-pointer hover:bg-[var(--pn-border)] transition-colors z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pn-orange)]"
        >
          <X className="w-4 h-4 text-[var(--pn-text-muted)]" />
        </button>

        <div className="flex flex-col sm:flex-row gap-6 p-6">
          {/* Image */}
          <div className="sm:w-[280px] flex-shrink-0 bg-white rounded-lg flex items-center justify-center aspect-square overflow-hidden">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={name || "Product"}
                width={280}
                height={280}
                className="object-contain w-full h-full"
                unoptimized
              />
            ) : (
              <Wrench className="w-16 h-16 text-[var(--pn-medium-gray)]" />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[var(--pn-orange-soft)] font-mono uppercase tracking-wider mb-1">
              {product.part_number}
            </div>
            <h3 id="quick-view-title" className="text-lg font-bold text-[var(--pn-deep-navy)] mb-4 leading-tight">
              {name}
            </h3>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl font-bold text-[var(--pn-orange)]">
                {price}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[var(--pn-success)]">
                <span className="w-1.5 h-1.5 bg-[var(--pn-success)] rounded-full" />
                {t("parts.products.inStock")}
              </span>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm text-[var(--pn-dark-gray)]">
                {t("parts.detail.quantity")}:
              </span>
              <div className="flex items-center border border-[var(--pn-medium-gray)] rounded-md">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  aria-label={t("parts.detail.decreaseQty")}
                  className="w-8 h-8 flex items-center justify-center cursor-pointer text-[var(--pn-dark-gray)] hover:bg-[var(--pn-light-gray)] rounded-l-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pn-orange)]"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(qty + 1)}
                  aria-label={t("parts.detail.increaseQty")}
                  className="w-8 h-8 flex items-center justify-center cursor-pointer text-[var(--pn-dark-gray)] hover:bg-[var(--pn-light-gray)] rounded-r-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pn-orange)]"
                >
                  +
                </button>
              </div>
            </div>

            {inCart ? (
              <button
                type="button"
                onClick={handleCart}
                title={t("parts.detail.removeFromCart")}
                className="group/cart w-full text-center text-sm mb-3 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold cursor-pointer bg-[var(--pn-success)] hover:bg-[var(--pn-error)] text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pn-orange)]"
              >
                <Check className="w-4 h-4 group-hover/cart:hidden" />
                <X className="w-4 h-4 hidden group-hover/cart:block" />
                <span className="group-hover/cart:hidden">{t("parts.products.inCart")}</span>
                <span className="hidden group-hover/cart:block">{t("parts.detail.removeFromCart")}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCart}
                className="w-full text-center text-sm mb-3 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold cursor-pointer pn-btn-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pn-orange)]"
              >
                <ShoppingCart className="w-4 h-4" />
                {t("parts.detail.addToCart")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
