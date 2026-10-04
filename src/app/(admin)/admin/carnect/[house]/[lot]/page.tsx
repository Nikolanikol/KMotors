// Страница машины carnect в админке: лот аукциона или машина HeyDealer.
//
//   /admin/carnect/glovis/<lotId>
//   /admin/carnect/heydealer/<id>
//
// Данные источника сводятся к единой карточке (src/lib/carnect/card.ts), и
// рисует её один компонент (CarCardView) — у аукционов и HeyDealer разная
// механика, но страница одна. Блок «Только для нас» внизу — служебное: сканы,
// ставки, все поля и сырой JSON, по которым мы сверяем источник.
//
// Детали тянутся с carnect по требованию и держатся в кеше час (cached.ts):
// сколько бы раз машину ни открыли, к источнику уходит один запрос в час.
// Пока он идёт, показывается loading.tsx.

import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "../../../auction/shell";
import { fromHey, fromLot } from "@/lib/carnect/card";
import { getHeyCar, getLotDetail } from "@/lib/carnect/cached";
import { isHouse } from "@/lib/carnect/houses";
import { isServiceHost } from "@/lib/serviceHost";

import { C, Page, Panel } from "../../ui";
import CarCardView from "./CarCardView";

export const dynamic = "force-dynamic";

const BACK = "/admin/carnect/catalog";

/**
 * ⚠️ «Ушла» и «источник не ответил» — РАЗНЫЕ исходы, и разводить их обязательно:
 * то же правило, что у Encar и витрины аукционов. Сказать «продана» про живую
 * машину, пока carnect лежит, — соврать.
 */
function NotOk({ id, gone, parser }: { id: string; gone: boolean; parser: boolean }) {
  return (
    <Page>
      <Link href={BACK} className="text-sm" style={{ color: C.accent }}>
        ← каталог
      </Link>
      <h1 className="mb-4 mt-2 text-xl font-semibold">{id}</h1>
      {gone ? (
        <Panel title="Машина ушла с торгов">
          <p className="text-sm">Источник отдал «не найдено»: продана или снята — что именно, он не говорит.</p>
        </Panel>
      ) : (
        <Panel title={parser ? "Не разобралось" : "Источник не ответил"}>
          <p className="text-sm" style={{ color: C.bad }}>
            {parser
              ? "Страница пришла, но объекта машины в ней нет — сменилась разметка. Чинить detail.ts / heydealer.ts."
              : "Это не значит, что машина ушла; обновите позже."}
          </p>
        </Panel>
      )}
    </Page>
  );
}

export default async function CarnectCarPage({ params }: { params: Promise<{ house: string; lot: string }> }) {
  await requireAdmin();
  const { house, lot: rawLot } = await params;
  // Сегмент приходит закодированным: в lotId бывают "~" и base64.
  const id = decodeURIComponent(rawLot);

  const showInternal = await isServiceHost();
  const t0 = Date.now();
  if (house === "heydealer") {
    const res = await getHeyCar(id);
    const ms = Date.now() - t0;
    if (res.status !== "ok") return <NotOk id={id} gone={res.status === "gone"} parser={res.status === "failed" && res.parser} />;
    return <CarCardView card={fromHey(res.car)} backHref={BACK} meta={{ id, ms, fetchedAt: res.fetchedAt }} showInternal={showInternal} />;
  }

  if (!isHouse(house)) notFound();
  const res = await getLotDetail(house, id);
  const ms = Date.now() - t0;
  if (res.status !== "ok") return <NotOk id={id} gone={res.status === "gone"} parser={res.status === "failed" && res.parser} />;
  return <CarCardView card={fromLot(house, res.lot)} backHref={BACK} meta={{ id, ms, fetchedAt: res.fetchedAt }} showInternal={showInternal} />;
}
