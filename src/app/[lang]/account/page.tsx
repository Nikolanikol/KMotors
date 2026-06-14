import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AccountClient from "./AccountClient";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ lang: string }>;
}

const TITLES: Record<string, { title: string; description: string }> = {
  ru: { title: "Личный кабинет", description: "Управляйте профилем, корзиной и заказами" },
  en: { title: "My Account", description: "Manage your profile, cart and orders" },
  ko: { title: "내 계정", description: "프로필, 장바구니, 주문 관리" },
  ka: { title: "ანგარიში", description: "მართეთ პროფილი, კალათა და შეკვეთები" },
  ar: { title: "حسابي", description: "إدارة الملف الشخصي والسلة والطلبات" },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const t = TITLES[lang] ?? TITLES.ru;
  return { title: t.title, description: t.description };
}

export default async function AccountPage({ params }: Props) {
  const { lang } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/auth?mode=login&from=/${lang}/account`);

  // Загружаем профиль
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <Suspense fallback={null}>
      <AccountClient
        lang={lang}
        user={{ id: user.id, email: user.email ?? "" }}
        profile={profile}
      />
    </Suspense>
  );
}
