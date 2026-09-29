// Публичная витрина аукционов, вкладка SK.
//
// Отличается от вкладки K Car ровно одним: прогноза цены молотка здесь нет и
// быть не может — история прошедших торгов есть только у K Car, а премия
// одной площадки к другой неприменима, это разные торги с разной механикой.
//
// Всё остальное — шапка с оговоркой о стартовой цене, вкладки, фильтры и
// сетка — общее, в ../shell.

import type { Metadata } from "next";

import { auctionLabels } from "@/lib/auctionLabels";

import { PlatformPage } from "../shell";

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

export default async function SKAuctionPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ lang }, sp] = await Promise.all([params, searchParams]);
  return <PlatformPage lang={lang} searchParams={sp} source="sk" />;
}
