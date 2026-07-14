"use client";

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { addToPartsCart, useCartProductIds } from "@/hooks/useCartCount";
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
  const { cartProductIds } = useCartProductIds();
  const language = i18n.language || lang;

  const handleAddToCart = useCallback(
    async (product: Product): Promise<boolean> => {
      return addToPartsCart({
        id: product.id,
        name_ru: product.name_ru,
        name_en: product.name_en,
        name_ko: product.name_ko,
        part_number: product.part_number,
        price_krw: product.price_krw,
        image_url: product.image_url,
        is_new: product.is_new,
      });
    },
    []
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
