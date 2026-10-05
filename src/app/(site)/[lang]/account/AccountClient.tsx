"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { User, ShoppingCart, Package, ChevronRight, Home } from "lucide-react";
import Link from "next/link";
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
  /** Курс KRW→USD с сервера (getCurrencyRates, кеш 24ч). В браузере НЕ запрашивать. */
  krwToUsd: number;
}

type Tab = "profile" | "cart" | "orders";

const TABS: Record<string, { profile: string; cart: string; orders: string }> = {
  ru: { profile: "Профиль", cart: "Корзина", orders: "Заказы" },
  en: { profile: "Profile", cart: "Cart", orders: "Orders" },
  ko: { profile: "프로필", cart: "장바구니", orders: "주문" },
  ka: { profile: "პროფილი", cart: "კალათა", orders: "შეკვეთები" },
  ar: { profile: "الملف الشخصي", cart: "السلة", orders: "الطلبات" },
};

const BREADCRUMB: Record<string, { home: string; account: string }> = {
  ru: { home: "Главная", account: "Личный кабинет" },
  en: { home: "Home", account: "My Account" },
  ko: { home: "홈", account: "내 계정" },
  ka: { home: "მთავარი", account: "ანგარიში" },
  ar: { home: "الرئيسية", account: "حسابي" },
};

export default function AccountClient({ lang, user, profile, krwToUsd }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialTab = (searchParams.get("tab") as Tab | null) ?? "profile";
  const [activeTab, setActiveTab] = useState<Tab>(
    ["profile", "cart", "orders"].includes(initialTab) ? initialTab : "profile"
  );
  const labels = TABS[lang] ?? TABS.ru;
  const bc = BREADCRUMB[lang] ?? BREADCRUMB.ru;

  const switchTab = (id: Tab) => {
    setActiveTab(id);
    router.replace(`${pathname}?tab=${id}`, { scroll: false });
  };

  useEffect(() => {
    const tab = searchParams.get("tab") as Tab | null;
    if (tab && ["profile", "cart", "orders"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  const isRTL = false; // RTL-переворот отключён — макет всегда LTR (см. layout.tsx)

  const tabs = [
    { id: "profile" as Tab, label: labels.profile, icon: User },
    { id: "cart" as Tab, label: labels.cart, icon: ShoppingCart },
    { id: "orders" as Tab, label: labels.orders, icon: Package },
  ];

  return (
    <div
      className="min-h-screen bg-[var(--axis-black)] py-8 px-4 text-[var(--axis-white)]"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-[var(--axis-gray)] mb-5">
          <Link href={`/${lang}`} className="hover:text-[var(--axis-bronze-bright)] transition-colors">{bc.home}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[var(--axis-white)] font-medium">{bc.account}</span>
        </nav>

        {/* Шапка */}
        <div className="mb-6 flex items-center gap-4">
          {/* Инициал в бронзовом кольце — тот же знак, что у иконки профиля в шапке. */}
          <div
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold uppercase text-[var(--axis-bronze-bright)]"
            style={{ backgroundColor: "rgba(182,119,73,0.14)", border: "1.5px solid rgba(182,119,73,0.45)" }}
          >
            {(profile?.name || user.email).trim().charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-[var(--axis-white)]">
              {profile?.name || user.email.split("@")[0]}
            </h1>
            <p className="mt-0.5 truncate text-sm text-[var(--axis-gray)]">{user.email}</p>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex gap-1 bg-[var(--axis-charcoal)] rounded-2xl p-1.5 shadow-sm border border-white/[0.06] mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              aria-current={activeTab === id ? "page" : undefined}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)] ${
                activeTab === id
                  ? "bg-[var(--axis-bronze-deep)] bg-[image:var(--axis-bronze-fill)] text-white shadow-[0_4px_14px_-6px_rgba(157,94,52,0.9)]"
                  : "text-[var(--axis-gray)] hover:text-[var(--axis-white)] hover:bg-white/[0.06]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>

        {/* Контент вкладки */}
        <div className="bg-[var(--axis-charcoal)] rounded-2xl border border-white/[0.06] p-6 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.9)]">
          {activeTab === "profile" && (
            <ProfileForm lang={lang} user={user} profile={profile} />
          )}
          {activeTab === "cart" && (
            <CartTab lang={lang} userId={user.id} profileCountry={profile?.country ?? null} krwToUsd={krwToUsd} />
          )}
          {activeTab === "orders" && (
            <OrdersTab lang={lang} userId={user.id} />
          )}
        </div>
      </div>
    </div>
  );
}
