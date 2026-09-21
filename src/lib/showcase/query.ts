// Чтение деталей лота Lotte — по требованию, с кешем.
//
// Почему не храним в базе: детали живут на чужой странице, которую всё равно
// надо открыть; массовый обход 1401 лота с паузой — это час работы ради
// карточек, которые в основном никто не откроет. Дешевле сходить за деталью в
// момент показа и запомнить на час.
//
// ⚠️ Кеш ОБЯЗАТЕЛЕН, а не «для скорости»: без него каждое обновление страницы
// било бы по чужому серверу. Тот же принцип, что у нас с Encar и KB.

import { unstable_cache } from "next/cache";

import { createServerClient } from "@/lib/supabase";
import type { LotRow } from "@/lib/kcar/query";
import { fetchDetail, type ShowcaseDetail } from "./scrape";

/** Ровно то, что рисует плитка похожего лота. */
const SIMILAR_COLUMNS =
  "source, external_id, maker, model, mileage_km, start_price_krw, thumb_url, year";

const cached = unstable_cache(
  async (externalId: string): Promise<ShowcaseDetail> => {
    const detail = await fetchDetail(externalId);
    // ⚠️ НЕУДАЧУ НЕ КЕШИРУЕМ. unstable_cache запоминает то, что функция
    // вернула, — а значит запомнил бы и null от сбойного запроса или от
    // парсера, который в тот момент был сломан. Ровно так и вышло 21.09.2026:
    // карточка SK час показывала одну миниатюру вместо тридцати фото уже
    // ПОСЛЕ починки разбора. Брошенное исключение в кеш не попадает; наружу
    // его гасит try/catch в getShowcaseDetail.
    if (!detail) throw new Error(`showcase: лот ${externalId} не разобрался`);
    return detail;
  },
  // ⚠️ В ключе стоит ВЕРСИЯ формы. Поменяли состав ShowcaseDetail — поднимите её,
  // иначе кеш будет отдавать объекты прежней формы до истечения часа, и новые
  // поля окажутся пустыми при полностью исправном парсере. На этом уже
  // потерялось время 12.09.2026.
  ["showcase-lot-detail-v5"],
  { revalidate: 3600, tags: ["showcase-lot-detail"] },
);

/** Никогда не бросает: витрина чужая, страница лота важнее её доступности. */
export async function getShowcaseDetail(externalId: string): Promise<ShowcaseDetail | null> {
  try {
    return await cached(externalId);
  } catch (e) {
    console.error("[lotte] getShowcaseDetail:", e);
    return null;
  }
}

/**
 * Похожие лоты — из НАШЕЙ базы, а не с витрины.
 *
 * У площадки этот блок сравнивает лот с машинами другого раздела: на лоте за
 * $9 857 там висит розничная Kia K7 за $74 478 и подпись «$64,621 pricier».
 * Сравнение лота с не-лотом бесполезно, поэтому берём ту же площадку и тот же
 * бренд, а близость считаем по цене.
 *
 * ⚠️ Порядок добора — по цене, но выборка потом пересортировывается по
 * МОДУЛЮ разницы: PostgREST не умеет сортировать по выражению, а «ближайшие
 * по цене» — это именно модуль. Отсюда запас в выборке и досортировка на
 * своей стороне.
 */
export async function getSimilarLots(opts: {
  /** Похожие ищем ВНУТРИ площадки: цены и механика торгов у них разные. */
  source: string;
  externalId: string;
  maker: string | null;
  priceKrw: number | null;
  limit?: number;
}): Promise<LotRow[]> {
  const { source, externalId, maker, priceKrw, limit = 6 } = opts;
  if (!maker || !priceKrw) return [];

  try {
    const { data, error } = await createServerClient()
      .from("auction_lots")
      .select(SIMILAR_COLUMNS)
      .eq("source", source)
      .eq("maker", maker)
      .neq("external_id", externalId)
      .gte("start_price_krw", Math.round(priceKrw * 0.5))
      .lte("start_price_krw", Math.round(priceKrw * 1.8))
      .order("start_price_krw")
      .order("external_id")
      .limit(60);

    if (error) {
      console.error("[lotte] getSimilarLots:", error.message);
      return [];
    }
    return ((data ?? []) as unknown as LotRow[])
      .sort((a, b) => Math.abs((a.start_price_krw ?? 0) - priceKrw) - Math.abs((b.start_price_krw ?? 0) - priceKrw))
      .slice(0, limit);
  } catch (e) {
    console.error("[lotte] getSimilarLots упал:", e);
    return [];
  }
}
