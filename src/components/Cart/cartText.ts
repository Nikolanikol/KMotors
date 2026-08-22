import type { CartItem } from "@/hooks/useCartCount";
import { formatUsd, krwToDisplayUsd } from "@/lib/pricing";

/**
 * Тексты и расчёты корзины — ОДИН источник на страницу `/[lang]/cart` и на
 * выдвижную панель в шапке.
 *
 * Почему свой словарь, а не i18next: панель живёт в глобальной шапке, то есть на
 * ЛЮБОЙ странице сайта, а раздел `parts` из `common` подключается только на своих
 * маршрутах (ROUTE_SECTIONS). Ключи `parts.*` в шапке отдали бы сырой текст на
 * главной, в блоге и в каталоге авто.
 */
export const CART_TEXT: Record<string, Record<string, string>> = {
  ru: { remove: "Убрать из корзины", title: "Корзина", empty: "Корзина пуста", emptyDesc: "Добавьте запчасти из каталога", toCatalog: "В каталог запчастей", back: "Назад в каталог", total: "Итого", subtotal: "Товары", checkout: "Оформить через менеджера", checkoutShort: "Оформить заказ", continueShopping: "Продолжить покупки", close: "Закрыть", clear: "Очистить", note: "Оплата на сайте не требуется. Менеджер свяжется с вами, подтвердит наличие и рассчитает доставку.", items: "поз.", pcs: "шт.", cartOf: "Корзина", managerTitle: "Оформить заказ", managerSub: "Отправьте состав корзины — менеджер подтвердит наличие и рассчитает доставку." },
  en: { remove: "Remove from cart", title: "Cart", empty: "Cart is empty", emptyDesc: "Add parts from the catalog", toCatalog: "Go to catalog", back: "Back to catalog", total: "Total", subtotal: "Items", checkout: "Order via manager", checkoutShort: "Checkout", continueShopping: "Continue shopping", close: "Close", clear: "Clear", note: "No online payment. A manager will contact you, confirm availability and calculate shipping.", items: "items", pcs: "pcs", cartOf: "Cart", managerTitle: "Place order", managerSub: "Send your cart — a manager will confirm availability and calculate shipping." },
  ko: { remove: "장바구니에서 삭제", title: "장바구니", empty: "장바구니가 비어있습니다", emptyDesc: "카탈로그에서 부품을 추가하세요", toCatalog: "카탈로그로 이동", back: "카탈로그로", total: "합계", subtotal: "상품", checkout: "담당자를 통해 주문", checkoutShort: "주문하기", continueShopping: "쇼핑 계속하기", close: "닫기", clear: "비우기", note: "온라인 결제 없음. 담당자가 연락하여 재고 확인 및 배송비를 계산합니다.", items: "품목", pcs: "개", cartOf: "장바구니", managerTitle: "주문하기", managerSub: "장바구니를 보내주시면 담당자가 재고와 배송비를 확인합니다." },
  ka: { remove: "კალათიდან ამოღება", title: "კალათა", empty: "კალათა ცარიელია", emptyDesc: "დაამატეთ ნაწილები კატალოგიდან", toCatalog: "კატალოგში", back: "კატალოგში", total: "სულ", subtotal: "საქონელი", checkout: "მენეჯერით გაფორმება", checkoutShort: "შეკვეთის გაფორმება", continueShopping: "შოპინგის გაგრძელება", close: "დახურვა", clear: "გასუფთავება", note: "ონლაინ გადახდა არ არის. მენეჯერი დაგიკავშირდებათ და გამოთვლის მიტანას.", items: "პოზ.", pcs: "ცალი", cartOf: "კალათა", managerTitle: "შეკვეთა", managerSub: "გამოგზავნეთ კალათა — მენეჯერი დაადასტურებს და გამოთვლის მიტანას." },
  ar: { remove: "إزالة من السلة", title: "السلة", empty: "السلة فارغة", emptyDesc: "أضف قطعًا من الكتالوج", toCatalog: "إلى الكتالوج", back: "إلى الكتالوج", total: "الإجمالي", subtotal: "المنتجات", checkout: "الطلب عبر المدير", checkoutShort: "إتمام الطلب", continueShopping: "متابعة التسوق", close: "إغلاق", clear: "تفريغ", note: "لا دفع عبر الإنترنت. سيتواصل المدير معك ويؤكد التوفر ويحسب الشحن.", items: "عناصر", pcs: "قطعة", cartOf: "السلة", managerTitle: "إتمام الطلب", managerSub: "أرسل سلتك — سيؤكد المدير التوفر ويحسب الشحن." },
};

export function cartText(lang: string): Record<string, string> {
  return CART_TEXT[lang] ?? CART_TEXT.ru;
}

export const usdFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function cartItemName(i: CartItem, lang: string): string {
  if (lang === "ko") return i.name_ko || i.name_en || i.name_ru || i.part_number;
  if (lang === "en") return i.name_en || i.name_ru || i.part_number;
  return i.name_ru || i.name_en || i.part_number;
}

/** Сумма к показу в долларах. Цены в базе в вонах — конвертация только через pricing.ts. */
export function cartSubtotal(items: CartItem[], krwToUsd: number): number {
  return items.reduce((s, i) => s + krwToDisplayUsd(i.price_krw, krwToUsd) * i.quantity, 0);
}

/** Состав корзины для заявки в Telegram. Один формат у страницы и у панели. */
export function cartMessageLines(items: CartItem[], lang: string, krwToUsd: number): string[] {
  const l = cartText(lang);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  return [
    `🛒 ${l.cartOf}: ${items.length} ${l.items}, ${count} ${l.pcs}`,
    "",
    ...items.map((i) => `• ${cartItemName(i, lang)} (${i.part_number}) ×${i.quantity} — ${formatUsd(i.price_krw, krwToUsd)}`),
    "",
    `💵 ${l.subtotal}: $${usdFmt.format(cartSubtotal(items, krwToUsd))}`,
  ];
}
