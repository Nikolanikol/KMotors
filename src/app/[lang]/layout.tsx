import { notFound } from "next/navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import I18nProvider from "@/components/I18nProvider/I18nProvider";
import MessengerButtons from "@/components/MessengerButtons";
import CookieBanner from "@/components/CookieBanner";
import ProgressBar from "@/components/ProgressBar";
import FavoritePriceAlert from "@/components/FavoritePriceAlert";
import { loadResources } from "@/lib/loadLocale";

const LANGS = ["ru", "en", "ka", "ar"];

interface Props {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

// ⚠️ AuthProvider здесь НЕ подключён — намеренно, замер 22.08.2026.
// Провайдер тянул клиент Supabase (242 KB распакованных, 62 KB по сети) в
// браузер на КАЖДОЙ странице сайта, а его хук `useAuth()` не вызывался ни в
// одном файле проекта — контекст никто не читал. Вместе с ним ушёл серверный
// `supabase.auth.getUser()`, который стоял здесь же и существовал ровно ради
// пропса `initialUser` этого провайдера: поход по сети к Supabase перед
// отрисовкой любой страницы, включая каталог, запчасти и блог.
//
// Авторизация от этого не сломана и продолжает работать: `/auth`, `/account` и
// `/checkout` держат собственные клиенты Supabase (`AuthForm.tsx`,
// `account/*Tab.tsx`, `ProfileForm.tsx`), а сессию обновляет middleware.
// Понадобится общий контекст пользователя — подключать его НЕ сюда, а в layout
// тех сегментов, где он реально нужен: этот layout лежит на пути всего сайта.
export default async function LangLayout({ children, params }: Props) {
  const { lang } = await params;

  if (!LANGS.includes(lang)) {
    notFound();
  }

  // Ресурсы уезжают в RSC-payload КАЖДОЙ страницы, поэтому их объём = вес страницы.
  // Здесь только `common`; словарь Encar (`cars`, 76 KB) подключают сами маршруты
  // авто через <CarsDictionary/> — этот layout при клиентской навигации внутри
  // [lang] не перерисовывается, так что раздавать `cars` отсюда нельзя: переход
  // /parts → /catalog оставил бы каталог без словаря.
  const resources = loadResources(lang);

  return (
    <I18nProvider lang={lang} resources={resources}>
      <ProgressBar />
      <Header />
      <main className="flex-grow min-h-[70vh] pt-[68px]">{children}</main>
      <Footer />
      <MessengerButtons />
      <CookieBanner />
      <FavoritePriceAlert />
    </I18nProvider>
  );
}
