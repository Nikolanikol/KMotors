import { notFound } from "next/navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import I18nProvider from "@/components/I18nProvider/I18nProvider";
import MessengerButtons from "@/components/MessengerButtons";
import CookieBanner from "@/components/CookieBanner";
import ProgressBar from "@/components/ProgressBar";
import FavoritePriceAlert from "@/components/FavoritePriceAlert";
import { AuthProvider } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/server";
import { loadResources } from "@/lib/loadLocale";

const LANGS = ["ru", "en", "ka", "ar"];

interface Props {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function LangLayout({ children, params }: Props) {
  const { lang } = await params;

  if (!LANGS.includes(lang)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Только активный язык + en (фолбэк) — грузится на сервере, не в клиентском бандле.
  const resources = loadResources(lang);

  return (
    <I18nProvider lang={lang} resources={resources}>
      <AuthProvider initialUser={user}>
        <ProgressBar />
        <Header />
        <main className="flex-grow min-h-[70vh] pt-[68px]">{children}</main>
        <Footer />
        <MessengerButtons />
        <CookieBanner />
        <FavoritePriceAlert />
      </AuthProvider>
    </I18nProvider>
  );
}
