"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Package, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { krwToDisplayUsd } from "@/lib/pricing";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  product_id: number;
  quantity: number;
  price_krw: number;
  part_number: string;
  name_ru: string;
  name_en: string;
  image_url: string | null;
  ship_method: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal_krw: number;
  shipping_method: string;
  shipping_country: string;
  shipping_cost_usd: number;
  exchange_rate: number;
  total_usd: number;
  payment_status: string | null;
  created_at: string;
  items?: OrderItem[];
}

interface Props {
  lang: string;
  userId: string;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const L: Record<string, Record<string, string>> = {
  ru: {
    title: "История заказов",
    empty: "Заказов пока нет",
    emptyDesc: "Здесь будет история ваших заказов.",
    loading: "Загрузка...",
    order: "Заказ",
    items: "позиций",
    total: "Итого",
    shipping: "Доставка",
    subtotal: "Товары",
    showItems: "Показать состав",
    hideItems: "Скрыть состав",
    qty: "×",
  },
  en: {
    title: "Order History",
    empty: "No orders yet",
    emptyDesc: "Your order history will appear here.",
    loading: "Loading...",
    order: "Order",
    items: "items",
    total: "Total",
    shipping: "Shipping",
    subtotal: "Items",
    showItems: "Show items",
    hideItems: "Hide items",
    qty: "×",
  },
  ko: {
    title: "주문 내역",
    empty: "아직 주문이 없습니다",
    emptyDesc: "첫 주문을 하시면 여기에 표시됩니다.",
    loading: "로딩 중...",
    order: "주문",
    items: "개",
    total: "합계",
    shipping: "배송",
    subtotal: "상품",
    showItems: "주문 내역 보기",
    hideItems: "주문 내역 숨기기",
    qty: "×",
  },
  ka: {
    title: "შეკვეთების ისტორია",
    empty: "შეკვეთები ჯერ არ არის",
    emptyDesc: "თქვენი შეკვეთების ისტორია აქ გამოჩნდება.",
    loading: "იტვირთება...",
    order: "შეკვეთა",
    items: "პოზიცია",
    total: "სულ",
    shipping: "მიტანა",
    subtotal: "საქონელი",
    showItems: "შემადგენლობა",
    hideItems: "დამალვა",
    qty: "×",
  },
  ar: {
    title: "سجل الطلبات",
    empty: "لا توجد طلبات بعد",
    emptyDesc: "ستظهر هنا سجل طلباتك.",
    loading: "جارٍ التحميل...",
    order: "طلب",
    items: "عناصر",
    total: "الإجمالي",
    shipping: "الشحن",
    subtotal: "المنتجات",
    showItems: "عرض العناصر",
    hideItems: "إخفاء العناصر",
    qty: "×",
  },
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<string, { ru: string; en: string; color: string }> = {
  pending_payment:    { ru: "Ожидает оплаты",         en: "Awaiting payment",     color: "bg-orange-100 text-orange-800 border-orange-300" },
  paid:               { ru: "Оплачен",                 en: "Paid",                 color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  payment_submitted:  { ru: "Оплата отправлена",       en: "Payment submitted",    color: "bg-blue-100 text-blue-800 border-blue-300" },
  payment_confirmed:  { ru: "Оплата подтверждена",     en: "Payment confirmed",    color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  processing:         { ru: "В обработке",             en: "Processing",           color: "bg-blue-100 text-blue-800 border-blue-300" },
  shipped:            { ru: "Отправлен",               en: "Shipped",              color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  delivered:          { ru: "Доставлен",               en: "Delivered",            color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  cancelled:          { ru: "Отменён",                 en: "Cancelled",            color: "bg-red-100 text-red-800 border-red-300" },
};

const SHIP_LABEL: Record<string, { ru: string; en: string }> = {
  ems:         { ru: "EMS Korea", en: "EMS Korea" },
  ems_premium: { ru: "EMS Korea", en: "EMS Korea" },
  sea:         { ru: "Морская доставка", en: "Sea freight" },
};

const usdFmt = new Intl.NumberFormat("en-US");

function ruPlural(n: number, one: string, few: string, many: string) {
  const abs = Math.abs(n) % 100;
  if (abs >= 11 && abs <= 19) return many;
  const last = abs % 10;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrdersTab({ lang, userId }: Props) {
  const l = L[lang] ?? L.ru;
  const isRu = lang !== "en";
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadOrders = async () => {
    setLoading(true);

    const { data: ordersData } = await supabase
      .from("orders")
      .select("id, order_number, status, subtotal_krw, shipping_method, shipping_country, shipping_cost_usd, exchange_rate, total_usd, payment_status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!ordersData?.length) { setLoading(false); return; }

    // Load all order items at once
    const orderIds = ordersData.map((o) => o.id);
    const { data: allItems } = await supabase
      .from("order_items")
      .select("id, order_id, product_id, quantity, price_krw, part_number, name_ru, name_en, image_url, ship_method")
      .in("order_id", orderIds);

    const merged: Order[] = ordersData.map((o) => ({
      ...o,
      items: (allItems ?? []).filter((i) => (i as { order_id: string } & typeof i).order_id === o.id),
    }));

    setOrders(merged);
    setLoading(false);
  };

  const toggleExpand = (orderId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === "en" ? "en-GB" : "ru-RU", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const statusCfg = (status: string) =>
    STATUS[status] ?? { ru: status, en: status, color: "bg-gray-50 text-gray-600 border-gray-200" };

  const shipLabel = (method: string) =>
    isRu
      ? (SHIP_LABEL[method]?.ru ?? method.toUpperCase())
      : (SHIP_LABEL[method]?.en ?? method.toUpperCase());

  const itemName = (item: OrderItem) => {
    const name = lang === "en" ? (item.name_en || item.name_ru) : (item.name_ru || item.name_en);
    return name || item.part_number || `#${item.id}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">{l.loading}</span>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#002C5F]">{l.title}</h2>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700">{l.empty}</p>
          <p className="text-sm text-gray-400 text-center max-w-xs">{l.emptyDesc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#002C5F]">{l.title} ({orders.length})</h2>

      {orders.map((order) => {
        const st = statusCfg(order.status);
        const isOpen = expanded.has(order.id);
        const itemCount = order.items?.length ?? 0;

        return (
          <div key={order.id} className="border border-gray-100 rounded-2xl overflow-hidden">
            {/* ── Header ── */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[#002C5F] text-sm">{order.order_number}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.color}`}>
                    {isRu ? st.ru : st.en}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(order.created_at)} · {shipLabel(order.shipping_method)} · {order.shipping_country}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-gray-400">{l.total}</p>
                  <p className="text-base font-bold text-[#002C5F]">
                    ${usdFmt.format(order.total_usd)}
                  </p>
                </div>
                {itemCount > 0 && (
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#002C5F] transition border border-gray-200 rounded-lg px-2.5 py-1.5"
                  >
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {itemCount} {lang === "ru" ? ruPlural(itemCount, "позиция", "позиции", "позиций") : l.items}
                  </button>
                )}
              </div>
            </div>

            {/* ── Price breakdown ── */}
            <div className="px-4 pb-3 flex gap-4 text-xs text-gray-500 border-t border-gray-50">
              <span className="pt-2">{l.subtotal}: <b className="text-gray-700">${usdFmt.format(
                (order.items ?? []).reduce((s, i) => s + krwToDisplayUsd(i.price_krw, order.exchange_rate) * i.quantity, 0)
              )}</b></span>
              {order.shipping_cost_usd > 0 && (
                <span className="pt-2">{l.shipping}: <b className="text-gray-700">${usdFmt.format(order.shipping_cost_usd)}</b></span>
              )}
            </div>

            {/* ── Items list (expandable) ── */}
            {isOpen && itemCount > 0 && (
              <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3">
                {(order.items ?? []).map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-white border border-gray-100">
                      {item.image_url ? (
                        <Image src={item.image_url} alt={item.name_en} width={40} height={40} className="object-contain w-full h-full p-1" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">?</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#002C5F] line-clamp-1">{itemName(item)}</p>
                      <p className="text-xs text-gray-400">{item.part_number}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[#BB162B]">
                        ${usdFmt.format(krwToDisplayUsd(item.price_krw, order.exchange_rate))}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-gray-400">{l.qty} {item.quantity}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
