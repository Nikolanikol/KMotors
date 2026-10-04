// Машина по адресу страницы → единая карточка. Одно место для трёх
// потребителей: страница машины на витрине, она же в админке и ручка
// служебной панели (/api/carnect/internal). Разойтись им не с чего.
//
// Исходы те же, что у cached.ts: ok / gone / failed — и «failed» не
// кешируется там же. null — адрес не про машину (неизвестная площадка).

import { fromHey, fromLot, type CarCard } from "./card";
import { getHeyCar, getLotDetail } from "./cached";
import { isHouse } from "./houses";
import type { CardLang } from "./lang";

export type CardResult =
  | { status: "ok"; card: CarCard; fetchedAt?: string }
  | { status: "gone" }
  | { status: "failed"; parser: boolean };

export async function loadCard(house: string, id: string, lang: CardLang): Promise<CardResult | null> {
  if (house === "heydealer") {
    const res = await getHeyCar(id);
    return res.status === "ok" ? { status: "ok", card: fromHey(res.car, lang), fetchedAt: res.fetchedAt } : res;
  }
  if (!isHouse(house)) return null;
  const res = await getLotDetail(house, id);
  return res.status === "ok" ? { status: "ok", card: fromLot(house, res.lot, lang), fetchedAt: res.fetchedAt } : res;
}
