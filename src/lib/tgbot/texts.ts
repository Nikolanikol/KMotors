// Тексты клиентского бота: русский и английский.
//
// Частые вопросы и этапы покупки НЕ пишутся здесь заново — они берутся из словаря
// страницы /buy (`buy.faq`, `buy.steps`). Бот и сайт обязаны говорить одно и то
// же; поменяли условия на сайте — бот подхватит при следующей сборке.
//
// Сроков доставки и цены «под ключ» бот НЕ называет: на сайте их нет в виде
// фактов (сроки зависят от маршрута, растаможку делает покупатель по своей
// стране). Это вопрос менеджеру, а не боту.

import ruCommon from "@/locales/ru/common.json";
import enCommon from "@/locales/en/common.json";

export type BotLang = "ru" | "en";

/** Язык по language_code из Telegram: русскоязычный СНГ — ru, остальные — en. */
export function botLangFrom(code: string | null | undefined): BotLang {
  const c = (code ?? "").toLowerCase().slice(0, 2);
  return ["ru", "uk", "be", "kk", "uz", "ky", "tg", "hy", "az"].includes(c) ? "ru" : "en";
}

export function esc(s: string | null | undefined): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface BuyDict {
  faq: { items: { q: string; a: string }[] };
  steps: Record<string, { title: string; description: string }>;
}

function buy(lang: BotLang): BuyDict {
  return (lang === "ru" ? ruCommon : enCommon).buy as unknown as BuyDict;
}

export function faqItems(lang: BotLang): { q: string; a: string }[] {
  return buy(lang).faq?.items ?? [];
}

/** Этапы покупки одним сообщением: номер, заголовок, суть. */
export function stepsText(lang: BotLang): string {
  const steps = Object.values(buy(lang).steps ?? {});
  const head = lang === "ru" ? "📋 <b>Как проходит покупка</b>" : "📋 <b>How buying works</b>";
  return (
    head +
    "\n\n" +
    steps.map((s, i) => `<b>${i + 1}. ${esc(s.title)}</b>\n${esc(s.description)}`).join("\n\n")
  );
}

export const COUNTRIES: { code: string; ru: string; en: string }[] = [
  { code: "RU", ru: "🇷🇺 Россия", en: "🇷🇺 Russia" },
  { code: "KZ", ru: "🇰🇿 Казахстан", en: "🇰🇿 Kazakhstan" },
  { code: "KG", ru: "🇰🇬 Киргизия", en: "🇰🇬 Kyrgyzstan" },
  { code: "UZ", ru: "🇺🇿 Узбекистан", en: "🇺🇿 Uzbekistan" },
  { code: "GE", ru: "🇬🇪 Грузия", en: "🇬🇪 Georgia" },
  { code: "OT", ru: "🌍 Другая страна", en: "🌍 Other country" },
];

export const TIMEFRAMES: { code: string; ru: string; en: string }[] = [
  { code: "now", ru: "🔥 Готов покупать сейчас", en: "🔥 Ready to buy now" },
  { code: "1m", ru: "📅 В течение месяца", en: "📅 Within a month" },
  { code: "3m", ru: "🗓 В течение 3 месяцев", en: "🗓 Within 3 months" },
  { code: "look", ru: "👀 Пока присматриваюсь", en: "👀 Just looking" },
];

// Вилки бюджета — только для разговора с менеджером, это не цены.
export const BUDGETS: { code: string; ru: string; en: string }[] = [
  { code: "b1", ru: "до 1,5 млн ₽", en: "up to $15,000" },
  { code: "b2", ru: "1,5–2,5 млн ₽", en: "$15,000–25,000" },
  { code: "b3", ru: "2,5–4 млн ₽", en: "$25,000–40,000" },
  { code: "b4", ru: "больше 4 млн ₽", en: "over $40,000" },
];

export function labelOf(list: { code: string; ru: string; en: string }[], code: string | null | undefined, lang: BotLang): string {
  const it = list.find((x) => x.code === code);
  return it ? it[lang] : code ?? "—";
}

const RU = {
  welcome: (name: string) =>
    `👋 Здравствуйте${name ? `, ${esc(name)}` : ""}!\n\n` +
    `Это <b>K-Axis</b> — авто и оригинальные запчасти Hyundai, Kia, Genesis из Кореи напрямую.\n\n` +
    `Выберите, что вас интересует, или просто напишите вопрос — менеджер ответит здесь же.`,
  menuCars: "🚗 Подобрать авто",
  menuParts: "🔧 Запчасти",
  menuFaq: "❓ Частые вопросы",
  menuSteps: "📋 Как проходит покупка",
  menuManager: "💬 Написать менеджеру",
  menuLang: "🌐 English",
  menuCatalog: "🔗 Каталог на сайте",
  back: "⬅️ Меню",
  carsIntro:
    "🚗 <b>Подбор авто из Кореи</b>\n\nОтветьте на три коротких вопроса — менеджер пришлёт подходящие варианты с ценами. Или выберите машину в каталоге и нажмите на ней «Telegram».",
  pickWithManager: "✅ Подобрать с менеджером",
  carPriceNote:
    "Цена — автомобиль в Корее, включая стояночный сбор. Доставка и растаможка считаются отдельно под вашу страну: менеджер сделает расчёт.",
  carMileage: "Пробег",
  carPriceKorea: "Цена в Корее",
  carUnknown: (id: string) =>
    `🚗 Вы смотрели автомобиль <b>№${esc(id)}</b>.\n\nМенеджер проверит, продаётся ли он ещё, и пришлёт расчёт. Чтобы ускорить, ответьте на пару вопросов.`,
  wantCar: "✅ Хочу эту машину",
  askManager: "💬 Вопрос менеджеру",
  openOnSite: "🔗 Открыть на сайте",
  calculator: "🧮 Калькулятор растаможки",
  qCountry: "🌍 Куда везти автомобиль?",
  qBudget: "💰 Какой бюджет?",
  qTimeframe: "⏱ Когда планируете покупку?",
  qDone:
    "✅ <b>Заявка у менеджера.</b>\n\nОтветим здесь, в этом чате, в течение часа (в рабочее время). Если хотите что-то добавить — просто напишите сообщение.",
  partsIntro:
    "🔧 <b>Оригинальные запчасти Hyundai, Kia, Genesis</b>\n\nПришлите <b>номер детали</b> (например <code>26300-35505</code>) — найду цену. Нет номера? Пришлите <b>VIN</b> или <b>фото детали</b>, менеджер подберёт.",
  partFound: "🔧 Нашёл:",
  partPrice: "Цена",
  partPriceNote: "Цена детали без доставки. Доставку менеджер посчитает под ваш адрес.",
  partOrder: "✅ Заказать",
  partAnother: "🔎 Другая деталь",
  partNotFound: (n: string) =>
    `Детали <code>${esc(n)}</code> нет в каталоге сайта, но её можно заказать из Кореи. Передал номер менеджеру — он ответит здесь с ценой.`,
  partOrdered:
    "✅ <b>Заказ передан менеджеру.</b>\n\nОн уточнит доставку и ответит здесь в течение часа (в рабочее время). Можно добавить ещё детали — пришлите номера.",
  vinReceived: "✅ VIN получен. Менеджер подберёт детали и ответит здесь.",
  photoReceived: "✅ Получил. Менеджер посмотрит и ответит здесь.",
  faqTitle: "❓ <b>Частые вопросы</b>\n\nВыберите вопрос:",
  managerPrompt:
    "💬 Напишите ваш вопрос одним сообщением — менеджер ответит здесь, в этом чате.",
  ack: "✅ Сообщение передано менеджеру. Ответим здесь в течение часа (в рабочее время).",
  followup:
    "👋 Вы смотрели у нас автомобиль. Остались вопросы? Менеджер посчитает доставку и растаможку под вашу страну — это бесплатно.",
  followupParts:
    "👋 Вы спрашивали у нас запчасти. Остались вопросы? Менеджер посчитает доставку под ваш адрес.",
  followupContact: "💬 Связаться с менеджером",
  followupNo: "🙅 Неактуально",
  followupNoAck: "Понял, больше не беспокоим. Если понадобится — просто напишите сюда.",
  soldSubscribed:
    "👋 Здравствуйте!\n\nТа машина уже продана. Подписал вас на похожие — как только появится подходящая, бот напишет сюда сам.\n\nХотите обсудить сейчас — просто напишите в этот чат.\n\n<i>Отписаться — команда /stop</i>",
  soldNotSubscribed:
    "👋 Здравствуйте!\n\nТа машина уже продана, но мы подберём похожую. Ответьте на пару вопросов — менеджер пришлёт варианты.",
};

type Texts = typeof RU;

const EN: Texts = {
  welcome: (name: string) =>
    `👋 Hello${name ? `, ${esc(name)}` : ""}!\n\n` +
    `This is <b>K-Axis</b> — cars and genuine Hyundai, Kia, Genesis parts directly from Korea.\n\n` +
    `Choose what you need, or just type your question — a manager will reply right here.`,
  menuCars: "🚗 Find a car",
  menuParts: "🔧 Parts",
  menuFaq: "❓ FAQ",
  menuSteps: "📋 How buying works",
  menuManager: "💬 Message a manager",
  menuLang: "🌐 Русский",
  menuCatalog: "🔗 Catalog on the website",
  back: "⬅️ Menu",
  carsIntro:
    "🚗 <b>Cars from Korea</b>\n\nAnswer three short questions and a manager will send you matching options with prices. Or pick a car in the catalog and tap “Telegram” on it.",
  pickWithManager: "✅ Pick with a manager",
  carPriceNote:
    "Price is for the car in Korea, including the parking fee. Shipping and customs depend on your country — a manager will calculate them.",
  carMileage: "Mileage",
  carPriceKorea: "Price in Korea",
  carUnknown: (id: string) =>
    `🚗 You were looking at car <b>#${esc(id)}</b>.\n\nA manager will check that it is still for sale and send you a quote. Answer a couple of questions to speed things up.`,
  wantCar: "✅ I want this car",
  askManager: "💬 Ask a manager",
  openOnSite: "🔗 Open on the website",
  calculator: "🧮 Customs calculator",
  qCountry: "🌍 Where should we ship the car?",
  qBudget: "💰 What is your budget?",
  qTimeframe: "⏱ When are you planning to buy?",
  qDone:
    "✅ <b>Your request is with a manager.</b>\n\nWe will reply here within an hour (during business hours). Want to add something? Just send a message.",
  partsIntro:
    "🔧 <b>Genuine Hyundai, Kia, Genesis parts</b>\n\nSend a <b>part number</b> (e.g. <code>26300-35505</code>) and I will find the price. No number? Send the <b>VIN</b> or a <b>photo of the part</b> and a manager will find it.",
  partFound: "🔧 Found:",
  partPrice: "Price",
  partPriceNote: "Price of the part without shipping. A manager will calculate shipping to your address.",
  partOrder: "✅ Order",
  partAnother: "🔎 Another part",
  partNotFound: (n: string) =>
    `Part <code>${esc(n)}</code> is not in our website catalog, but it can be ordered from Korea. I passed the number to a manager — they will reply here with a price.`,
  partOrdered:
    "✅ <b>Your order is with a manager.</b>\n\nThey will confirm shipping and reply here within an hour (during business hours). You can add more parts — just send the numbers.",
  vinReceived: "✅ VIN received. A manager will find the parts and reply here.",
  photoReceived: "✅ Received. A manager will take a look and reply here.",
  faqTitle: "❓ <b>FAQ</b>\n\nChoose a question:",
  managerPrompt: "💬 Type your question in one message — a manager will reply right here.",
  ack: "✅ Your message was passed to a manager. We will reply here within an hour (during business hours).",
  followup:
    "👋 You were looking at a car with us. Any questions left? A manager can calculate shipping and customs for your country — free of charge.",
  followupParts:
    "👋 You asked us about parts. Any questions left? A manager can calculate shipping to your address.",
  followupContact: "💬 Contact a manager",
  followupNo: "🙅 Not relevant",
  followupNoAck: "Got it, we won't bother you. If you need anything — just write here.",
  soldSubscribed:
    "👋 Hello!\n\nThat car has already been sold. I subscribed you to similar ones — as soon as a match appears, the bot will message you here.\n\nWant to talk now? Just write in this chat.\n\n<i>Unsubscribe — /stop</i>",
  soldNotSubscribed:
    "👋 Hello!\n\nThat car has already been sold, but we will find a similar one. Answer a couple of questions and a manager will send you options.",
};

export function t(lang: BotLang): Texts {
  return lang === "ru" ? RU : EN;
}
