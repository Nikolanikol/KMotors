// Сторона клиента: /start, меню, карточка машины, вопросы кнопками, запчасти.
//
// Правило бота: цены считает КОД сайта, а не текст. Машина — снимок из
// cars_seen + carPriceKrw (со стояночным сбором) + курс KB (`getFx("car")`), то
// есть ровно то, что клиент видел на карточке. Деталь — parts_products +
// pricing.ts + рыночный курс. Encar бот не дёргает вовсе: снимок уже в базе.
//
// Любое сообщение клиента копируется менеджеру (relayFromClient) — что бы бот
// ни ответил сам. Потерять сообщение хуже, чем ответить дважды.

import { SITE_URL } from "@/lib/site";
import { createServerClient } from "@/lib/supabase";
import { getCarSnapshot, type CarSnapshot } from "@/lib/carsSeen";
import { normalizeBrand } from "@/lib/carLabels";
import { carPriceKrw } from "@/lib/carPricing";
import { getFx } from "@/lib/fx";
import { formatUsd } from "@/lib/pricing";
import { saveSubscription } from "@/lib/savedSearches";
import { send, edit, answerCallback, tg, type Keyboard } from "./api";
import { normalizePartNumber } from "./partNumber";
import { getClient, upsertClient, updateClient, logMessage, type BotClient } from "./store";
import { notifyManagers, relayFromClient, refreshHeader, ensureTopic } from "./inbox";
import {
  t, botLangFrom, esc, faqItems, stepsText, labelOf,
  COUNTRIES, BUDGETS, TIMEFRAMES, type BotLang,
} from "./texts";

export interface TgUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

const PHOTO_CDN = "https://ci.encar.com";
const ACK_EVERY_MS = 30 * 60 * 1000;

function site(lang: BotLang, path: string): string {
  return `${SITE_URL}/${lang}${path}?utm_source=telegram_bot&utm_medium=bot`;
}

/** Клиент из апдейта: имя и username обновляем всегда, язык — только новому. */
async function touchClient(from: TgUser, patch: Partial<BotClient> = {}): Promise<BotClient> {
  const prev = await getClient(from.id);
  return upsertClient(from.id, {
    first_name: from.first_name ?? null,
    last_name: from.last_name ?? null,
    username: from.username ?? null,
    lang: prev?.lang ?? botLangFrom(from.language_code),
    ...patch,
  });
}

// ── Клавиатуры ───────────────────────────────────────────────────────────────

function menuKeyboard(lang: BotLang): Keyboard {
  const x = t(lang);
  return [
    [{ text: x.menuCars, callback_data: "b:cars" }, { text: x.menuParts, callback_data: "b:parts" }],
    [{ text: x.menuFaq, callback_data: "b:faq" }, { text: x.menuSteps, callback_data: "b:steps" }],
    [{ text: x.menuManager, callback_data: "b:mgr" }],
    [{ text: x.menuCatalog, url: site(lang, "/catalog") }, { text: x.menuLang, callback_data: "b:lang" }],
  ];
}

const backRow = (lang: BotLang) => [{ text: t(lang).back, callback_data: "b:menu" }];

function choiceKeyboard(list: { code: string; ru: string; en: string }[], prefix: string, lang: BotLang): Keyboard {
  const rows: Keyboard = [];
  for (let i = 0; i < list.length; i += 2) {
    rows.push(list.slice(i, i + 2).map((it) => ({ text: it[lang], callback_data: `${prefix}:${it.code}` })));
  }
  return rows;
}

async function sendMenu(c: BotClient, name?: string): Promise<void> {
  await send(c.chat_id, t(c.lang).welcome(name ?? c.first_name ?? ""), menuKeyboard(c.lang));
}

// ── Машина ───────────────────────────────────────────────────────────────────

function carTitle(s: CarSnapshot): string {
  return [normalizeBrand(s.manufacturer_en), s.model_group_en, s.grade_en, s.year ? String(s.year) : null]
    .filter(Boolean)
    .join(" ");
}

async function carPriceLine(s: CarSnapshot, lang: BotLang): Promise<string | null> {
  if (!s.price_manwon) return null;
  const krw = carPriceKrw(s.price_manwon);
  if (krw <= 0) return null;
  const { krwToRub, krwToUsd } = await getFx("car");
  const rub = Math.round(krw * krwToRub).toLocaleString("ru-RU");
  const usd = Math.round(krw * krwToUsd).toLocaleString("en-US");
  return lang === "ru"
    ? `${krw.toLocaleString("ru-RU")} ₩ ≈ <b>${rub} ₽</b> ($${usd})`
    : `${krw.toLocaleString("en-US")} KRW ≈ <b>$${usd}</b>`;
}

async function sendCarCard(c: BotClient, carId: string, snap: CarSnapshot | null): Promise<void> {
  const x = t(c.lang);
  const kb: Keyboard = [
    [{ text: x.wantCar, callback_data: "b:want" }],
    [{ text: x.askManager, callback_data: "b:mgr" }, { text: x.menuSteps, callback_data: "b:steps" }],
    [{ text: x.openOnSite, url: site(c.lang, `/catalog/${encodeURIComponent(carId)}`) }],
    [{ text: x.calculator, url: site(c.lang, "/calculator") }],
  ];

  if (!snap) {
    await send(c.chat_id, x.carUnknown(carId), kb);
    return;
  }

  const price = await carPriceLine(snap, c.lang);
  const lines = [`🚗 <b>${esc(carTitle(snap))}</b>`];
  if (snap.mileage) lines.push(`${x.carMileage}: ${snap.mileage.toLocaleString(c.lang === "ru" ? "ru-RU" : "en-US")} km`);
  if (price) lines.push(`${x.carPriceKorea}: ${price}`);
  lines.push("", `<i>${x.carPriceNote}</i>`);
  const text = lines.join("\n");

  const photo = snap.photo_path ? (snap.photo_path.startsWith("http") ? snap.photo_path : PHOTO_CDN + snap.photo_path) : null;
  if (photo) {
    const r = await tg("sendPhoto", {
      chat_id: c.chat_id, photo, caption: text, parse_mode: "HTML", reply_markup: { inline_keyboard: kb },
    });
    if (r.ok) return;
  }
  await send(c.chat_id, text, kb);
}

// ── /start ───────────────────────────────────────────────────────────────────

/** Параметры deep-link: car_<id>, sold_<id>, part_<номер>, website или пусто. */
export async function handleStart(from: TgUser, param: string): Promise<void> {
  const carId = param.startsWith("car_") ? param.slice(4) : null;
  const soldId = param.startsWith("sold_") ? param.slice(5) : null;
  const partNo = param.startsWith("part_") ? param.slice(5) : null;
  const now = new Date().toISOString();

  if (carId || soldId) {
    const id = (carId ?? soldId)!;
    const snap = await getCarSnapshot(id);
    const c = await touchClient(from, {
      source: param, car_id: id, car_name: snap ? carTitle(snap) : null,
      last_client_msg_at: now, offered_at: carId ? now : null, followup_sent_at: null,
    });

    if (soldId) {
      // Подписка «пришлём похожие»: логика прежняя (savedSearches).
      const subscribed = snap ? await saveSubscription({ chatId: from.id, snapshot: snap }) : false;
      await send(c.chat_id, subscribed ? t(c.lang).soldSubscribed : t(c.lang).soldNotSubscribed);
      if (!subscribed) await askCountry(c);
      await notifyManagers(
        c,
        `🔔 <b>Хочет похожую на проданную</b>\n${subscribed ? "🔁 Подписан на похожие — бот напишет сам" : "⚠️ Подписку оформить не удалось — нужен ручной подбор"}`,
      );
      return;
    }

    await sendCarCard(c, id, snap);
    await notifyManagers(c, `🚗 <b>Открыл карточку машины в боте</b>\nЕщё не нажал «Хочу» — ждём ответов на вопросы.`);
    return;
  }

  if (partNo) {
    const c = await touchClient(from, { source: param, part_number: partNo, last_client_msg_at: now });
    await lookupPart(c, partNo);
    return;
  }

  const c = await touchClient(from, { source: param || null, last_client_msg_at: now });
  await sendMenu(c, from.first_name);
  await ensureTopic(c);
}

// ── Вопросы по машине ────────────────────────────────────────────────────────

async function askCountry(c: BotClient): Promise<void> {
  await send(c.chat_id, t(c.lang).qCountry, choiceKeyboard(COUNTRIES, "b:c", c.lang));
}

async function finishQualification(c: BotClient): Promise<void> {
  await send(c.chat_id, t(c.lang).qDone, [backRow(c.lang)]);
  await refreshHeader(c);
  await notifyManagers(
    c,
    `🔥 <b>Заявка заполнена</b>\n` +
      [
        c.car_name && `🚗 ${esc(c.car_name)}`,
        c.country && `🌍 ${labelOf(COUNTRIES, c.country, "ru")}`,
        c.budget && `💰 ${labelOf(BUDGETS, c.budget, "ru")}`,
        c.timeframe && `⏱ ${labelOf(TIMEFRAMES, c.timeframe, "ru")}`,
      ].filter(Boolean).join("\n"),
  );
  await saveLead(c, "Заявка из бота: " + [c.country, c.budget && labelOf(BUDGETS, c.budget, "ru"), c.timeframe && labelOf(TIMEFRAMES, c.timeframe, "ru")].filter(Boolean).join(", "));
}

/** Строка в leads — чтобы заявка из бота была в админке рядом с заявками с сайта. */
async function saveLead(c: BotClient, message: string): Promise<void> {
  try {
    const { error } = await createServerClient().from("leads").insert({
      name: [c.first_name, c.last_name].filter(Boolean).join(" ") || "Telegram",
      // У leads телефон NOT NULL; из бота его нет — пустая строка, как у регистраций.
      phone: "",
      message,
      source_page: "tg_bot",
      car_id: c.car_id,
      car_name: c.car_name,
      messenger: "telegram",
      vin: null,
      tg_username: c.username ? `@${c.username}` : null,
      site: "kmotors",
    });
    if (error) console.error("[tgbot] запись в leads:", error.message);
  } catch (e) {
    console.error("[tgbot] запись в leads упала:", (e as Error)?.message);
  }
}

// ── Запчасти ─────────────────────────────────────────────────────────────────

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;

interface PartRow {
  id: number;
  part_number: string;
  name_ru: string | null;
  name_en: string | null;
  price_krw: number | null;
}

async function findPart(flat: string): Promise<PartRow | null> {
  // В базе номер может лежать и с дефисом, и без — ищем оба написания.
  const variants = [flat, `${flat.slice(0, 5)}-${flat.slice(5)}`];
  try {
    const { data, error } = await createServerClient()
      .from("parts_products")
      .select("id, part_number, name_ru, name_en, price_krw")
      .in("part_number", variants)
      .gt("price_krw", 0)
      .order("id")
      .limit(1);
    if (error) console.error("[tgbot] поиск детали:", error.message);
    return (data?.[0] as PartRow | undefined) ?? null;
  } catch (e) {
    console.error("[tgbot] поиск детали упал:", (e as Error)?.message);
    return null;
  }
}

async function partById(id: number): Promise<PartRow | null> {
  if (!Number.isFinite(id)) return null;
  try {
    const { data } = await createServerClient()
      .from("parts_products")
      .select("id, part_number, name_ru, name_en, price_krw")
      .eq("id", id)
      .maybeSingle();
    return (data as PartRow | null) ?? null;
  } catch {
    return null;
  }
}

async function lookupPart(c: BotClient, raw: string): Promise<void> {
  const x = t(c.lang);
  const flat = normalizePartNumber(raw) ?? raw.trim().toUpperCase();
  const part = await findPart(flat);
  await updateClient(c.chat_id, { part_number: part?.part_number ?? flat, offered_at: new Date().toISOString(), followup_sent_at: null });

  if (!part || !part.price_krw) {
    await send(c.chat_id, x.partNotFound(flat), [[{ text: x.partAnother, callback_data: "b:parts" }], backRow(c.lang)]);
    await notifyManagers({ ...c, part_number: flat }, `🔧 <b>Ищет деталь, которой нет в каталоге:</b> <code>${esc(flat)}</code>`);
    return;
  }

  const { krwToUsd } = await getFx("market");
  const name = (c.lang === "ru" ? part.name_ru || part.name_en : part.name_en || part.name_ru) ?? "";
  const text =
    `${x.partFound} <b>${esc(name)}</b>\n<code>${esc(part.part_number)}</code>\n\n` +
    `${x.partPrice}: <b>${formatUsd(part.price_krw, krwToUsd)}</b>\n\n<i>${x.partPriceNote}</i>`;
  await send(c.chat_id, text, [
    [{ text: x.partOrder, callback_data: `b:po:${part.id}` }, { text: x.partAnother, callback_data: "b:parts" }],
    [{ text: x.openOnSite, url: site(c.lang, `/parts/${encodeURIComponent(part.part_number)}`) }],
    backRow(c.lang),
  ]);
  await notifyManagers({ ...c, part_number: part.part_number }, `🔧 Смотрит деталь <code>${esc(part.part_number)}</code> — ${esc(part.name_ru ?? part.name_en ?? "")}, ${formatUsd(part.price_krw, krwToUsd)}`);
}

// ── Сообщения клиента ────────────────────────────────────────────────────────

export interface ClientMessage {
  message_id: number;
  text?: string;
  caption?: string;
  photo?: unknown;
  document?: unknown;
  from?: TgUser;
  chat: { id: number };
}

export async function handleClientMessage(m: ClientMessage): Promise<void> {
  if (!m.from) return;
  const now = new Date().toISOString();
  const c = await touchClient(m.from, { last_client_msg_at: now });

  // Сначала — менеджеру. Что бы ни случилось дальше, сообщение уже у него.
  await relayFromClient(c, m.message_id);

  const text = (m.text ?? "").trim();
  const x = t(c.lang);
  await logMessage(
    c.chat_id,
    "client",
    text || [m.photo ? "[фото]" : m.document ? "[файл]" : "[вложение]", (m.caption ?? "").trim()].filter(Boolean).join(" "),
  );

  const asPart = text ? normalizePartNumber(text) : null;
  if (asPart) {
    await updateClient(c.chat_id, { step: null });
    await lookupPart(c, asPart);
    return;
  }
  if (text && VIN_RE.test(text.toUpperCase().replace(/\s/g, ""))) {
    await send(c.chat_id, x.vinReceived, [backRow(c.lang)]);
    return;
  }
  if (c.step === "await_part" && (m.photo || m.document)) {
    await updateClient(c.chat_id, { step: null });
    await send(c.chat_id, x.photoReceived, [backRow(c.lang)]);
    return;
  }

  // Обычный вопрос: подтверждаем, что передали, но не чаще раза в 30 минут.
  if (!c.ack_at || Date.now() - Date.parse(c.ack_at) > ACK_EVERY_MS) {
    await send(c.chat_id, x.ack);
    await updateClient(c.chat_id, { ack_at: now });
  }
}

// ── Кнопки клиента ───────────────────────────────────────────────────────────

export interface ClientCallback {
  id: string;
  data: string;
  from: TgUser;
  message?: { message_id: number; chat?: { id: number } };
}

export async function handleClientCallback(cb: ClientCallback): Promise<void> {
  await answerCallback(cb.id);
  const c = await touchClient(cb.from);
  const x = t(c.lang);
  const [, action, arg] = cb.data.split(":");

  switch (action) {
    case "menu":
      await sendMenu(c);
      return;

    case "lang": {
      const lang: BotLang = c.lang === "ru" ? "en" : "ru";
      await updateClient(c.chat_id, { lang });
      // Перерисовываем то же сообщение меню на другом языке.
      if (cb.message?.message_id) {
        await edit(c.chat_id, cb.message.message_id, t(lang).welcome(c.first_name ?? ""), menuKeyboard(lang));
      } else {
        await sendMenu({ ...c, lang });
      }
      return;
    }

    case "cars":
      await send(c.chat_id, x.carsIntro, [
        [{ text: x.pickWithManager, callback_data: "b:pick" }],
        [{ text: x.menuCatalog, url: site(c.lang, "/catalog") }],
        backRow(c.lang),
      ]);
      return;

    case "want":
      await updateClient(c.chat_id, { country: null, budget: null, timeframe: null });
      await askCountry(c);
      return;

    case "pick": // подбор без конкретной машины: прежняя машина из прошлого захода не в счёт
      await updateClient(c.chat_id, { car_id: null, car_name: null, country: null, budget: null, timeframe: null });
      await askCountry({ ...c, car_id: null });
      return;

    case "c": // страна
      await updateClient(c.chat_id, { country: arg });
      // Машина уже выбрана — бюджет не спрашиваем, он известен по цене.
      if (c.car_id) {
        await send(c.chat_id, x.qTimeframe, choiceKeyboard(TIMEFRAMES, "b:t", c.lang));
      } else {
        await send(c.chat_id, x.qBudget, choiceKeyboard(BUDGETS, "b:b", c.lang));
      }
      return;

    case "b": // бюджет
      await updateClient(c.chat_id, { budget: arg });
      await send(c.chat_id, x.qTimeframe, choiceKeyboard(TIMEFRAMES, "b:t", c.lang));
      return;

    case "t": { // сроки — последний вопрос
      await updateClient(c.chat_id, { timeframe: arg });
      const fresh = (await getClient(c.chat_id)) ?? { ...c, timeframe: arg };
      await finishQualification(fresh);
      return;
    }

    case "parts":
      await updateClient(c.chat_id, { step: "await_part" });
      await send(c.chat_id, x.partsIntro, [backRow(c.lang)]);
      return;

    case "po": { // заказать деталь
      const data = await partById(Number(arg));
      const pn = data?.part_number ?? c.part_number ?? "";
      await send(c.chat_id, x.partOrdered, [[{ text: x.partAnother, callback_data: "b:parts" }], backRow(c.lang)]);
      await notifyManagers({ ...c, part_number: pn }, `🛒 <b>Хочет заказать деталь</b> <code>${esc(pn)}</code> — ${esc(data?.name_ru ?? data?.name_en ?? "")}`);
      await saveLead({ ...c, part_number: pn }, `Заказ детали из бота: ${pn}`);
      return;
    }

    case "faq": {
      const items = faqItems(c.lang);
      await send(c.chat_id, x.faqTitle, [
        ...items.map((it, i) => [{ text: it.q.slice(0, 60), callback_data: `b:f:${i}` }]),
        backRow(c.lang),
      ]);
      return;
    }

    case "f": {
      const it = faqItems(c.lang)[Number(arg)];
      if (!it) return;
      await send(c.chat_id, `❓ <b>${esc(it.q)}</b>\n\n${esc(it.a)}`, [
        [{ text: x.askManager, callback_data: "b:mgr" }, { text: x.menuFaq, callback_data: "b:faq" }],
        backRow(c.lang),
      ]);
      return;
    }

    case "steps":
      await send(c.chat_id, stepsText(c.lang), [[{ text: x.askManager, callback_data: "b:mgr" }], backRow(c.lang)]);
      return;

    case "mgr":
      await updateClient(c.chat_id, { step: null });
      await send(c.chat_id, x.managerPrompt);
      await ensureTopic(c);
      return;

    case "fno": // «неактуально» под дожимом
      await updateClient(c.chat_id, { status: "lost" });
      await send(c.chat_id, x.followupNoAck);
      await refreshHeader({ ...c, status: "lost" });
      await notifyManagers(c, "🙅 Клиент ответил на дожим: <b>неактуально</b>. Статус — отказ.");
      return;
  }
}
