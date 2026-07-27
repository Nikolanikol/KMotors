import { Metadata } from "next";
import CarsDictionary from "@/components/I18nProvider/CarsDictionary";
import FavoritesClient from "./FavoritesClient";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const titles: Record<string, string> = {
    ru: "Избранное — KMotors",
    en: "Favorites — KMotors",
    ko: "즐겨찾기 — KMotors",
    ka: "რჩეულები — KMotors",
    ar: "المفضلة — KMotors",
  };
  return { title: titles[lang] || titles.ru };
}

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <>
      {/* FavoritesClient переводит характеристики через словарь Encar */}
      <CarsDictionary lang={lang} />
      <FavoritesClient />
    </>
  );
}
