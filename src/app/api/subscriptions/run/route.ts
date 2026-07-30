// Рассылка подписок «пришлите похожие»: раз в сутки проверяем, не появилось ли
// у Encar машин под сохранённый запрос, и пишем подписчику в Telegram.
//
// Расписание живёт на VPS (scripts/subscriptions-cron.sh), а НЕ в vercel.json:
// прод крутится на Coolify/VPS, краны Vercel там не исполняются — эта ошибка
// уже стоила месяца молчащего блога.

import { NextRequest, NextResponse } from "next/server";
import { getCars } from "@/components/Catalog/Row/utils/service";
import { fetchVehicleData } from "@/lib/vehicle";
import { normalizeBrand } from "@/lib/carLabels";
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
const WORK_CHAT_ID = process.env.TELEGRAM_WORK_CHAT_ID;

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
/** Машина-кандидат вместе с уже загруженной карточкой — чтобы не ходить дважды. */
interface Candidate {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listing: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detail: any;
}

/**
 * Карточка машины, если объявление подано ПОСЛЕ момента подписки, иначе null.
 *
 * manage.firstAdvertisedDateTime — дата подачи, единственный надёжный признак
 * новизны. Не путать с ModifiedDate из листинга: та обновляется при каждом
 * переподнятии объявления дилером.
 *
 * Даты Encar отдаёт без зоны ("2026-06-14T14:30:10"), время корейское (UTC+9).
 * Разбираем явно, иначе Date.parse трактует их как UTC и даёт сдвиг в 9 часов —
 * достаточно, чтобы вчерашняя машина выглядела завтрашней.
 *
 * Карточку возвращаем целиком: из неё же берутся английские названия для
 * текста сообщения (в листинге их нет вовсе).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function detailIfNew(id: string, since: number): Promise<any | null> {
  try {
    const data = await fetchVehicleData(id);
    const raw = data?.manage?.firstAdvertisedDateTime;
    if (typeof raw !== "string" || !raw) return null;
    const listed = Date.parse(`${raw}+09:00`);
    if (!Number.isFinite(listed) || listed <= since) return null;
    return data;
  } catch {
    // Карточка не открылась (машину уже сняли, апстрим моргнул) — молчим.
    // Ложное «новая» дороже пропущенной машины: от спама отписываются.
    return null;
  }
}

interface SendResult {
  chatId: number;
  sent: number;
}

/**
 * Служебный отчёт о прогоне в рабочий чат.
 *
 * ⚠️ ВРЕМЕННО, НА ПЕРИОД ТЕСТОВ, снять вместе с пятиминутным расписанием и
 * тестовым SEND_COOLDOWN_MS.
 *
 * Зачем вообще: подписчику при отсутствии новинок не уходит НИЧЕГО — это штатно,
 * но снаружи неотличимо от мёртвого крона. Отчёт делает тишину наблюдаемой, не
 * трогая то, что видит клиент.
 *
 * Уходит в рабочий чат, а не подписчику. Не бросает исключений и не влияет на
 * результат прогона: упавший отчёт не должен ронять рассылку.
 */
async function reportToWorkChat(lines: string[]): Promise<void> {
  if (!WORK_CHAT_ID) return;
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Без parse_mode: текст служебный, разметки в нём нет, а любой случайный
      // спецсимвол в HTML-режиме уронил бы отправку целиком.
      body: JSON.stringify({
        chat_id: WORK_CHAT_ID,
        text: lines.join("\n"),
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json();
    if (!data.ok) console.error("[subscriptions] отчёт не ушёл:", JSON.stringify(data));
  } catch (e) {
    console.error("[subscriptions] отчёт упал:", (e as Error)?.message);
  }
}

// В HTML-разметке Telegram активны три символа; имена приходят от Encar,
// то есть это чужие данные, и экранировать их обязательно.
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function carLine(c: Candidate, krwToUsd: number): string {
  const cat = c.detail?.category ?? {};
  // ⚠️ Только английские имена. Листинг Encar отдаёт корейские
  // («쉐보레(GM대우) 올 뉴 말리부»), и первая же живая рассылка ушла на хангыле.
  // На сайте это лечит translateGenerationRow, но у него нужен i18next, а здесь
  // его нет — зато в карточке лежат готовые английские поля. Марку прогоняем
  // через normalizeBrand: Encar склеивает её (ChevroletGMDaewoo).
  const name =
    [
      normalizeBrand(cat.manufacturerEnglishName),
      cat.modelGroupEnglishName,
      cat.gradeEnglishName,
      cat.formYear ? String(cat.formYear) : null,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() || `Автомобиль ${c.id}`;

  const krw = Number(c.detail?.advertisement?.price) * 10000;
  const mileageRaw = Number(c.detail?.spec?.mileage ?? c.listing?.Mileage);
  const mileage = Number.isFinite(mileageRaw)
    ? ` · ${mileageRaw.toLocaleString("ru-RU")} км`
    : "";
  const price = Number.isFinite(krw)
    ? ` — ${krw.toLocaleString("ru-RU")} ₩ (≈ $${Math.round(krw * krwToUsd).toLocaleString("en-US")})`
    : "";
  return `• <a href="${SITE}/ru/catalog/${c.id}?utm_source=telegram_bot&utm_medium=bot&utm_campaign=subscription">${esc(name)}</a>${mileage}${price}`;
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
    // Ноль подписок к проверке — не то же самое, что ноль новинок: сюда попадают
    // и отписавшиеся, и те, кого отсёк кулдаун. Именно так выглядел пропуск
    // 30.07.2026, и по логу это было не отличить от «ничего не нашлось».
    if (!dryRun) {
      await reportToWorkChat([
        "🔁 Подписки: прогон вхолостую",
        "К проверке никого — все либо неактивны, либо ещё в кулдауне.",
      ]);
    }
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
  let failedQueries = 0;

  for (const [query, group] of byQuery) {
    const { data, failed } = await getCars(query, "0", FETCH_LIMIT);
    // Апстрим не ответил — НЕ трогаем ни seen_ids, ни last_sent_at, иначе
    // авария Encar молча съела бы новинки: они попали бы в «уже виденные»
    // без единого отправленного сообщения.
    if (failed) {
      failedQueries++;
      continue;
    }

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
      const fresh: Candidate[] = [];
      for (const c of candidates.slice(0, MAX_DETAIL_CHECKS)) {
        const detail = await detailIfNew(String(c.Id), subscribedAt);
        if (detail) fresh.push({ id: String(c.Id), listing: c, detail });
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
        ? `🚗 Появились похожие на <b>${esc(sub.title)}</b>`
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

  const cars = results.reduce((n, r) => n + r.sent, 0);

  if (!dryRun) {
    await reportToWorkChat([
      results.length > 0 ? "✅ Подписки: разослано" : "🔁 Подписки: новинок нет",
      `Проверено подписок: ${checked}`,
      `Запросов к Encar: ${byQuery.size}${
        failedQueries > 0 ? ` (не ответил на ${failedQueries})` : ""
      }`,
      `Отправлено сообщений: ${results.length}`,
      `Машин в них: ${cars}`,
    ]);
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    subscriptions: checked,
    queries: byQuery.size,
    failedQueries,
    messages: results.length,
    cars,
  });
}
