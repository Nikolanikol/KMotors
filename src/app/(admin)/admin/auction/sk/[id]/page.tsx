// Служебная карточка лота sk. Вся разметка — в общем ShowcaseLotPage.

import ShowcaseLotPage from "@/components/Auction/ShowcaseLotPage";
import { auctionLabels } from "@/lib/auctionLabels";

import { requireAdmin } from "../../shell";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  return <ShowcaseLotPage labels={auctionLabels("ru")} id={id} source="sk" />;
}
