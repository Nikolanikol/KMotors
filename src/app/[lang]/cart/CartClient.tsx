"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Trash2, ArrowRight, ArrowLeft, Wrench } from "lucide-react";
import { usePartsCart, type CartItem } from "@/hooks/useCartCount";
import { formatUsd, krwToDisplayUsd } from "@/lib/pricing";
import { generatePartSlug } from "@/utils/partSlug";
import { OrderModal } from "@/app/parts/sections/OrderModal";

const usdFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const L: Record<string, Record<string, string>> = {
  ru: { title: "Корзина", empty: "Корзина пуста", emptyDesc: "Добавьте запчасти из каталога", toCatalog: "В каталог запчастей", back: "Назад в каталог", total: "Итого", subtotal: "Товары", checkout: "Оформить через менеджера", clear: "Очистить", note: "Оплата на сайте не требуется. Менеджер свяжется с вами, подтвердит наличие и рассчитает доставку.", items: "поз.", pcs: "шт.", cartOf: "Корзина", managerTitle: "Оформить заказ", managerSub: "Отправьте состав корзины — менеджер подтвердит наличие и рассчитает доставку." },
  en: { title: "Cart", empty: "Cart is empty", emptyDesc: "Add parts from the catalog", toCatalog: "Go to catalog", back: "Back to catalog", total: "Total", subtotal: "Items", checkout: "Order via manager", clear: "Clear", note: "No online payment. A manager will contact you, confirm availability and calculate shipping.", items: "items", pcs: "pcs", cartOf: "Cart", managerTitle: "Place order", managerSub: "Send your cart — a manager will confirm availability and calculate shipping." },
  ko: { title: "장바구니", empty: "장바구니가 비어있습니다", emptyDesc: "카탈로그에서 부품을 추가하세요", toCatalog: "카탈로그로 이동", back: "카탈로그로", total: "합계", subtotal: "상품", checkout: "담당자를 통해 주문", clear: "비우기", note: "온라인 결제 없음. 담당자가 연락하여 재고 확인 및 배송비를 계산합니다.", items: "품목", pcs: "개", cartOf: "장바구니", managerTitle: "주문하기", managerSub: "장바구니를 보내주시면 담당자가 재고와 배송비를 확인합니다." },
  ka: { title: "კალათა", empty: "კალათა ცარიელია", emptyDesc: "დაამატეთ ნაწილები კატალოგიდან", toCatalog: "კატალოგში", back: "კატალოგში", total: "სულ", subtotal: "საქონელი", checkout: "მენეჯერით გაფორმება", clear: "გასუფთავება", note: "ონლაინ გადახდა არ არის. მენეჯერი დაგიკავშირდებათ და გამოთვლის მიტანას.", items: "პოზ.", pcs: "ცალი", cartOf: "კალათა", managerTitle: "შეკვეთა", managerSub: "გამოგზავნეთ კალათა — მენეჯერი დაადასტურებს და გამოთვლის მიტანას." },
  ar: { title: "السلة", empty: "السلة فارغة", emptyDesc: "أضف قطعًا من الكتالوج", toCatalog: "إلى الكتالوج", back: "إلى الكتالوج", total: "الإجمالي", subtotal: "المنتجات", checkout: "الطلب عبر المدير", clear: "تفريغ", note: "لا دفع عبر الإنترنت. سيتواصل المدير معك ويؤكد التوفر ويحسب الشحن.", items: "عناصر", pcs: "قطعة", cartOf: "السلة", managerTitle: "إتمام الطلب", managerSub: "أرسل سلتك — سيؤكد المدير التوفر ويحسب الشحن." },
};

function itemName(i: CartItem, lang: string): string {
  if (lang === "ko") return i.name_ko || i.name_en || i.name_ru || i.part_number;
  if (lang === "en") return i.name_en || i.name_ru || i.part_number;
  return i.name_ru || i.name_en || i.part_number;
}

export function CartClient({ lang, krwToUsd }: { lang: string; krwToUsd: number }) {
  const l = L[lang] ?? L.ru;
  const { items, count, setQty, removeItem, clear } = usePartsCart();
  const [orderOpen, setOrderOpen] = useState(false);

  const subtotal = items.reduce((s, i) => s + krwToDisplayUsd(i.price_krw, krwToUsd) * i.quantity, 0);

  const messageLines = [
    `🛒 ${l.cartOf}: ${items.length} ${l.items}, ${count} ${l.pcs}`,
    "",
    ...items.map((i) => `• ${itemName(i, lang)} (${i.part_number}) ×${i.quantity} — ${formatUsd(i.price_krw, krwToUsd)}`),
    "",
    `💵 ${l.subtotal}: $${usdFmt.format(subtotal)}`,
  ];

  return (
    <div className="parts-page min-h-screen bg-[var(--pn-bg)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <Link
          href={`/${lang}/parts`}
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
              className="inline-flex items-center gap-2 mt-2 px-6 py-2.5 rounded-full bg-[var(--pn-orange)] text-white font-semibold text-sm hover:brightness-110 transition-all"
            >
              {l.toCatalog}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="space-y-3">
              {items.map((i) => {
                const href = `/${lang}/parts/${generatePartSlug(i.part_number, itemName(i, lang), lang as "ru" | "en" | "ko", i.id)}`;
                return (
                  <div key={i.id} className="flex gap-4 bg-[var(--pn-surface)] border border-[var(--pn-border)] rounded-xl p-3">
                    <Link href={href} className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                      {i.image_url ? (
                        <Image src={i.image_url} alt={itemName(i, lang)} width={80} height={80} unoptimized className="object-contain w-full h-full p-1.5" />
                      ) : (
                        <Wrench className="w-7 h-7 text-gray-300" />
                      )}
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <Link href={href} className="text-sm font-semibold text-[var(--pn-text)] line-clamp-2 hover:text-[var(--pn-orange)] transition-colors">
                        {itemName(i, lang)}
                      </Link>
                      <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--pn-orange-soft)] mt-0.5">{i.part_number}</span>

                      <div className="flex items-center justify-between mt-auto pt-2">
                        <div className="flex items-center border border-[var(--pn-border)] bg-[var(--pn-surface-2)] rounded-lg">
                          <button onClick={() => setQty(i.id, i.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-[var(--pn-text-muted)] hover:text-[var(--pn-orange)] transition text-lg leading-none">−</button>
                          <span className="w-8 text-center text-sm font-semibold text-[var(--pn-text)]">{i.quantity}</span>
                          <button onClick={() => setQty(i.id, i.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-[var(--pn-text-muted)] hover:text-[var(--pn-orange)] transition text-lg leading-none">+</button>
                        </div>
                        <span className="text-base font-bold text-[var(--pn-orange)]">{formatUsd(i.price_krw, krwToUsd)}</span>
                      </div>
                    </div>

                    <button onClick={() => removeItem(i.id)} className="self-start text-[var(--pn-text-dim)] hover:text-[var(--pn-error)] transition-colors cursor-pointer shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
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
                className="w-full mt-5 h-12 rounded-xl bg-[var(--pn-orange)] text-white font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
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
      />
    </div>
  );
}
