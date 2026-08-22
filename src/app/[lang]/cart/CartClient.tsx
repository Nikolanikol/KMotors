"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, ArrowRight, ArrowLeft } from "lucide-react";
import { usePartsCart } from "@/hooks/useCartCount";
import { OrderModal } from "@/app/parts/sections/OrderModal";
import { CartLineItem } from "@/components/Cart/CartLineItem";
import { cartText, cartSubtotal, cartMessageLines, usdFmt } from "@/components/Cart/cartText";

/**
 * Страница корзины. Просмотр и правка состава живут ещё и в выдвижной панели
 * шапки (`CartDrawer`) — тексты, расчёт суммы и формат заявки общие, в
 * `@/components/Cart/cartText`. Страница остаётся местом ОФОРМЛЕНИЯ: форма
 * заявки переведена ключами `parts.order.*`, а этот раздел словаря подключён
 * только здесь и на маршрутах запчастей.
 */
export function CartClient({ lang, krwToUsd }: { lang: string; krwToUsd: number }) {
  const l = cartText(lang);
  const { items, count, clear } = usePartsCart();
  const [orderOpen, setOrderOpen] = useState(false);

  // Возврат ровно туда, откуда ушли: фильтры каталога складывает карточка товара
  // и сетка (`parts:filters`). Без этого «назад» высаживало на первую страницу
  // каталога без фильтров и без позиции скролла.
  const [backSearch, setBackSearch] = useState("");
  useEffect(() => {
    setBackSearch(sessionStorage.getItem("parts:filters") ?? "");
  }, []);

  const subtotal = cartSubtotal(items, krwToUsd);
  const messageLines = cartMessageLines(items, lang, krwToUsd);

  return (
    <div className="parts-page min-h-screen bg-[var(--pn-bg)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <Link
          href={`/${lang}/parts${backSearch}`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--pn-text-muted)] hover:text-[var(--pn-orange)] transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {l.back}
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--pn-text)] flex items-center gap-3">
            <ShoppingCart className="w-7 h-7 text-[var(--pn-orange)]" />
            {l.title}
            {items.length > 0 && <span className="text-[var(--pn-text-dim)] text-lg font-semibold">({count})</span>}
          </h1>
          {items.length > 0 && (
            <button onClick={clear} className="text-sm text-[var(--pn-text-dim)] hover:text-[var(--pn-error)] transition-colors cursor-pointer">
              {l.clear}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--pn-surface-2)] border border-[var(--pn-border)] flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-[var(--pn-text-dim)]" />
            </div>
            <p className="font-semibold text-[var(--pn-text)]">{l.empty}</p>
            <p className="text-sm text-[var(--pn-text-muted)]">{l.emptyDesc}</p>
            <Link
              href={`/${lang}/parts`}
              className="inline-flex items-center gap-2 mt-2 px-6 py-2.5 rounded-full bg-[var(--pn-orange-deep)] bg-[image:var(--pn-fill)] text-white font-semibold text-sm hover:brightness-110 transition-all"
            >
              {l.toCatalog}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="space-y-3">
              {items.map((i) => (
                <CartLineItem key={i.id} item={i} lang={lang} krwToUsd={krwToUsd} />
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[var(--pn-text-muted)]">{l.subtotal}</span>
                <span className="text-[var(--pn-text)] font-semibold">${usdFmt.format(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--pn-border)]">
                <span className="text-[var(--pn-text)] font-bold">{l.total}</span>
                <span className="text-2xl font-bold text-[var(--pn-orange)]">${usdFmt.format(subtotal)}</span>
              </div>

              <button
                onClick={() => setOrderOpen(true)}
                className="w-full mt-5 h-12 rounded-xl bg-[var(--pn-orange-deep)] bg-[image:var(--pn-fill)] text-white font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
              >
                {l.checkout}
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-xs text-[var(--pn-text-dim)] leading-relaxed mt-3 text-center">{l.note}</p>
            </div>
          </>
        )}
      </div>

      <OrderModal
        isOpen={orderOpen}
        onClose={() => setOrderOpen(false)}
        productName={`${l.cartOf} · ${items.length} ${l.items}`}
        partNumber={`${count} ${l.pcs}`}
        productUrl={`https://www.kmotors.shop/${lang}/cart`}
        priceText={`$${usdFmt.format(subtotal)}`}
        source="parts_cart"
        title={l.managerTitle}
        subtitle={l.managerSub}
        messageLines={messageLines}
        requireCountry
      />
    </div>
  );
}
