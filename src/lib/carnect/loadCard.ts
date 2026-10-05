// Машина по адресу страницы → единая карточка. Одно место для трёх
// потребителей: страница машины на витрине, она же в админке и ручка
// служебной панели (/api/carnect/internal). Разойтись им не с чего.
//
// Исходы те же, что у cached.ts: ok / gone / failed — и «failed» не
// кешируется там же. null — адрес не про машину (неизвестная площадка).

import { cache } from "react";

import { fromHey, fromLot, type CarCard } from "./card";
import { getHeyCar, getLotDetail } from "./cached";
import { isHouse } from "./houses";
import type { CardLang } from "./lang";

export type CardResult =
  | { status: "ok"; card: CarCard; fetchedAt?: string }
  | { status: "gone" }
  | { status: "failed"; parser: boolean };

/**
 * ⚠️ Обёрнуто в React cache: страница лота и её generateMetadata зовут
 * loadCard с одними аргументами ПАРАЛЛЕЛЬНО. unstable_cache (cached.ts)
 * одновременные промахи не склеивает — на холодном кеше к carnect уходило два
 * одинаковых запроса, второй ещё и ждал очередь (client.ts). cache() отдаёт
 * обоим вызовам один промис в пределах одного запроса посетителя.
 */
export const loadCard = cache(loadCardUncached);

async function loadCardUncached(house: string, id: string, lang: CardLang): Promise<CardResult | null> {
  if (house === "heydealer") {
    const res = await getHeyCar(id);
    return res.status === "ok" ? { status: "ok", card: fromHey(res.car, lang), fetchedAt: res.fetchedAt } : res;
  }
  if (!isHouse(house)) return null;
  const res = await getLotDetail(house, id);
  return res.status === "ok" ? { status: "ok", card: fromLot(house, res.lot, lang), fetchedAt: res.fetchedAt } : res;
}
