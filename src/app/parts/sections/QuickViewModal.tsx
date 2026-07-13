"use client";
import { useEffect, useState } from "react";
import { X, Wrench, ShoppingCart, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Product } from "./PartsCatalogClient";
import { formatUsd } from "@/lib/pricing";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { notifyCartUpdate } from "@/hooks/useCartCount";

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  krwToUsd: number;
  lang: string;
  inCart?: boolean;
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
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [qty, setQty] = useState(1);
  const [cartAdded, setCartAdded] = useState(false);
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setQty(1);
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

  const name =
    lang === "ko" && product.name_ko
      ? product.name_ko
      : lang === "en"
        ? product.name_en
        : product.name_ru;

  const price = formatUsd(product.price_krw, krwToUsd);

  const handleAddToCart = async () => {
    if (!user) {
      const returnUrl = `/${lang}/parts${window.location.search}`;
      sessionStorage.setItem("parts:pendingCartProduct", String(product.id));
      router.push(`/${lang}/auth?mode=login&from=${encodeURIComponent(returnUrl)}`);
      return;
    }
    setCartError("");
    try {
      let { data: cart, error: cartErr } = await supabase.from("carts").select("id").eq("user_id", user.id).single();
      if (!cart && cartErr?.code === "PGRST116") {
        const { data: newCart, error: insertErr } = await supabase.from("carts").insert({ user_id: user.id }).select("id").single();
        if (insertErr) throw insertErr;
        cart = newCart;
      } else if (cartErr && cartErr.code !== "PGRST116") {
        throw cartErr;
      }
      if (!cart) throw new Error("Cart not found");
      const { error: upsertErr } = await supabase.from("cart_items").upsert(
        { cart_id: cart.id, product_id: product.id, quantity: qty },
        { onConflict: "cart_id,product_id" }
      );
      if (upsertErr) throw upsertErr;
      notifyCartUpdate(qty);
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 2500);
    } catch (err: unknown) {
      console.error("Add to cart failed:", err);
      setCartError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div
        className={`relative bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl shadow-2xl max-w-[700px] w-full max-h-[90vh] overflow-y-auto transition-transform duration-300 ${
          isOpen ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--pn-surface-3)] flex items-center justify-center hover:bg-[var(--pn-border)] transition-colors z-10"
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
            <h3 className="text-lg font-bold text-[var(--pn-deep-navy)] mb-4 leading-tight">
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
                {t("parts.detail.priceLabel")}:
              </span>
              <div className="flex items-center border border-[var(--pn-medium-gray)] rounded-md">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-8 h-8 flex items-center justify-center text-[var(--pn-dark-gray)] hover:bg-[var(--pn-light-gray)] rounded-l-md transition-colors"
                >
                  —
                </button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-8 h-8 flex items-center justify-center text-[var(--pn-dark-gray)] hover:bg-[var(--pn-light-gray)] rounded-r-md transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {inCart || cartAdded ? (
              <div className="w-full text-center text-sm mb-3 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold bg-green-500 text-white">
                <Check className="w-4 h-4" />
                {cartAdded ? "✓ Добавлено" : t("parts.products.inCart")}
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="w-full text-center text-sm mb-3 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold pn-btn-primary transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                {t("parts.detail.addToCart")}
              </button>
            )}
            {cartError && (
              <p className="text-sm text-red-500 -mt-1 mb-2">{cartError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
