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
const IN_CART_LABELS: Record<string, string> = {
  ru: "В корзине", en: "In cart", ko: "담김", ka: "კალათაში", ar: "في السلة",
};

interface ProductCardProps {
  product: Product;
  productName: string;
  isVisible: boolean;
  index: number;
  href: string;
  onAddToCart: () => Promise<boolean>;
  onQuickView: () => void;
  onNavigate: () => void;
  lang: string;
  t: (key: string) => string;
  krwToUsd: number;
  inCart?: boolean;
}

export function ProductCard({ product, productName, isVisible, index, href, onAddToCart, onQuickView, onNavigate, lang, t, krwToUsd, inCart }: ProductCardProps) {
  const delay = `${Math.min(index * 20, 400)}ms`;
  const [cartAdded, setCartAdded] = useState(false);

  const handleCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) return;
    const added = await onAddToCart();
    if (added) {
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 2000);
    }
  };

  const isInCart = inCart || cartAdded;
  const cartLabel = isInCart ? (IN_CART_LABELS[lang] ?? IN_CART_LABELS.ru) : (CART_LABELS[lang] ?? CART_LABELS.ru);

  return (
    <div
      id={`product-${product.id}`}
      className={cn(
        "bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl overflow-hidden group flex flex-col transition-all duration-300 hover:border-[var(--pn-orange)] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.45)]",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
      style={{ transitionDelay: delay }}
    >
      <Link href={href} onClick={onNavigate} className="block relative bg-[var(--pn-image-bg,#e8e6e3)] overflow-hidden aspect-square">
        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
          {product.image_url
            ? <Image src={product.image_url} alt={productName} fill unoptimized className="object-contain p-4 sm:p-6 group-hover:scale-105 transition-transform duration-500" />
            : <div className="flex flex-col items-center gap-1.5 text-gray-300"><Wrench className="w-8 h-8" /><span className="text-xs">{t("parts.catalog.noPhoto")}</span></div>}
        </div>
        {product.is_new && (
          <div className="absolute top-3 left-3 bg-[var(--pn-orange)] text-white text-[11px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
            {t("parts.catalog.newBadge")}
          </div>
        )}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(); }}
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--pn-orange)]"
          title="Quick view"
        >
          <Eye className="w-4 h-4" />
        </button>
      </Link>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <Link href={href} onClick={onNavigate} className="block">
          <div className="text-xs font-mono font-semibold tracking-wider uppercase text-[var(--pn-orange-soft)] leading-none mb-1.5">{product.part_number}</div>
          <h3 className="text-sm font-semibold text-[var(--pn-text)] line-clamp-2 leading-snug min-h-[2.5rem]">
            {productName}
          </h3>
        </Link>
        <div className="flex items-center justify-between pt-3 border-t border-[var(--pn-border)] mt-auto">
          <span className="text-lg font-bold text-[var(--pn-orange)]">{formatUsd(product.price_krw, krwToUsd)}</span>
          <Button
            size="sm"
            onClick={handleCart}
            className={cn(
              "h-9 w-9 p-0 rounded-xl text-white transition-all active:scale-95",
              isInCart ? "bg-[var(--pn-success)] hover:bg-[var(--pn-success)] cursor-default" : "bg-[var(--pn-orange)] hover:brightness-110 shadow-lg"
            )}
            title={cartLabel}
          >
            {isInCart ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
