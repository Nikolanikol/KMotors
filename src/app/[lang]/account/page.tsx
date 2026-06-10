import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AccountClient from "./AccountClient";

interface Props {
  params: Promise<{ lang: string }>;
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
