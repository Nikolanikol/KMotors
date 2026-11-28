// Черновики ответов клиентам — их пишет Claude в сессии Claude Code, без API-ключа
// в проде (решение владельца 28.11.2026). Клиенту отправляет человек кнопкой в теме.
//
// GET  — кто ждёт ответа: клиент, факты (цены из кода сайта), последние 20 сообщений.
// POST {chat_id, text} — положить черновик в тему клиента с кнопками «Отправить» / «Не надо».
// Гейт fail-closed: без POSTER_CRON_SECRET — 401 на всё.

import { NextRequest, NextResponse } from "next/server";
import { clientsForReminders, getClient, recentMessages } from "@/lib/tgbot/store";
import { buildFacts, historyText } from "@/lib/tgbot/draft";
import { postDraft } from "@/lib/tgbot/inbox";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function denied(req: NextRequest): boolean {
  const secret = process.env.POSTER_CRON_SECRET;
  return !secret || req.headers.get("x-poster-secret") !== secret;
}

const ms = (iso: string | null) => (iso ? Date.parse(iso) : NaN);

export async function GET(req: NextRequest) {
  if (denied(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const clients = await clientsForReminders();
  if (!clients) return NextResponse.json({ ok: false, error: "база не ответила" }, { status: 500 });

  // Ждёт ответа: последнее слово за клиентом.
  const waiting = clients.filter((c) => {
    const lc = ms(c.last_client_msg_at);
    const lm = ms(c.last_manager_msg_at);
    return !Number.isNaN(lc) && (Number.isNaN(lm) || lm < lc);
  });

  const out = [];
  for (const c of waiting) {
    const history = await recentMessages(c.chat_id, 20);
    out.push({
      chat_id: c.chat_id,
      name: [c.first_name, c.last_name].filter(Boolean).join(" ") || null,
      username: c.username,
      lang: c.lang,
      status: c.status,
      last_client_msg_at: c.last_client_msg_at,
      facts: await buildFacts(c),
      history: historyText(history),
    });
  }
  return NextResponse.json({ ok: true, waiting: out });
}

export async function POST(req: NextRequest) {
  if (denied(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { chat_id?: unknown; text?: unknown } | null;
  const chatId = Number(body?.chat_id);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!Number.isFinite(chatId) || !text || text.length > 3500) {
    return NextResponse.json({ ok: false, error: "нужны chat_id и text (до 3500 знаков)" }, { status: 400 });
  }

  const c = await getClient(chatId);
  if (!c) return NextResponse.json({ ok: false, error: "клиент не найден" }, { status: 404 });

  const id = await postDraft(c, text);
  if (!id) return NextResponse.json({ ok: false, error: "не удалось положить черновик в тему" }, { status: 502 });
  return NextResponse.json({ ok: true, draft_id: id });
}
