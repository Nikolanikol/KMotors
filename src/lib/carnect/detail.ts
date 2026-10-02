// Страница одного лота: /lot/<house>/<lotId>.
//
// Здесь то, ради чего carnect вообще нужен: VIN, лист осмотра узлов, арест и
// залог, сканы техпаспорта и акта (Autobell), акт осмотра и окрашенные панели
// (K Car), полная галерея. В списке этого нет.
//
// ⚠️ ТОЛЬКО ПО ТРЕБОВАНИЮ, когда человек открыл лот у нас, — и с кешем уровнем
// выше. Массовый обход деталей — это ~4 000 запросов за проход ради карточек,
// которые почти никто не откроет; именно такой трафик и замечают. Полоса
// "interactive" в client.ts рассчитана на поток посетителей, а не на обход.
//
// ⚠️ Кеш ставить с ВЕРСИЕЙ формы в ключе (как showcase-lot-detail-v6): сменим
// состав полей — без новой версии кеш час отдаёт объекты прежней формы.
// ⚠️ Кешировать только ok и gone. failed — временный, его кешировать нельзя:
// сайт полежит минуту, а мы час показывали бы «деталей нет» при живом лоте.

import { getPage } from "./client";
import type { CarnectHouse } from "./houses";
import { decodeFlight, isObject, pick } from "./rsc";
import type { CarnectLotDetail } from "./types";

export type LotDetailResult =
  | { status: "ok"; lot: CarnectLotDetail }
  /** Лот ушёл с витрины: продан или снят — что именно, мы не знаем. */
  | { status: "gone" }
  /**
   * Сайт не отдал страницу, либо отдал, но объект лота не разобрался.
   * `parser: true` — второе: страница есть, формы нет. Это поломка у нас,
   * в логах её надо отличать от «сайт лежит».
   */
  | { status: "failed"; parser: boolean };

/** Объект лота: тот самый, чей lotId мы запрашивали, а не похожий из блока рядом. */
const isLotFor = (lotId: string) => (v: unknown): v is CarnectLotDetail =>
  isObject(v) && v.lotId === lotId;

export async function fetchLotDetail(
  house: CarnectHouse,
  lotId: string,
  signal?: AbortSignal,
): Promise<LotDetailResult> {
  // ⚠️ encodeURIComponent обязателен: в id бывают "~" (Lotte, SK) и base64 с
  // "+" и "/" (Autobell: carId "KWw95KJ+q4BNNgaIpODYPg=="). У самого lotId
  // Autobell "/" заменён на "-", но полагаться на это нельзя.
  const res = await getPage(`/lot/${house}/${encodeURIComponent(lotId)}`, "interactive", signal);
  if (res.kind === "gone") return { status: "gone" };
  if (res.kind === "failed") return { status: "failed", parser: false };

  const lot = pick(decodeFlight(res.html), "lot", isLotFor(lotId));
  if (!lot) {
    console.error(`[carnect] ${house}/${lotId}: объект lot не найден — сменилась разметка?`);
    return { status: "failed", parser: true };
  }
  return { status: "ok", lot };
}
