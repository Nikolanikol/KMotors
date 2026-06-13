"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, ShoppingCart, ArrowRight, Loader2, Minus, Plus, Plane, Ship } from "lucide-react";
import { notifyCartUpdate } from "@/hooks/useCartCount";
import Image from "next/image";
import Link from "next/link";
import { formatUsd, krwToDisplayUsd } from "@/lib/pricing";
import { generatePartSlug } from "@/utils/partSlug";

interface CartProduct {
  cart_item_id: string;
  quantity: number;
  product_id: number;
  part_number: string;
  name_ru: string;
  name_en: string;
  price_krw: number;
  image_url: string | null;
  ship_method: "EMS" | "EMS_PREMIUM" | "SEA" | "CLARIFY";
  billed_weight_kg: number;
}

interface Props {
  lang: string;
  userId: string;
}

const FALLBACK_KRW_TO_USD = 0.00066; // June 2026
const usdFmt = new Intl.NumberFormat("en-US");

const L: Record<string, Record<string, string>> = {
  ru: { title: "Корзина", empty: "Корзина пуста", emptyDesc: "Добавьте запчасти из каталога", toCatalog: "В каталог запчастей", total: "Итого", checkout: "Оформить заказ", remove: "Удалить", loading: "Загрузка...", air: "Авиадоставка", sea: "Морская доставка", weight: "расч. вес", kg: "кг" },
  en: { title: "Cart", empty: "Cart is empty", emptyDesc: "Add parts from the catalog", toCatalog: "Go to catalog", total: "Total", checkout: "Checkout", remove: "Remove", loading: "Loading...", air: "Air Shipping", sea: "Sea Freight", weight: "billed wt.", kg: "kg" },
  ko: { title: "장바구니", empty: "장바구니가 비어있습니다", emptyDesc: "카탈로그에서 부품을 추가하세요", toCatalog: "카탈로그로 이동", total: "합계", checkout: "주문하기", remove: "삭제", loading: "로딩 중...", air: "항공 배송", sea: "해상 배송", weight: "청구 중량", kg: "kg" },
  ka: { title: "კალათა", empty: "კალათა ცარიელია", emptyDesc: "დაამატეთ ნაწილები კატალოგიდან", toCatalog: "კატალოგში გადასვლა", total: "სულ", checkout: "შეკვეთა", remove: "წაშლა", loading: "იტვირთება...", air: "საჰაერო მიტანა", sea: "საზღვაო მიტანა", weight: "ანგარიშ. წონა", kg: "კგ" },
  ar: { title: "السلة", empty: "السلة فارغة", emptyDesc: "أضف قطعًا من الكتالوج", toCatalog: "الذهاب إلى الكتالوج", total: "الإجمالي", checkout: "إتمام الطلب", remove: "حذف", loading: "جارٍ التحميل...", air: "الشحن الجوي", sea: "الشحن البحري", weight: "الوزن المحسوب", kg: "كغ" },
};

export default function CartTab({ lang, userId }: Props) {
  const l = L[lang] ?? L.ru;
  const supabase = createClient();
  const [items, setItems] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [krwToUsd, setKrwToUsd] = useState(FALLBACK_KRW_TO_USD);

  // Загружаем курс валюты (тот же источник что и каталог)
  useEffect(() => {
    fetch("https://api.frankfurter.dev/v1/latest?from=KRW&to=USD")
      .then(r => r.json())
      .then(d => { if (d.rates?.USD) setKrwToUsd(d.rates.USD); })
      .catch(() => {});
  }, []);

  const fetchCart = async () => {
    setLoading(true);

    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!cart) { setLoading(false); return; }

    const { data: cartItems } = await supabase
      .from("cart_items")
      .select("id, quantity, product_id")
      .eq("cart_id", cart.id);

    if (!cartItems || cartItems.length === 0) { setLoading(false); return; }

    const productIds = cartItems.map(i => i.product_id);
    const { data: products } = await supabase
      .from("parts_products")
      .select("id, part_number, name_ru, name_en, price_krw, image_url, weight_kg, billed_weight_kg, ship_method, category_id, subcategory_id")
      .in("id", productIds);

    if (!products) { setLoading(false); return; }

    const catIds = [...new Set(
      products.map(p => (p.subcategory_id ?? p.category_id) as number).filter(Boolean)
    )];
    const { data: logistics } = catIds.length
      ? await supabase.from("v_category_logistics").select("id, weight_avg_kg, billed_weight_kg, ship_method").in("id", catIds)
      : { data: [] as { id: number; weight_avg_kg: number | null; billed_weight_kg: number | null; ship_method: string | null }[] };

    const merged: CartProduct[] = cartItems.map(item => {
      const product = products.find(p => p.id === item.product_id);
      const catId = (product?.subcategory_id ?? product?.category_id) as number | null;
      const cat = logistics?.find(x => x.id === catId);
      const weight = (product?.weight_kg ?? cat?.weight_avg_kg ?? 1.0) as number;
      const billedWeight = product?.billed_weight_kg
        ? (product.billed_weight_kg as number)
        : cat?.billed_weight_kg
          ? (cat.billed_weight_kg as number)
          : Math.round(weight * 1.12 * 1000) / 1000;

      return {
        cart_item_id: item.id,
        quantity: item.quantity,
        product_id: item.product_id,
        part_number: product?.part_number ?? "",
        name_ru: product?.name_ru ?? "",
        name_en: product?.name_en ?? "",
        price_krw: product?.price_krw ?? 0,
        image_url: product?.image_url ?? null,
        ship_method: (product?.ship_method ?? cat?.ship_method ?? "EMS") as "EMS" | "EMS_PREMIUM" | "SEA" | "CLARIFY",
        billed_weight_kg: billedWeight,
      };
    });

    setItems(merged);
    setLoading(false);
  };

  useEffect(() => { fetchCart(); }, [userId]);

  const removeItem = async (cartItemId: string) => {
    await supabase.from("cart_items").delete().eq("id", cartItemId);
    setItems(prev => prev.filter(i => i.cart_item_id !== cartItemId));
    notifyCartUpdate();
  };

  const updateQty = async (cartItemId: string, qty: number) => {
    if (qty < 1) return;
    await supabase.from("cart_items").update({ quantity: qty }).eq("id", cartItemId);
    setItems(prev => prev.map(i => i.cart_item_id === cartItemId ? { ...i, quantity: qty } : i));
    notifyCartUpdate();
  };

  const totalUsd = items.reduce(
    (sum, i) => sum + krwToDisplayUsd(i.price_krw, krwToUsd) * i.quantity,
    0
  );
  const displayName = (item: CartProduct) => {
    const name = lang === "en" ? (item.name_en || item.name_ru) : (item.name_ru || item.name_en);
    return name || item.part_number || `#${item.product_id}`;
  };

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

  const airItems = items.filter(i => i.ship_method === "EMS" || i.ship_method === "EMS_PREMIUM");
  const seaItems = items.filter(i => i.ship_method === "SEA" || i.ship_method === "CLARIFY");

  const renderItem = (item: CartProduct) => (
    <div key={item.cart_item_id} className="flex gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition">
      {/* Фото */}
      <Link
        href={`/${lang}/parts/${generatePartSlug(item.part_number, item.name_ru || item.name_en, lang as "ru" | "en" | "ko", item.product_id)}`}
        className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 hover:border-[#002C5F] transition"
      >
        {item.image_url ? (
          <Image src={item.image_url} alt={item.name_en} width={64} height={64} className="object-contain w-full h-full p-1" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">?</div>
        )}
      </Link>

      {/* Инфо */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/${lang}/parts/${generatePartSlug(item.part_number, item.name_ru || item.name_en, lang as "ru" | "en" | "ko", item.product_id)}`}
          className="text-sm font-semibold text-[#002C5F] line-clamp-2 hover:underline"
        >
          {displayName(item)}
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">{item.part_number}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">{l.weight} {item.billed_weight_kg} {l.kg}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-0.5 ${
            item.ship_method === "SEA" || item.ship_method === "CLARIFY"
              ? "bg-blue-50 text-blue-600"
              : item.ship_method === "EMS_PREMIUM"
              ? "bg-orange-50 text-orange-600"
              : "bg-green-50 text-green-600"
          }`}>
            {item.ship_method === "SEA" || item.ship_method === "CLARIFY"
              ? <Ship className="w-2.5 h-2.5" />
              : <Plane className="w-2.5 h-2.5" />}
            {item.ship_method === "EMS" ? "EMS" : item.ship_method === "EMS_PREMIUM" ? "EMS+" : "SEA"}
          </span>
        </div>
        <p className="text-sm font-bold text-[#BB162B] mt-1">
          {formatUsd(item.price_krw, krwToUsd)}
          {item.quantity > 1 && (
            <span className="text-xs font-normal text-gray-400 ml-1">× {item.quantity}</span>
          )}
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
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#002C5F]">{l.title} ({items.length})</h2>

      {/* Авиадоставка */}
      {airItems.length > 0 && (
        <div>
          {seaItems.length > 0 && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <Plane className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-gray-600">{l.air}</span>
              <span className="text-xs text-gray-400">({airItems.length})</span>
            </div>
          )}
          <div className="space-y-3">
            {airItems.map(renderItem)}
          </div>
        </div>
      )}

      {/* Морская доставка */}
      {seaItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1 mt-2">
            <Ship className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-600">{l.sea}</span>
            <span className="text-xs text-gray-400">({seaItems.length})</span>
          </div>
          <div className="space-y-3">
            {seaItems.map(renderItem)}
          </div>
        </div>
      )}

      {/* Итого */}
      <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{l.total}</p>
          <p className="text-2xl font-bold text-[#002C5F]">${usdFmt.format(totalUsd)}</p>
        </div>
        <Link
          href={`/${lang}/checkout`}
          className="flex items-center gap-2 px-6 py-3 bg-[#BB162B] hover:bg-[#9a1122] text-white font-semibold rounded-xl transition text-sm"
        >
          {l.checkout}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
