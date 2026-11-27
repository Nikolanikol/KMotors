// Единственное место, где выбирается чат Telegram.
//
// Клиент `src/lib/telegram.ts` механический и чат не выбирает. КУДА слать — решается
// здесь, по назначению. Вызывающий код имя переменной окружения чата не читает и не
// знает: он просит чат по назначению и сам решает, что делать, если чата нет
// (молча выйти, залогировать, вернуть 500 — как и раньше).
//
// Чаты РАЗНЫЕ, сливать их нельзя. Несколько назначений читают одну переменную —
// это сохранено намеренно (см. таблицу), а не забыто.
//
// Все переменные читаются В МОМЕНТ ВЫЗОВА, не при загрузке модуля.
// Пустая строка в окружении считается «не задано» (как и в прежнем коде, где везде
// стояла проверка на истинность). Единственная тонкость — «orders»: там фолбэк `??`,
// то есть заданный, но ПУСТОЙ TELEGRAM_WORK_CHAT_ID НЕ уступает место TELEGRAM_CHAT_ID
// (чата не будет, отправка пропускается). Так было в обоих роутах заказов.
//
//   назначение | кто зовёт                                     | чаты (по порядку)
//   -----------|------------------------------------------------|--------------------------
//   leads      | /api/telegram, signupNotify                    | CHAT_ID + WORK_CHAT_ID
//   admins     | /api/telegram-webhook (доступ, уведомления)    | CHAT_ID + WORK_CHAT_ID
//   orders     | (никто: /api/parts/checkout и PayPal удалены)  | WORK_CHAT_ID ?? CHAT_ID
//   seo        | seo-telegram (дайджест SEO-гейта)              | CHAT_ID
//   blog       | /api/blog-generate, /api/rss-sync              | CHAT_ID
//   ops        | carnect/notify, /api/subscriptions/run         | WORK_CHAT_ID
//   poster     | poster/run, poster/parts — см. posterTarget    | GROUP_ID (+ тема), с дефолтами

export type TelegramPurpose = "leads" | "admins" | "orders" | "seo" | "blog" | "ops";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v ? v : undefined;
}

/** Все чаты назначения, по порядку, без незаданных. Пусто — чат не настроен. */
export function telegramChatIds(purpose: TelegramPurpose): string[] {
  switch (purpose) {
    case "leads":
    case "admins":
      return [env("TELEGRAM_CHAT_ID"), env("TELEGRAM_WORK_CHAT_ID")].filter(Boolean) as string[];
    case "orders": {
      // `??`, не `||`: заданный пустой WORK не отдаёт место CHAT (поведение сохранено).
      const raw = process.env.TELEGRAM_WORK_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID;
      return raw ? [raw] : [];
    }
    case "seo":
    case "blog":
      return [env("TELEGRAM_CHAT_ID")].filter(Boolean) as string[];
    case "ops":
      return [env("TELEGRAM_WORK_CHAT_ID")].filter(Boolean) as string[];
  }
}

/**
 * Основной чат назначения или null, если он не задан.
 * Для «leads» и «admins» это TELEGRAM_CHAT_ID, а не первый из `telegramChatIds`:
 * именно его отсутствие раньше давало 500 в /api/telegram, а рабочий чат без
 * основного «основным» не становится.
 */
export function telegramChatId(purpose: TelegramPurpose): string | null {
  if (purpose === "leads" || purpose === "admins") return env("TELEGRAM_CHAT_ID") ?? null;
  return telegramChatIds(purpose)[0] ?? null;
}

export interface PosterTarget {
  chatId: string;
  /** message_thread_id темы форум-группы. */
  threadId: number;
}

/**
 * Группа и тема автопостера. Дефолты зашиты (боевая форум-группа «Авто из Кореи |
 * Mobis | OEM»: тема 150 «Автомобили», 151 «Запчасти»), переменные их перекрывают.
 * `||` как и раньше: пустая строка тоже даёт дефолт; `Number()` без проверки, как было.
 */
export function posterTarget(kind: "cars" | "parts"): PosterTarget {
  const chatId = process.env.TELEGRAM_GROUP_ID || "-1003659575794";
  const threadId =
    kind === "cars"
      ? Number(process.env.TELEGRAM_CARS_TOPIC_ID || "150")
      : Number(process.env.TELEGRAM_PARTS_TOPIC_ID || "151");
  return { chatId, threadId };
}
