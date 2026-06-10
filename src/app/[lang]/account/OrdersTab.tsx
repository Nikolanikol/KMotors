"use client";

import { Package, Clock } from "lucide-react";

interface Props {
  lang: string;
}

const L: Record<string, Record<string, string>> = {
  ru: { title: "История заказов", empty: "Заказов пока нет", emptyDesc: "Здесь будет история ваших заказов. Оформите первый заказ из корзины.", soon: "Скоро" },
  en: { title: "Order History", empty: "No orders yet", emptyDesc: "Your order history will appear here. Place your first order from the cart.", soon: "Coming soon" },
  ko: { title: "주문 내역", empty: "아직 주문이 없습니다", emptyDesc: "장바구니에서 첫 주문을 하시면 여기에 표시됩니다.", soon: "곧 출시" },
  ka: { title: "შეკვეთების ისტორია", empty: "შეკვეთები ჯერ არ არის", emptyDesc: "თქვენი შეკვეთების ისტორია აქ გამოჩნდება.", soon: "მალე" },
  ar: { title: "سجل الطلبات", empty: "لا توجد طلبات بعد", emptyDesc: "ستظهر هنا سجل طلباتك عند إتمام أول طلب.", soon: "قريبًا" },
};

export default function OrdersTab({ lang }: Props) {
  const l = L[lang] ?? L.ru;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#002C5F]">{l.title}</h2>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          <Clock className="w-3 h-3" />
          {l.soon}
        </span>
      </div>

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
