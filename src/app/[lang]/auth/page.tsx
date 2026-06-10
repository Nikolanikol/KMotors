import AuthForm from "./AuthForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ mode?: string; from?: string }>;
}

export default async function AuthPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const { mode = "login", from } = await searchParams;

  // Если уже авторизован — редирект
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(`/${lang}/parts`);

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4 py-12">
      <AuthForm lang={lang} initialMode={mode as "login" | "register"} from={from} />
    </div>
  );
}
