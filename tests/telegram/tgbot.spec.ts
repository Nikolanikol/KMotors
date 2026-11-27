import { describe, expect, it } from "vitest";
import { decide, isQuietForManagers, isGoodTimeForClients } from "@/lib/tgbot/reminders";
import { normalizePartNumber } from "@/lib/tgbot/partNumber";
import { botLangFrom } from "@/lib/tgbot/texts";
import type { BotClient } from "@/lib/tgbot/store";

// 2026-11-27 07:00 UTC = 16:00 KST, 10:00 MSK — день для всех.
const DAY = new Date("2026-11-27T07:00:00Z");
const ago = (min: number, from = DAY) => new Date(from.getTime() - min * 60_000).toISOString();

function client(p: Partial<BotClient> = {}): BotClient {
  return {
    chat_id: 1, first_name: "Иван", last_name: null, username: null, lang: "ru", source: null,
    car_id: null, car_name: null, part_number: null, country: null, budget: null, timeframe: null,
    step: null, topic_id: 10, header_message_id: 11, status: "new", taken_by: null, blocked: false,
    created_at: ago(120), updated_at: ago(1), last_client_msg_at: null, last_manager_msg_at: null,
    ack_at: null, manager_reminded_at: null, offered_at: null, followup_sent_at: null,
    ...p,
  };
}

describe("напоминание менеджеру", () => {
  it("клиент ждёт 31 минуту без ответа — напомнить", () => {
    expect(decide(client({ last_client_msg_at: ago(31) }), DAY).remindManager).toBe(true);
  });

  it("ждёт 20 минут — рано", () => {
    expect(decide(client({ last_client_msg_at: ago(20) }), DAY).remindManager).toBe(false);
  });

  it("менеджер ответил после клиента — не напоминать", () => {
    expect(decide(client({ last_client_msg_at: ago(60), last_manager_msg_at: ago(50) }), DAY).remindManager).toBe(false);
  });

  it("уже напомнили после этого сообщения — второй раз не дёргать", () => {
    expect(decide(client({ last_client_msg_at: ago(60), manager_reminded_at: ago(25) }), DAY).remindManager).toBe(false);
  });

  it("клиент написал снова после напоминания — новое напоминание", () => {
    expect(decide(client({ last_client_msg_at: ago(40), manager_reminded_at: ago(90) }), DAY).remindManager).toBe(true);
  });

  it("сообщение старше суток — не ждёт, не дёргаем", () => {
    expect(decide(client({ last_client_msg_at: ago(25 * 60) }), DAY).remindManager).toBe(false);
  });

  it("закрытая заявка и заблокировавший бота — тишина", () => {
    expect(decide(client({ last_client_msg_at: ago(60), status: "deal" }), DAY).remindManager).toBe(false);
    expect(decide(client({ last_client_msg_at: ago(60), blocked: true }), DAY).remindManager).toBe(false);
  });

  it("ночь по Корее — молчим до утра", () => {
    const night = new Date("2026-11-27T16:00:00Z"); // 01:00 KST
    expect(isQuietForManagers(night)).toBe(true);
    expect(decide(client({ last_client_msg_at: ago(60, night) }), night).remindManager).toBe(false);
  });
});

describe("дожим клиенту", () => {
  it("сутки после карточки, клиент молчит, менеджер не писал — один дожим", () => {
    expect(decide(client({ offered_at: ago(25 * 60), last_client_msg_at: ago(25 * 60) }), DAY).followup).toBe(true);
  });

  it("меньше суток — рано", () => {
    expect(decide(client({ offered_at: ago(20 * 60), last_client_msg_at: ago(20 * 60) }), DAY).followup).toBe(false);
  });

  it("уже отправляли — больше никогда", () => {
    expect(decide(client({ offered_at: ago(48 * 60), followup_sent_at: ago(24 * 60) }), DAY).followup).toBe(false);
  });

  it("клиент писал после карточки — живой диалог, бот не лезет", () => {
    expect(decide(client({ offered_at: ago(30 * 60), last_client_msg_at: ago(26 * 60) }), DAY).followup).toBe(false);
  });

  it("менеджер уже общался — бот не лезет", () => {
    expect(decide(client({ offered_at: ago(30 * 60), last_manager_msg_at: ago(29 * 60) }), DAY).followup).toBe(false);
  });

  it("позже недели — не пишем", () => {
    expect(decide(client({ offered_at: ago(8 * 24 * 60) }), DAY).followup).toBe(false);
  });

  it("ночь по Москве — не пишем клиенту", () => {
    const night = new Date("2026-11-27T22:00:00Z"); // 01:00 MSK
    expect(isGoodTimeForClients(night)).toBe(false);
    expect(decide(client({ offered_at: ago(25 * 60, night) }), night).followup).toBe(false);
  });
});

describe("номер детали", () => {
  it.each([
    ["26300-35505", "2630035505"],
    ["2630035505", "2630035505"],
    [" 86511 d9000 ", "86511D9000"],
    ["58101-2PA70", "581012PA70"],
  ])("%s → %s", (raw, flat) => {
    expect(normalizePartNumber(raw)).toBe(flat);
  });

  it.each(["привет", "HELLO WORLD", "Kia Sportage", "12345", "KMHJ381ABMU123456"])("не номер: %s", (raw) => {
    expect(normalizePartNumber(raw)).toBeNull();
  });
});

describe("язык бота", () => {
  it("русскоязычный СНГ — ru, остальные и пустой код — en", () => {
    expect(botLangFrom("ru")).toBe("ru");
    expect(botLangFrom("kk")).toBe("ru");
    expect(botLangFrom("uz")).toBe("ru");
    expect(botLangFrom("en-US")).toBe("en");
    expect(botLangFrom("ka")).toBe("en");
    expect(botLangFrom(undefined)).toBe("en");
  });
});
