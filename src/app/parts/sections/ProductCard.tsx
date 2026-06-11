"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Wrench, ShoppingCart, Check, Eye } from "lucide-react";
import { formatUsd } from "@/lib/pricing";
import type { Product } from "./PartsCatalogClient";

const CART_LABELS: Record<string, string> = {
  ru: "В корзину", en: "Add to cart", ko: "장바구니", ka: "კალათაში", ar: "للسلة",
};

interface ProductCardProps {
  product: Product;
  productName: string;
  view: "grid" | "list";
  isVisible: boolean;
  index: number;
  href: string;
  onAddToCart: () => Promise<boolean>;
  onQuickView: () => void;
  onNavigate: () => void;
  lang: string;
  t: (key: string) => string;
  krwToUsd: number;
}

export function ProductCard({ product, productName, view, isVisible, index, href, onAddToCart, onQuickView, onNavigate, lang, t, krwToUsd }: ProductCardProps) {
  const delay = `${Math.min(index * 20, 400)}ms`;
  const [cartAdded, setCartAdded] = useState(false);

  const handleCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = await onAddToCart();
    if (added) {
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 2000);
    }
  };

  const cartLabel = CART_LABELS[lang] ?? CART_LABELS.ru;

  if (view === "list") {
    return (
      <div
        className={cn("bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 p-4", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}
        style={{ transitionDelay: delay }}
      >
        <Link href={href} onClick={onNavigate} className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden relative">
          {product.image_url
            ? <Image src={product.image_url} alt={productName} width={80} height={80} unoptimized className="object-contain p-2" />
            : <Wrench className="w-7 h-7 text-gray-300" />}
        </Link>
        <Link href={href} onClick={onNavigate} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
          <div className="text-xs text-gray-400 font-mono mb-0.5">{product.part_number}</div>
          <h3 className="text-sm font-semibold text-[var(--pn-deep-navy)] truncate">{productName}</h3>
        </Link>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-lg font-bold text-[var(--pn-orange)]">{formatUsd(product.price_krw, krwToUsd)}</span>
          <Button
            size="sm"
            onClick={handleCart}
            className={`text-white text-xs h-8 flex items-center gap-1.5 transition-all ${cartAdded ? "bg-green-500 hover:bg-green-500" : "bg-[var(--pn-orange)] hover:brightness-110"}`}
          >
            {cartAdded ? <Check className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
            {cartAdded ? "✓" : cartLabel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}
      style={{ transitionDelay: delay }}
    >
      <Link href={href} onClick={onNavigate} className="block relative bg-gray-50 overflow-hidden aspect-square">
        <div className="absolute inset-0 flex items-center justify-center">
          {product.image_url
            ? <Image src={product.image_url} alt={productName} fill unoptimized className="object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
            : <div className="flex flex-col items-center gap-1.5 text-gray-300"><Wrench className="w-8 h-8" /><span className="text-xs">{t("parts.catalog.noPhoto")}</span></div>}
        </div>
        {product.is_new && (
          <div className="absolute top-2 left-2 bg-[var(--pn-orange)] text-white text-xs px-2 py-0.5 rounded-full font-medium">
            {t("parts.catalog.newBadge")}
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(); }}
            className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--pn-orange)] hover:text-white"
            title="Quick view"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </Link>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <Link href={href} onClick={onNavigate} className="block">
          <div className="text-[11px] text-gray-400 font-mono leading-none mb-1">{product.part_number}</div>
          <h3 className="text-sm font-semibold text-[var(--pn-deep-navy)] line-clamp-2 leading-snug min-h-[2.625rem] hover:text-[var(--pn-deep-navy)]/80 transition-colors">
            {productName}
          </h3>
        </Link>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
          <span className="text-base font-bold text-[var(--pn-orange)]">{formatUsd(product.price_krw, krwToUsd)}</span>
          <Button
            size="sm"
            onClick={handleCart}
            className={`h-8 w-8 p-0 rounded-full text-white transition-all ${cartAdded ? "bg-green-500 hover:bg-green-500" : "bg-[var(--pn-orange)] hover:brightness-110"}`}
          >
            {cartAdded ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
