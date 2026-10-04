// Страница машины carnect в админке: лот аукциона или машина HeyDealer.
//
//   /admin/carnect/glovis/<lotId>
//   /admin/carnect/heydealer/<id>
//
// Та же карточка, что на витрине (/[lang]/auction/lot/…), но по-русски и со
// служебной панелью сразу в разметке: сюда и так пускают только админа, а
// кеша у страницы нет (force-dynamic). На витрине панель грузится отдельно —
// см. InternalPanelLoader.tsx.
//
// Детали тянутся с carnect по требованию и держатся в кеше час (cached.ts).

import { notFound } from "next/navigation";

import CarCardView from "@/components/Carnect/CarCardView";
import InternalPanel from "@/components/Carnect/InternalPanel";
import LotState from "@/components/Carnect/LotState";
import { loadCard } from "@/lib/carnect/loadCard";
import { getCarRates } from "@/lib/kbFx";
import { isServiceHost } from "@/lib/serviceHost";

import { requireAdmin } from "../../../auction/shell";

export const dynamic = "force-dynamic";

const BACK = "/admin/carnect/catalog";

export default async function CarnectCarPage({ params }: { params: Promise<{ house: string; lot: string }> }) {
  await requireAdmin();
  const { house, lot: rawLot } = await params;
  // Сегмент приходит закодированным: в lotId бывают "~" и base64.
  const id = decodeURIComponent(rawLot);

  const showInternal = await isServiceHost();
  const t0 = Date.now();
  const [res, rates] = await Promise.all([loadCard(house, id, "ru"), getCarRates()]);
  const ms = Date.now() - t0;
  if (!res) notFound();
  if (res.status !== "ok") {
    return (
      <LotState
        id={id}
        gone={res.status === "gone"}
        parser={res.status === "failed" && res.parser}
        lang="ru"
        backHref={BACK}
        showReason
      />
    );
  }
  return (
    <CarCardView
      card={res.card}
      backHref={BACK}
      id={id}
      lang="ru"
      krwToUsd={rates.krwToUsd}
      internal={showInternal && <InternalPanel card={res.card} meta={{ id, ms, fetchedAt: res.fetchedAt }} />}
    />
  );
}
