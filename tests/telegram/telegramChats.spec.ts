import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  posterTarget,
  telegramChatId,
  telegramChatIds,
  type TelegramPurpose,
} from "@/lib/telegramChats";

const CHAT = "TELEGRAM_CHAT_ID";
const WORK = "TELEGRAM_WORK_CHAT_ID";

/** Задаёт обе переменные чатов; undefined — переменной нет вовсе. */
function setEnv(chat: string | undefined, work: string | undefined) {
  for (const [name, v] of [
    [CHAT, chat],
    [WORK, work],
  ] as const) {
    if (v === undefined) vi.stubEnv(name, undefined as unknown as string);
    else vi.stubEnv(name, v);
  }
}

beforeEach(() => {
  setEnv(undefined, undefined);
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("leads и admins: CHAT_ID + WORK_CHAT_ID", () => {
  const purposes: TelegramPurpose[] = ["leads", "admins"];

  it.each(purposes)("%s: оба заданы — оба чата по порядку", (p) => {
    setEnv("100", "200");
    expect(telegramChatIds(p)).toEqual(["100", "200"]);
    expect(telegramChatId(p)).toBe("100");
  });

  it.each(purposes)("%s: только CHAT_ID", (p) => {
    setEnv("100", undefined);
    expect(telegramChatIds(p)).toEqual(["100"]);
    expect(telegramChatId(p)).toBe("100");
  });

  it.each(purposes)("%s: только WORK — основного чата нет, но рассылка идёт в рабочий", (p) => {
    setEnv(undefined, "200");
    expect(telegramChatIds(p)).toEqual(["200"]);
    // /api/telegram раньше отвечал 500 именно при отсутствии CHAT_ID.
    expect(telegramChatId(p)).toBeNull();
  });

  it.each(purposes)("%s: ничего не задано или пусто — пусто", (p) => {
    expect(telegramChatIds(p)).toEqual([]);
    expect(telegramChatId(p)).toBeNull();
    setEnv("", "");
    expect(telegramChatIds(p)).toEqual([]);
    expect(telegramChatId(p)).toBeNull();
  });

  it.each(purposes)("%s: пустой CHAT при заданном WORK не считается", (p) => {
    setEnv("", "200");
    expect(telegramChatIds(p)).toEqual(["200"]);
    expect(telegramChatId(p)).toBeNull();
  });
});

describe("orders: WORK_CHAT_ID ?? CHAT_ID", () => {
  it("WORK задан — берётся он, CHAT игнорируется", () => {
    setEnv("100", "200");
    expect(telegramChatId("orders")).toBe("200");
    expect(telegramChatIds("orders")).toEqual(["200"]);
  });

  it("WORK не задан — фолбэк на CHAT", () => {
    setEnv("100", undefined);
    expect(telegramChatId("orders")).toBe("100");
  });

  it("WORK задан ПУСТЫМ — на CHAT не уступает (?? , а не ||): чата нет", () => {
    setEnv("100", "");
    expect(telegramChatId("orders")).toBeNull();
    expect(telegramChatIds("orders")).toEqual([]);
  });

  it("только WORK", () => {
    setEnv(undefined, "200");
    expect(telegramChatId("orders")).toBe("200");
  });

  it("ничего не задано — null", () => {
    expect(telegramChatId("orders")).toBeNull();
  });
});

describe("seo и blog: только CHAT_ID", () => {
  const purposes: TelegramPurpose[] = ["seo", "blog"];

  it.each(purposes)("%s: берётся CHAT, WORK игнорируется", (p) => {
    setEnv("100", "200");
    expect(telegramChatId(p)).toBe("100");
    expect(telegramChatIds(p)).toEqual(["100"]);
  });

  it.each(purposes)("%s: нет CHAT — null, даже если WORK задан (фолбэка нет)", (p) => {
    setEnv(undefined, "200");
    expect(telegramChatId(p)).toBeNull();
    expect(telegramChatIds(p)).toEqual([]);
    setEnv("", "200");
    expect(telegramChatId(p)).toBeNull();
  });
});

describe("ops: только WORK_CHAT_ID", () => {
  it("WORK задан — он", () => {
    setEnv("100", "200");
    expect(telegramChatId("ops")).toBe("200");
    expect(telegramChatIds("ops")).toEqual(["200"]);
  });

  it("нет WORK — null, на CHAT не падает", () => {
    setEnv("100", undefined);
    expect(telegramChatId("ops")).toBeNull();
    expect(telegramChatIds("ops")).toEqual([]);
    setEnv("100", "");
    expect(telegramChatId("ops")).toBeNull();
  });
});

describe("чтение в момент вызова, не при загрузке модуля", () => {
  it("смена окружения между вызовами видна сразу", () => {
    setEnv("100", undefined);
    expect(telegramChatId("blog")).toBe("100");
    setEnv("111", undefined);
    expect(telegramChatId("blog")).toBe("111");
    setEnv(undefined, "222");
    expect(telegramChatId("ops")).toBe("222");
  });
});

describe("posterTarget", () => {
  const VARS = ["TELEGRAM_GROUP_ID", "TELEGRAM_CARS_TOPIC_ID", "TELEGRAM_PARTS_TOPIC_ID"];
  const clear = () => VARS.forEach((v) => vi.stubEnv(v, undefined as unknown as string));

  it("без переменных — боевые дефолты: группа, тема 150 (авто) и 151 (запчасти)", () => {
    clear();
    expect(posterTarget("cars")).toEqual({ chatId: "-1003659575794", threadId: 150 });
    expect(posterTarget("parts")).toEqual({ chatId: "-1003659575794", threadId: 151 });
  });

  it("переменные перекрывают дефолты; тема — числом", () => {
    clear();
    vi.stubEnv("TELEGRAM_GROUP_ID", "-100777");
    vi.stubEnv("TELEGRAM_CARS_TOPIC_ID", "5");
    vi.stubEnv("TELEGRAM_PARTS_TOPIC_ID", "6");
    expect(posterTarget("cars")).toEqual({ chatId: "-100777", threadId: 5 });
    expect(posterTarget("parts")).toEqual({ chatId: "-100777", threadId: 6 });
  });

  it("пустые строки дают дефолт (||, как было)", () => {
    vi.stubEnv("TELEGRAM_GROUP_ID", "");
    vi.stubEnv("TELEGRAM_CARS_TOPIC_ID", "");
    vi.stubEnv("TELEGRAM_PARTS_TOPIC_ID", "");
    expect(posterTarget("cars")).toEqual({ chatId: "-1003659575794", threadId: 150 });
    expect(posterTarget("parts")).toEqual({ chatId: "-1003659575794", threadId: 151 });
  });

  it("темы независимы: смена одной не трогает другую", () => {
    clear();
    vi.stubEnv("TELEGRAM_CARS_TOPIC_ID", "9");
    expect(posterTarget("cars").threadId).toBe(9);
    expect(posterTarget("parts").threadId).toBe(151);
  });

  it("не-число в теме — NaN, как у прежнего Number() (не «исправлено»)", () => {
    clear();
    vi.stubEnv("TELEGRAM_CARS_TOPIC_ID", "abc");
    expect(posterTarget("cars").threadId).toBeNaN();
  });
});
