import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { notifyAccountVisit } from "@/lib/signupNotify";
import AccountClient from "./AccountClient";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ lang: string }>;
}

const TITLES: Record<string, { title: string; description: string }> = {
  ru: { title: "Личный кабинет", description: "Управляйте профилем и заказами" },
  en: { title: "My Account", description: "Manage your profile and orders" },
  ko: { title: "내 계정", description: "프로필 및 주문 관리" },
  ka: { title: "ანგარიში", description: "მართეთ პროფილი და შეკვეთები" },
  ar: { title: "حسابي", description: "إدارة الملف الشخصي والطلبات" },
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

  // Вход в кабинет — менеджеру в Telegram (src/lib/signupNotify.ts). after():
  // отправка идёт ПОСЛЕ ответа, кабинет не ждёт Telegram и не падает из-за него.
  after(() => notifyAccountVisit(user));

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
