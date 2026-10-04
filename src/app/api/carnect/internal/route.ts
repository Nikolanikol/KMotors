// Данные служебной панели страницы машины — только для служебного хоста.
//
// Витринная страница кешируется и от хоста не зависит, поэтому служебное
// (сканы, ставки, сырые поля) приходит сюда отдельным запросом из
// InternalPanelLoader. На www — 404, как будто ручки нет.
//
// ⚠️ Защита здесь та же, что у служебного хоста вообще: Cloudflare Access на
// входе и проверка Host. Host подделывается запросом прямо на IP сервера —
// закрывается файрволом VPS (пускать на 80/443 только Cloudflare), см.
// src/lib/serviceHost.ts.

import { NextResponse, type NextRequest } from "next/server";

import { loadCard } from "@/lib/carnect/loadCard";
import { isServiceHost } from "@/lib/serviceHost";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(req: NextRequest) {
  if (!(await isServiceHost())) return new NextResponse(null, { status: 404, headers: NO_STORE });

  const house = req.nextUrl.searchParams.get("house") ?? "";
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "id" }, { status: 400, headers: NO_STORE });

  const t0 = Date.now();
  // Служебное читаем мы — карточка по-русски, как в админке.
  const res = await loadCard(house, id, "ru");
  if (!res) return NextResponse.json({ error: "house" }, { status: 400, headers: NO_STORE });
  if (res.status !== "ok") return NextResponse.json({ error: res.status }, { status: 502, headers: NO_STORE });
  return NextResponse.json(
    { card: res.card, meta: { id, ms: Date.now() - t0, fetchedAt: res.fetchedAt } },
    { headers: NO_STORE },
  );
}
