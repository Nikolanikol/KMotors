"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, ShoppingCart, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface CartProduct {
  cart_item_id: string;
  quantity: number;
  product_id: number;
  part_number: string;
  name_ru: string;
  name_en: string;
  price_krw: number;
  image_url: string | null;
}

interface Props {
  lang: string;
  userId: string;
}

const L: Record<string, Record<string, string>> = {
  ru: { title: "Корзина", empty: "Корзина пуста", emptyDesc: "Добавьте запчасти из каталога", toCatalog: "В каталог запчастей", total: "Итого", checkout: "Оформить заказ", remove: "Удалить", loading: "Загрузка..." },
  en: { title: "Cart", empty: "Cart is empty", emptyDesc: "Add parts from the catalog", toCatalog: "Go to catalog", total: "Total", checkout: "Checkout", remove: "Remove", loading: "Loading..." },
  ko: { title: "장바구니", empty: "장바구니가 비어있습니다", emptyDesc: "카탈로그에서 부품을 추가하세요", toCatalog: "카탈로그로 이동", total: "합계", checkout: "주문하기", remove: "삭제", loading: "로딩 중..." },
  ka: { title: "კალათა", empty: "კალათა ცარიელია", emptyDesc: "დაამატეთ ნაწილები კატალოგიდან", toCatalog: "კატალოგში გადასვლა", total: "სულ", checkout: "შეკვეთა", remove: "წაშლა", loading: "იტვირთება..." },
  ar: { title: "السلة", empty: "السلة فارغة", emptyDesc: "أضف قطعًا من الكتالوج", toCatalog: "الذهاب إلى الكتالوج", total: "الإجمالي", checkout: "إتمام الطلب", remove: "حذف", loading: "جارٍ التحميل..." },
};

export default function CartTab({ lang, userId }: Props) {
  const l = L[lang] ?? L.ru;
  const supabase = createClient();
  const [items, setItems] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    setLoading(true);

    // Получаем корзину пользователя
    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!cart) { setLoading(false); return; }

    // Получаем позиции + данные товара
    const { data: cartItems } = await supabase
      .from("cart_items")
      .select("id, quantity, product_id")
      .eq("cart_id", cart.id);

    if (!cartItems || cartItems.length === 0) { setLoading(false); return; }

    const productIds = cartItems.map(i => i.product_id);
    const { data: products } = await supabase
      .from("parts_products")
      .select("id, part_number, name_ru, name_en, price_krw, image_url")
      .in("id", productIds);

    if (!products) { setLoading(false); return; }

    const merged: CartProduct[] = cartItems.map(item => {
      const product = products.find(p => p.id === item.product_id);
      return {
        cart_item_id: item.id,
        quantity: item.quantity,
        product_id: item.product_id,
        part_number: product?.part_number ?? "",
        name_ru: product?.name_ru ?? "",
        name_en: product?.name_en ?? "",
        price_krw: product?.price_krw ?? 0,
        image_url: product?.image_url ?? null,
      };
    });

    setItems(merged);
    setLoading(false);
  };

  useEffect(() => { fetchCart(); }, [userId]);

  const removeItem = async (cartItemId: string) => {
    await supabase.from("cart_items").delete().eq("id", cartItemId);
    setItems(prev => prev.filter(i => i.cart_item_id !== cartItemId));
  };

  const updateQty = async (cartItemId: string, qty: number) => {
    if (qty < 1) return;
    await supabase.from("cart_items").update({ quantity: qty }).eq("id", cartItemId);
    setItems(prev => prev.map(i => i.cart_item_id === cartItemId ? { ...i, quantity: qty } : i));
  };

  const total = items.reduce((sum, i) => sum + i.price_krw * i.quantity, 0);
  const displayName = (item: CartProduct) => lang === "en" ? item.name_en : item.name_ru;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">{l.loading}</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <ShoppingCart className="w-8 h-8 text-gray-300" />
        </div>
        <p className="font-semibold text-gray-700">{l.empty}</p>
        <p className="text-sm text-gray-400">{l.emptyDesc}</p>
        <Link
          href={`/${lang}/parts`}
          className="flex items-center gap-2 mt-2 text-[#002C5F] font-semibold text-sm hover:underline"
        >
          {l.toCatalog}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#002C5F]">{l.title} ({items.length})</h2>

      {/* Список */}
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.cart_item_id} className="flex gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition">
            {/* Фото */}
            <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
              {item.image_url ? (
                <Image src={item.image_url} alt={item.name_en} width={64} height={64} className="object-contain w-full h-full p-1" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">?</div>
              )}
            </div>

            {/* Инфо */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#002C5F] line-clamp-2">{displayName(item)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.part_number}</p>
              <p className="text-sm font-bold text-[#BB162B] mt-1">
                {(item.price_krw * item.quantity).toLocaleString("ko-KR")} ₩
              </p>
            </div>

            {/* Количество + удалить */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button onClick={() => removeItem(item.cart_item_id)} className="text-gray-300 hover:text-red-500 transition">
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
                <button onClick={() => updateQty(item.cart_item_id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-[#002C5F] transition text-lg leading-none">−</button>
                <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => updateQty(item.cart_item_id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-[#002C5F] transition text-lg leading-none">+</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Итого */}
      <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{l.total}</p>
          <p className="text-2xl font-bold text-[#002C5F]">{total.toLocaleString("ko-KR")} ₩</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-[#BB162B] hover:bg-[#9a1122] text-white font-semibold rounded-xl transition text-sm">
          {l.checkout}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
