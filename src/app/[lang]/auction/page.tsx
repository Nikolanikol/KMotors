// Публичная витрина аукционов, вкладка K Car.
//
// ⚠️ ЦЕНА — СТАРТОВАЯ, и это сказано на странице прямым текстом (решение
// владельца 12.09.2026): лот уходит в среднем на 14% дороже старта, а сверх
// того идут сбор аукциона, доставка и растаможка. Оговорка живёт в shell.tsx,
// одна на все вкладки — разъедутся, и вкладки начнут обещать разное.
//
// ⚠️ noindex НАМЕРЕННО: лоты живут дни, и в индексе они обернулись бы сотнями
// 404, как уже было со страницами проданных машин.
//
// Прогноз молотка есть ТОЛЬКО здесь: история прошедших торгов наполняется из
// публичного API K Car, у Lotte и SK такого API не существует.

import type { Metadata } from "next";

import { auctionLabels } from "@/lib/auctionLabels";

import { PlatformPage } from "./shell";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const L = auctionLabels(lang);
  return { title: L.title, description: L.subtitle, robots: { index: false, follow: true } };
}

export default async function AuctionPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ lang }, sp] = await Promise.all([params, searchParams]);
  return <PlatformPage lang={lang} searchParams={sp} source="kcar" withForecast />;
}
