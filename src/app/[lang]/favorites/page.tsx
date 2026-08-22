import { Metadata } from "next";
import CarsDictionary from "@/components/I18nProvider/CarsDictionary";
import FavoritesClient from "./FavoritesClient";
import { getCurrencyRates } from "@/utils/getCurrencyRates";

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
  // Курс с сервера. Раньше FavoritesClient держал свою константу 0.00066
  // («June 2026») и догружал курс запросом из браузера, глуша ошибку молча.
  const { krwToUsd } = await getCurrencyRates();
  return (
    <>
      {/* FavoritesClient переводит характеристики через словарь Encar */}
      <CarsDictionary lang={lang} />
      <FavoritesClient krwToUsd={krwToUsd} />
    </>
  );
}
