"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { notifyCartUpdate, useCartProductIds } from "@/hooks/useCartCount";
import { generatePartSlug } from "@/utils/partSlug";
import { ProductCard } from "./ProductCard";
import type { Product } from "./PartsCatalogClient";

function getProductName(p: Product, language: string): string {
  if (language === "ru") return p.name_ru || p.name_en || p.part_number;
  if (language === "ko") return p.name_ko || p.name_en || p.name_ru || p.part_number;
  return p.name_en || p.name_ru || p.part_number;
}

/**
 * Reusable product grid with kmotors cart wiring.
 * Used on fitment (generation) pages and the "similar parts" block.
 * Self-contained: replicates the catalog's Supabase-backed cart flow so it
 * can live on server-rendered pages without touching PartsCatalogClient.
 */
export function FitmentProductsGrid({
  products,
  lang,
  krwToUsd,
}: {
  products: Product[];
  lang: string;
  krwToUsd: number;
}) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const { cartProductIds, addOptimistic } = useCartProductIds();
  const language = i18n.language || lang;

  const handleAddToCart = useCallback(
    async (product: Product): Promise<boolean> => {
      if (!user) {
        const returnUrl = `/${lang}${window.location.pathname.replace(/^\/[a-z]{2}/, "")}`;
        sessionStorage.setItem("parts:pendingCartProduct", String(product.id));
        router.push(`/${lang}/auth?mode=login&from=${encodeURIComponent(returnUrl)}`);
        return false;
      }
      try {
        let { data: cart, error: cartErr } = await supabase
          .from("carts").select("id").eq("user_id", user.id).single();
        if (!cart && cartErr?.code === "PGRST116") {
          const { data: newCart, error: insertErr } = await supabase
            .from("carts").insert({ user_id: user.id }).select("id").single();
          if (insertErr) throw insertErr;
          cart = newCart;
        } else if (cartErr && cartErr.code !== "PGRST116") {
          throw cartErr;
        }
        if (!cart) throw new Error("Cart not found");
        const { error: upsertErr } = await supabase.from("cart_items").upsert(
          { cart_id: cart.id, product_id: product.id, quantity: 1 },
          { onConflict: "cart_id,product_id" }
        );
        if (upsertErr) throw upsertErr;
        addOptimistic(product.id);
        notifyCartUpdate(1);
        return true;
      } catch (err) {
        console.error("Add to cart failed:", err);
        return false;
      }
    },
    [user, supabase, router, lang, addOptimistic]
  );

  if (!products.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product, index) => {
        const productName = getProductName(product, language);
        const href = `/${lang}/parts/${generatePartSlug(product.part_number, productName, lang as "ru" | "en" | "ko", product.id)}`;
        return (
          <ProductCard
            key={product.id}
            product={product}
            productName={productName}
            isVisible
            index={index}
            href={href}
            onAddToCart={() => handleAddToCart(product)}
            onQuickView={() => {}}
            onNavigate={() => {}}
            lang={lang}
            t={t}
            krwToUsd={krwToUsd}
            inCart={cartProductIds.has(product.id)}
          />
        );
      })}
    </div>
  );
}
