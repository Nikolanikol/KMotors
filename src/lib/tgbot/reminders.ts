// Напоминания: менеджеру — о клиенте, который ждёт ответа; клиенту — один «дожим»
// через сутки молчания после карточки с ценой. Зовёт крон /api/bot/reminders.
//
// Решение «кому что слать» — чистая функция `decide` (tests/telegram/tgbotReminders.spec.ts),
// отправка — `runReminders`.

import type { BotClient } from "./store";

export const MANAGER_WAIT_MS = 30 * 60 * 1000;        // клиент ждёт 30 минут — напомнить
export const MANAGER_STALE_MS = 24 * 3600 * 1000;      // старше суток — уже не «ждёт», не дёргаем
export const FOLLOWUP_AFTER_MS = 24 * 3600 * 1000;     // дожим через сутки после карточки
export const FOLLOWUP_MAX_MS = 7 * 24 * 3600 * 1000;   // позже недели — не пишем вовсе
const CLIENT_GRACE_MS = 10 * 60 * 1000;                // сообщения сразу после карточки — часть того же захода

const ms = (iso: string | null | undefined) => (iso ? Date.parse(iso) : NaN);

/** Ночь по Корее (23:00–08:00 KST): менеджеров не будим, напомним утром. */
export function isQuietForManagers(now: Date): boolean {
  const h = (now.getUTCHours() + 9) % 24;
  return h >= 23 || h < 8;
}

/** Клиентам пишем днём по Москве (09:00–21:00 MSK): большинство клиентов в РФ и СНГ. */
export function isGoodTimeForClients(now: Date): boolean {
  const h = (now.getUTCHours() + 3) % 24;
  return h >= 9 && h < 21;
}

/** Нерабочее время по Корее: ночь (23:00–08:00 KST) или суббота/воскресенье KST. */
export function isOffHours(now: Date): boolean {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  const day = kst.getUTCDay(); // 0 — воскресенье, 6 — суббота
  return isQuietForManagers(now) || day === 0 || day === 6;
}

export interface Decision {
  remindManager: boolean;
  followup: boolean;
  /** Автоответ клиенту «нерабочее время, ответим утром» — без цифр, решение владельца 28.11.2026. */
  offhoursAck: boolean;
}

export function decide(c: BotClient, now: Date): Decision {
  const t = now.getTime();
  const open = (c.status === "new" || c.status === "in_work") && !c.blocked;
  if (!open) return { remindManager: false, followup: false, offhoursAck: false };

  const lastClient = ms(c.last_client_msg_at);
  const lastManager = ms(c.last_manager_msg_at);
  const reminded = ms(c.manager_reminded_at);
  const offered = ms(c.offered_at);

  const unanswered = !Number.isNaN(lastClient) && (Number.isNaN(lastManager) || lastManager < lastClient);
  const remindManager =
    unanswered &&
    t - lastClient >= MANAGER_WAIT_MS &&
    t - lastClient < MANAGER_STALE_MS &&
    // Одно напоминание на каждое новое сообщение клиента, не каждые 10 минут.
    (Number.isNaN(reminded) || reminded < lastClient) &&
    !isQuietForManagers(now);

  const followup =
    !Number.isNaN(offered) &&
    !c.followup_sent_at &&
    t - offered >= FOLLOWUP_AFTER_MS &&
    t - offered < FOLLOWUP_MAX_MS &&
    // Клиент после карточки молчит…
    (Number.isNaN(lastClient) || lastClient <= offered + CLIENT_GRACE_MS) &&
    // …и менеджер с ним ещё не разговаривал — иначе это уже живой диалог, бот не лезет.
    (Number.isNaN(lastManager) || lastManager < offered) &&
    isGoodTimeForClients(now);

  const offAcked = ms(c.offhours_ack_at);
  const offhoursAck =
    unanswered &&
    t - lastClient >= MANAGER_WAIT_MS &&
    t - lastClient < MANAGER_STALE_MS &&
    (Number.isNaN(offAcked) || offAcked < lastClient) &&
    isOffHours(now);

  return { remindManager, followup, offhoursAck };
}
