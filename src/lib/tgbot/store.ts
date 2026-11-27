// Таблица tg_bot_clients (sql/047_tg_bot_clients.sql). Никогда не бросает:
// сбой базы не должен мешать боту ответить клиенту и переслать сообщение.

import { createServerClient } from "@/lib/supabase";
import type { BotLang } from "./texts";

export type BotStatus = "new" | "in_work" | "deal" | "lost";

export interface BotClient {
  chat_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  lang: BotLang;
  source: string | null;
  car_id: string | null;
  car_name: string | null;
  part_number: string | null;
  country: string | null;
  budget: string | null;
  timeframe: string | null;
  step: string | null;
  topic_id: number | null;
  header_message_id: number | null;
  status: BotStatus;
  taken_by: string | null;
  blocked: boolean;
  created_at: string;
  updated_at: string;
  last_client_msg_at: string | null;
  last_manager_msg_at: string | null;
  ack_at: string | null;
  manager_reminded_at: string | null;
  offered_at: string | null;
  followup_sent_at: string | null;
}

const TABLE = "tg_bot_clients";

export async function getClient(chatId: number): Promise<BotClient | null> {
  try {
    const { data, error } = await createServerClient().from(TABLE).select("*").eq("chat_id", chatId).maybeSingle();
    if (error) console.error("[tgbot] чтение клиента:", error.message);
    return (data as BotClient | null) ?? null;
  } catch (e) {
    console.error("[tgbot] чтение клиента упало:", (e as Error)?.message);
    return null;
  }
}

export async function getClientByTopic(topicId: number): Promise<BotClient | null> {
  try {
    const { data, error } = await createServerClient().from(TABLE).select("*").eq("topic_id", topicId).maybeSingle();
    if (error) console.error("[tgbot] клиент по теме:", error.message);
    return (data as BotClient | null) ?? null;
  } catch (e) {
    console.error("[tgbot] клиент по теме упал:", (e as Error)?.message);
    return null;
  }
}

/**
 * Создаёт или обновляет клиента и возвращает свежую строку. Если база не ответила —
 * возвращает «виртуального» клиента из переданных полей: бот продолжит разговор,
 * просто без памяти.
 */
export async function upsertClient(chatId: number, patch: Partial<BotClient>): Promise<BotClient> {
  const row = { chat_id: chatId, ...patch, updated_at: new Date().toISOString() };
  try {
    const { data, error } = await createServerClient().from(TABLE).upsert(row, { onConflict: "chat_id" }).select("*").single();
    if (error) throw new Error(error.message);
    return data as BotClient;
  } catch (e) {
    console.error("[tgbot] запись клиента:", (e as Error)?.message);
    return {
      first_name: null, last_name: null, username: null, lang: "ru", source: null, car_id: null,
      car_name: null, part_number: null, country: null, budget: null, timeframe: null, step: null,
      topic_id: null, header_message_id: null, status: "new", taken_by: null, blocked: false,
      created_at: row.updated_at, last_client_msg_at: null, last_manager_msg_at: null, ack_at: null,
      manager_reminded_at: null, offered_at: null, followup_sent_at: null,
      ...row,
    } as BotClient;
  }
}

export async function updateClient(chatId: number, patch: Partial<BotClient>): Promise<void> {
  try {
    const { error } = await createServerClient()
      .from(TABLE)
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("chat_id", chatId);
    if (error) console.error("[tgbot] обновление клиента:", error.message);
  } catch (e) {
    console.error("[tgbot] обновление клиента упало:", (e as Error)?.message);
  }
}

/** Все клиенты, по которым крону напоминаний может быть что делать. */
export async function clientsForReminders(): Promise<BotClient[] | null> {
  try {
    const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
    const { data, error } = await createServerClient()
      .from(TABLE)
      .select("*")
      .in("status", ["new", "in_work"])
      .eq("blocked", false)
      .gte("updated_at", since)
      .order("chat_id")
      .limit(500);
    if (error) {
      console.error("[tgbot] выборка для напоминаний:", error.message);
      return null;
    }
    return (data as BotClient[]) ?? [];
  } catch (e) {
    console.error("[tgbot] выборка для напоминаний упала:", (e as Error)?.message);
    return null;
  }
}
