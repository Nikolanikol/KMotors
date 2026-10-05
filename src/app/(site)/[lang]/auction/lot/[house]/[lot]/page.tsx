// Страница машины на витрине: лот аукциона или машина HeyDealer.
//
//   /en/auction/lot/glovis/<lotId>
//   /en/auction/lot/heydealer/<id>
//
// Карточка — общая с админкой (src/components/Carnect/CarCardView.tsx).
// АНГЛИЙСКИЙ на всех локалях (решение владельца 04.10.2026).
//
// ⚠️ Страница ДИНАМИЧЕСКАЯ с 05.10.2026 (до этого ISR на час). Причина — цены:
// гость их не видит (решение владельца), а ответ, зависящий от посетителя, в
// общий кеш класть нельзя — цена зарегистрированного уехала бы гостям. Дорогая
// часть кешируется и так: детали лота — unstable_cache на час (cached.ts),
// курс — кеш данных fetch (kbFx.ts). На рендер остаётся проверка входа.
//
// ⚠️ Цена у гостя ВЫЧИЩАЕТСЯ из данных до отрисовки (card.price.krw, похожие),
// а не прячется стилями: всё, что уходит в клиентские компоненты, видно в
// «Просмотре кода». Лоты без цены (Lotte, HeyDealer Self/Zero) не трогаем.
//
// Служебная панель по-прежнему приходит отдельно (InternalPanelLoader) —
// так она не попадает в разметку www при любой схеме кеша.
//
// Сбой источника — бросок, а не плашка (ловит error.tsx сегмента): так сбой
// не путается с «ушла с торгов».
//
// noindex, nofollow плюс запрет в robots.ts: обход ботами — это запросы к
// carnect, а лоты живут дни.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import CarCardView from "@/components/Carnect/CarCardView";
import InternalPanelLoader from "@/components/Carnect/InternalPanelLoader";
import LotState from "@/components/Carnect/LotState";
import SimilarCars from "@/components/Carnect/SimilarCars";
import { loadCard } from "@/lib/carnect/loadCard";
import { getSimilar } from "@/lib/carnect/similar";
import { getCarRates } from "@/lib/kbFx";
import { canSeeAuctionPrices } from "@/lib/viewer";

/** Ответ зависит от посетителя (цена только после входа) — см. шапку. */
export const dynamic = "force-dynamic";

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

  const [res, rates, seesPrices] = await Promise.all([loadCard(house, id, LANG), getCarRates(), canSeeAuctionPrices()]);
  const priceLocked = !seesPrices;
  if (!res) notFound();
  if (res.status === "failed") throw new Error(`carnect ${house}/${id}: ${res.parser ? "parser" : "unavailable"}`);
  if (res.status === "gone") {
    return <LotState id={id} gone parser={false} lang={LANG} backHref={back} withHeader />;
  }
  // ⚠️ Гостю — без цен (см. шапку): и у самой машины, и у похожих (SimilarSection).
  const card = priceLocked ? { ...res.card, price: { ...res.card.price, krw: null } } : res.card;
  return (
    <CarCardView
      card={card}
      priceLocked={priceLocked && res.card.price.kind !== "none"}
      backHref={back}
      id={id}
      lang={LANG}
      pageUrl={`${SITE}/${lang}/auction/lot/${house}/${encodeURIComponent(id)}`}
      withHeader
      krwToUsd={rates.krwToUsd}
      internal={<InternalPanelLoader house={house} id={id} />}
      // Похожие — за Suspense: страница уходит посетителю, не дожидаясь их
      // выборки, блок дописывается в тот же ответ потоком (он внизу страницы).
      similar={
        <Suspense fallback={null}>
          <SimilarSection
            house={house}
            id={id}
            lang={lang}
            make={res.card.make}
            modelGroup={res.card.modelGroup}
            year={res.card.year}
            priceLocked={priceLocked}
            krwToUsd={rates.krwToUsd}
          />
        </Suspense>
      }
    />
  );
}

/** Блок «Похожие машины»: своя выборка (кеш 10 минут, similar.ts), гостю — без цен. */
async function SimilarSection({
  house,
  id,
  lang,
  make,
  modelGroup,
  year,
  priceLocked,
  krwToUsd,
}: {
  house: string;
  id: string;
  lang: string;
  make: string | null;
  modelGroup: string | null;
  year: number | null;
  priceLocked: boolean;
  krwToUsd: number;
}) {
  const rows = await getSimilar({ house, externalId: id, make, modelGroup, year });
  return (
    <SimilarCars
      rows={priceLocked ? rows.map((r) => ({ ...r, price_krw: null })) : rows}
      lang={LANG}
      catalogBase={`/${lang}/auction`}
      lotBase={`/${lang}/auction/lot`}
      krwToUsd={krwToUsd}
      priceLocked={priceLocked}
      make={make}
      modelGroup={modelGroup}
    />
  );
}
