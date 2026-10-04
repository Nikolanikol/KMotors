// Страница машины на витрине: лот аукциона или машина HeyDealer.
//
//   /en/auction/lot/glovis/<lotId>
//   /en/auction/lot/heydealer/<id>
//
// Карточка — общая с админкой (src/components/Carnect/CarCardView.tsx).
// АНГЛИЙСКИЙ на всех локалях (решение владельца 04.10.2026).
//
// ⚠️ Кеш. Страница — ISR на час (пустой generateStaticParams включает его,
// см. CLAUDE.md, «Отсутствие generateStaticParams ОТКЛЮЧАЕТ ISR»), а не
// force-dynamic, как в админке. Поэтому на ней НЕТ ничего, что зависит от
// хоста: кеш Next один на www и служебный хост, и ответ служебного хоста ушёл
// бы клиентам. Служебная панель приезжает отдельно, уже в браузере —
// InternalPanelLoader, и только на служебном хосте.
//
// ⚠️ Сбой источника — БРОСОК, а не плашка: брошенный рендер в кеш не попадает
// (ловит error.tsx сегмента), а плашка «недоступно» закешировалась бы на час
// при живом лоте. «Ушла с торгов» — устойчивый факт, его кешировать можно.
//
// noindex, nofollow плюс запрет в robots.ts: обход ботами — это запросы к
// carnect, а лоты живут дни.

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CarCardView from "@/components/Carnect/CarCardView";
import InternalPanelLoader from "@/components/Carnect/InternalPanelLoader";
import LotState from "@/components/Carnect/LotState";
import { loadCard } from "@/lib/carnect/loadCard";

/** Как у деталей в cached.ts: чаще страница всё равно не обновится. */
export const revalidate = 3600;
export const dynamicParams = true;

/** ⚠️ Пустой список — не заглушка, а включатель ISR (см. шапку). */
export function generateStaticParams() {
  return [];
}

const LANG = "en" as const;
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kmotors.shop";

type Params = { lang: string; house: string; lot: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { house, lot } = await params;
  const res = await loadCard(house, decodeURIComponent(lot), LANG);
  const title = res?.status === "ok" ? `${res.card.title} — Korean car auction` : "Korean car auction";
  return { title, robots: { index: false, follow: false } };
}

export default async function AuctionLotPage({ params }: { params: Promise<Params> }) {
  const { lang, house, lot: rawLot } = await params;
  // Сегмент приходит закодированным: в lotId бывают "~" и base64.
  const id = decodeURIComponent(rawLot);
  const back = `/${lang}/auction`;

  const res = await loadCard(house, id, LANG);
  if (!res) notFound();
  if (res.status === "failed") throw new Error(`carnect ${house}/${id}: ${res.parser ? "parser" : "unavailable"}`);
  if (res.status === "gone") {
    return <LotState id={id} gone parser={false} lang={LANG} backHref={back} withHeader />;
  }
  return (
    <CarCardView
      card={res.card}
      backHref={back}
      id={id}
      lang={LANG}
      pageUrl={`${SITE}/${lang}/auction/lot/${house}/${encodeURIComponent(id)}`}
      withHeader
      internal={<InternalPanelLoader house={house} id={id} />}
    />
  );
}
