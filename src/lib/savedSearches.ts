// Подписки «пришлите похожие» (sql/036_saved_searches.sql).
//
// Человек нажал кнопку на странице проданной машины — мы запоминаем, ЧТО он
// искал, и раз в сутки сами пишем ему в Telegram, когда подходящее появилось
// у Encar. Смысл в том, что на проданную карточку приходят именно за тем,
// чего сейчас НЕТ в наличии: без подписки такой лид просто остывает.
//
// Как и carsSeen, модуль не бросает исключений: подписка не должна ломать ни
// ответ вебхука, ни прогон крона по остальным подписчикам.

import { createServerClient } from "@/lib/supabase";
import { getCars } from "@/components/Catalog/Row/utils/service";
import { normalizeBrand } from "@/lib/carLabels";
import { buildSimilarQuery } from "@/lib/similarCars";
import type { CarSnapshot } from "@/lib/carsSeen";

export interface SavedSearch {
  id: number;
  chat_id: number;
  source_car_id: string | null;
  lang: string;
  query: string;
  title: string | null;
  seen_ids: string[];
  last_sent_at: string | null;
}

/** Не даём seen_ids расти бесконечно: держим только последние N наблюдений. */
const SEEN_CAP = 400;
/**
 * Сколько машин тянуть на подписку — И ПРИ СОЗДАНИИ, И В КРОНЕ.
 *
 * ⚠️ Числа обязаны совпадать. Если засеять подписку шестью машинами, а крон
 * будет забирать шестьдесят, то на первом же прогоне пятьдесят четыре давно
 * висящих объявления окажутся «не виденными» и уедут человеку как новинки.
 * Поэтому константа одна и живёт здесь, а не в маршруте крона.
 */
export const FETCH_LIMIT = 60;
/** Не чаще одного сообщения в сутки на человека. */
export const SEND_COOLDOWN_MS = 24 * 60 * 60 * 1000;
/** Не больше пяти машин в сообщении. */
export const MAX_CARS_PER_MESSAGE = 5;

/** Читаемое имя машины для текста сообщений. Только английские поля: если их
 *  нет (снимок из бэкфилла), лучше пусто, чем хангыль. */
export function snapshotTitle(s: CarSnapshot): string {
  return [
    normalizeBrand(s.manufacturer_en),
    s.model_group_en,
    s.year ? String(s.year) : null,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

/**
 * Создаёт (или обновляет) подписку по снимку проданной машины.
 *
 * Засев seen_ids делается здесь же и тем же запросом, что потом делает крон:
 * всё, что подходит под запрос ПРЯМО СЕЙЧАС, сразу считается виденным. Иначе
 * первый прогон объявил бы новинками весь текущий рынок.
 *
 * Возвращает true, если подписка сохранена.
 */
export async function saveSubscription(opts: {
  chatId: number;
  snapshot: CarSnapshot;
  lang?: string;
}): Promise<boolean> {
  const query = buildSimilarQuery(opts.snapshot);
  if (!query) return false;

  // getCars не бросает исключений: при недоступности Encar вернёт failed.
  const { data, failed } = await getCars(query, "0", FETCH_LIMIT);
  // Апстрим лежит — подписку не создаём. Пустой засев привёл бы к тому, что
  // на первом же прогоне человек получил бы «новинки», которые висят месяц.
  if (failed) {
    console.error("[savedSearches] Encar недоступен, подписку не создаём");
    return false;
  }
  const seedIds = data.map((c) => String(c?.Id)).filter(Boolean);

  try {
    const { error } = await createServerClient()
      .from("saved_searches")
      .upsert(
        {
          chat_id: opts.chatId,
          source_car_id: opts.snapshot.encar_id,
          lang: opts.lang ?? "ru",
          query,
          title: snapshotTitle(opts.snapshot) || null,
          seen_ids: seedIds.slice(0, SEEN_CAP),
          active: true,
        },
        { onConflict: "chat_id,query" }
      );
    if (error) {
      console.error("[savedSearches] не удалось сохранить подписку:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[savedSearches] сохранение упало:", (e as Error)?.message);
    return false;
  }
}

/** Активные подписки, которым сегодня ещё не писали. */
export async function listDueSubscriptions(): Promise<SavedSearch[]> {
  try {
    const cutoff = new Date(Date.now() - SEND_COOLDOWN_MS).toISOString();
    const { data, error } = await createServerClient()
      .from("saved_searches")
      .select("id, chat_id, source_car_id, lang, query, title, seen_ids, last_sent_at")
      .eq("active", true)
      .or(`last_sent_at.is.null,last_sent_at.lt.${cutoff}`)
      .order("last_sent_at", { ascending: true, nullsFirst: true })
      .order("id", { ascending: true });
    if (error) {
      console.error("[savedSearches] выборка подписок не прошла:", error.message);
      return [];
    }
    return (data as SavedSearch[]) ?? [];
  } catch (e) {
    console.error("[savedSearches] выборка упала:", (e as Error)?.message);
    return [];
  }
}

/** После отправки: запоминаем показанные Id и время. */
export async function markSent(id: number, seenIds: string[]): Promise<void> {
  await patch(id, {
    seen_ids: seenIds.slice(-SEEN_CAP),
    last_sent_at: new Date().toISOString(),
    last_checked_at: new Date().toISOString(),
  });
}

/** Новинок не нашлось — фиксируем только факт проверки. */
export async function markChecked(id: number): Promise<void> {
  await patch(id, { last_checked_at: new Date().toISOString() });
}

/**
 * Отписка по кнопке под сообщением. chat_id проверяется в самом запросе —
 * callback_data приходит от клиента, и без этой сверки любой желающий мог бы
 * отписать чужую подписку, подставив произвольный id.
 */
export async function deactivateOwn(id: number, chatId: number): Promise<boolean> {
  try {
    const { data, error } = await createServerClient()
      .from("saved_searches")
      .update({ active: false })
      .eq("id", id)
      .eq("chat_id", chatId)
      .eq("active", true)
      .select("id");
    if (error) {
      console.error("[savedSearches] отписка не прошла:", error.message);
      return false;
    }
    return (data?.length ?? 0) > 0;
  } catch (e) {
    console.error("[savedSearches] отписка упала:", (e as Error)?.message);
    return false;
  }
}

/** Отписать все подписки чата — команда /stop. Возвращает их число. */
export async function deactivateAllForChat(chatId: number): Promise<number> {
  try {
    const { data, error } = await createServerClient()
      .from("saved_searches")
      .update({ active: false })
      .eq("chat_id", chatId)
      .eq("active", true)
      .select("id");
    if (error) {
      console.error("[savedSearches] массовая отписка не прошла:", error.message);
      return 0;
    }
    return data?.length ?? 0;
  } catch (e) {
    console.error("[savedSearches] массовая отписка упала:", (e as Error)?.message);
    return 0;
  }
}

async function patch(id: number, fields: Record<string, unknown>): Promise<boolean> {
  try {
    const { error } = await createServerClient()
      .from("saved_searches")
      .update(fields)
      .eq("id", id);
    if (error) {
      console.error("[savedSearches] обновление не прошло:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[savedSearches] обновление упало:", (e as Error)?.message);
    return false;
  }
}
