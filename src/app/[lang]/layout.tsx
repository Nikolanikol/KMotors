import { notFound } from "next/navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import I18nProvider from "@/components/I18nProvider/I18nProvider";

const LANGS = ["ru", "en", "ko", "ka", "ar"];

interface Props {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function LangLayout({ children, params }: Props) {
  const { lang } = await params;

  if (!LANGS.includes(lang)) {
    notFound();
  }

  return (
    <I18nProvider lang={lang}>
      <Header />
      <main className="flex-grow min-h-[70vh]">{children}</main>
      <Footer />
    </I18nProvider>
  );
}
