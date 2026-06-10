"use client";

import { useState } from "react";
import { User, ShoppingCart, Package } from "lucide-react";
import ProfileForm from "./ProfileForm";
import CartTab from "./CartTab";
import OrdersTab from "./OrdersTab";

interface Profile {
  name: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  zip: string | null;
  preferred_lang: string | null;
}

interface Props {
  lang: string;
  user: { id: string; email: string };
  profile: Profile | null;
}

type Tab = "profile" | "cart" | "orders";

const TABS: Record<string, { profile: string; cart: string; orders: string }> = {
  ru: { profile: "Профиль", cart: "Корзина", orders: "Заказы" },
  en: { profile: "Profile", cart: "Cart", orders: "Orders" },
  ko: { profile: "프로필", cart: "장바구니", orders: "주문" },
  ka: { profile: "პროფილი", cart: "კალათა", orders: "შეკვეთები" },
  ar: { profile: "الملف الشخصي", cart: "السلة", orders: "الطلبات" },
};

export default function AccountClient({ lang, user, profile }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const labels = TABS[lang] ?? TABS.ru;
  const isRTL = lang === "ar";

  const tabs = [
    { id: "profile" as Tab, label: labels.profile, icon: User },
    { id: "cart" as Tab, label: labels.cart, icon: ShoppingCart },
    { id: "orders" as Tab, label: labels.orders, icon: Package },
  ];

  return (
    <div
      className="min-h-screen bg-[#F5F7FA] py-8 px-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-3xl mx-auto">
        {/* Шапка */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#002C5F]">
            {profile?.name || user.email.split("@")[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
        </div>

        {/* Вкладки */}
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeTab === id
                  ? "bg-[#002C5F] text-white shadow-sm"
                  : "text-gray-500 hover:text-[#002C5F] hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>

        {/* Контент вкладки */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {activeTab === "profile" && (
            <ProfileForm lang={lang} user={user} profile={profile} />
          )}
          {activeTab === "cart" && (
            <CartTab lang={lang} userId={user.id} />
          )}
          {activeTab === "orders" && (
            <OrdersTab lang={lang} />
          )}
        </div>
      </div>
    </div>
  );
}
