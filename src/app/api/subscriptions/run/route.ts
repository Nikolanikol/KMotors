// Рассылка подписок «пришлите похожие»: раз в сутки проверяем, не появилось ли
// у Encar машин под сохранённый запрос, и пишем подписчику в Telegram.
//
// Расписание живёт на VPS (scripts/subscriptions-cron.sh), а НЕ в vercel.json:
// прод крутится на Coolify/VPS, краны Vercel там не исполняются — эта ошибка
// уже стоила месяца молчащего блога.

import { NextRequest, NextResponse } from "next/server";
import { getCars } from "@/components/Catalog/Row/utils/service";
import { fetchVehicleData } from "@/lib/vehicle";
import {
  FETCH_LIMIT,
  listDueSubscriptions,
  markChecked,
  markSent,
  MAX_CARS_PER_MESSAGE,
  type SavedSearch,
} from "@/lib/savedSearches";
import { getCurrencyRates } from "@/utils/getCurrencyRates";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kmotors.shop";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Потолок проверок карточек на одну подписку за прогон. Кандидатов обычно
// единицы; потолок нужен на случай, когда выдача Encar перетасовалась целиком —
// чтобы один прогон не превратился в сотни запросов к карточкам.
const MAX_DETAIL_CHECKS = 20;

/**
 * Объявление подано ПОСЛЕ момента подписки?
 *
 * manage.firstAdvertisedDateTime — дата подачи, единственный надёжный признак
 * новизны. Не путать с ModifiedDate из листинга: та обновляется при каждом
 * переподнятии объявления дилером.
 *
 * Даты Encar отдаёт без зоны ("2026-06-14T14:30:10"), время корейское (UTC+9).
 * Разбираем явно, иначе Date.parse трактует их как UTC и даёт сдвиг в 9 часов —
 * достаточно, чтобы вчерашняя машина выглядела завтрашней.
 */
async function isListedAfter(id: string, since: number): Promise<boolean> {
  try {
    const data = await fetchVehicleData(id);
    const raw = data?.manage?.firstAdvertisedDateTime;
    if (typeof raw !== "string" || !raw) return false;
    const listed = Date.parse(`${raw}+09:00`);
    if (!Number.isFinite(listed)) return false;
    return listed > since;
  } catch {
    // Карточка не открылась (машину уже сняли, апстрим моргнул) — молчим.
    // Ложное «новая» дороже пропущенной машины: от спама отписываются.
    return false;
  }
}

interface SendResult {
  chatId: number;
  sent: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function carLine(car: any, krwToUsd: number): string {
  const krw = Number(car?.Price) * 10000;
  const name = [car?.Manufacturer, car?.Model, car?.Badge].filter(Boolean).join(" ");
  const year = car?.FormYear ? ` ${car.FormYear}` : "";
  const mileage = car?.Mileage ? ` · ${Number(car.Mileage).toLocaleString("ru-RU")} км` : "";
  const price = Number.isFinite(krw)
    ? ` — ${krw.toLocaleString("ru-RU")} ₩ (≈ $${Math.round(krw * krwToUsd).toLocaleString("en-US")})`
    : "";
  return `• <a href="${SITE}/ru/catalog/${car.Id}?utm_source=telegram_bot&utm_medium=bot&utm_campaign=subscription">${name}${year}</a>${mileage}${price}`;
}

async function sendToChat(chatId: number, text: string, subId: number) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[{ text: "Отписаться", callback_data: `unsub:${subId}` }]],
      },
    }),
  });
  const data = await res.json();
  if (!data.ok) console.error("[subscriptions] sendMessage:", JSON.stringify(data));
  return !!data.ok;
}

export async function GET(req: NextRequest) {
  // Fail-closed, как у /api/rss-sync и /api/poster/run: нет переменной — 401,
  // а не молча открытый роут.
  const secret = process.env.POSTER_CRON_SECRET;
  if (!secret || req.headers.get("x-poster-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = new URL(req.url).searchParams.get("dry") === "1";

  const subs = await listDueSubscriptions();
  if (subs.length === 0) {
    return NextResponse.json({ ok: true, subscriptions: 0, sent: 0 });
  }

  // Одинаковые запросы тянем из Encar ОДИН раз и раздаём веером: подписки на
  // популярные модели совпадают дословно, и без этого мы били бы по Encar
  // столько раз, сколько людей подписалось на одно и то же.
  const byQuery = new Map<string, SavedSearch[]>();
  for (const s of subs) {
    const list = byQuery.get(s.query) ?? [];
    list.push(s);
    byQuery.set(s.query, list);
  }

  const { krwToUsd } = await getCurrencyRates();
  const results: SendResult[] = [];
  let checked = 0;

  for (const [query, group] of byQuery) {
    const { data, failed } = await getCars(query, "0", FETCH_LIMIT);
    // Апстрим не ответил — НЕ трогаем ни seen_ids, ни last_sent_at, иначе
    // авария Encar молча съела бы новинки: они попали бы в «уже виденные»
    // без единого отправленного сообщения.
    if (failed) continue;

    const ids = data.map((c) => String(c?.Id)).filter(Boolean);

    for (const sub of group) {
      checked++;
      const seen = new Set(sub.seen_ids ?? []);
      const candidates = data.filter((c) => c?.Id && !seen.has(String(c.Id)));

      // ⚠️ «Нет в seen_ids» ещё НЕ значит «новая машина», и на этом тест
      // провалился при первой же проверке. Выдача Encar сортируется по
      // ModifiedDate и пересобирается, а мы забираем только верхние FETCH_LIMIT
      // из выборки, которая может быть в разы больше (замер: 373 совпадения при
      // окне в 60). Старое объявление свободно вплывает в окно и выглядит новым
      // — так в тесте «новинкой» оказалась машина, поданная полтора месяца назад.
      //
      // Настоящий признак — manage.firstAdvertisedDateTime из карточки: дата
      // подачи объявления. Проверяем ей каждого кандидата и оставляем только
      // тех, кто появился уже после оформления подписки. Кандидатов единицы,
      // так что лишних запросов почти нет.
      const subscribedAt = Date.parse(sub.created_at);
      const fresh: typeof candidates = [];
      for (const c of candidates.slice(0, MAX_DETAIL_CHECKS)) {
        if (await isListedAfter(String(c.Id), subscribedAt)) fresh.push(c);
      }

      if (fresh.length === 0) {
        // seen_ids пополняем и здесь: кандидаты проверены и оказались старыми,
        // повторно дёргать по ним карточки незачем.
        if (!dryRun) await markChecked(sub.id, [...(sub.seen_ids ?? []), ...ids]);
        continue;
      }

      const show = fresh.slice(0, MAX_CARS_PER_MESSAGE);
      const more = fresh.length - show.length;
      const header = sub.title
        ? `🚗 Появились похожие на <b>${sub.title}</b>`
        : `🚗 Появились подходящие машины`;
      const text =
        `${header}\n\n` +
        show.map((c) => carLine(c, krwToUsd)).join("\n") +
        (more > 0 ? `\n\n…и ещё ${more} — <a href="${SITE}/ru/catalog">весь каталог</a>` : "");

      if (dryRun) {
        results.push({ chatId: sub.chat_id, sent: show.length });
        continue;
      }

      const ok = await sendToChat(sub.chat_id, text, sub.id);
      if (ok) {
        // seen_ids пополняем ТОЛЬКО после удачной отправки — иначе сбой
        // Telegram означал бы, что машины считаются показанными, хотя человек
        // их не видел.
        await markSent(sub.id, [...(sub.seen_ids ?? []), ...ids]);
        results.push({ chatId: sub.chat_id, sent: show.length });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    subscriptions: checked,
    queries: byQuery.size,
    messages: results.length,
    cars: results.reduce((n, r) => n + r.sent, 0),
  });
}
