// Фаза 4 SEO-автоматики: Telegram-гейт (дайджест + апрув/реджект).
//
// Логика: собрать дайджест черновиков одного батча, отправить админу с кнопками,
// по колбэкам менять статус в seo_suggestions. Публикацию (draft→карточка+IndexNow)
// делает Фаза 5 — здесь только фиксируем твоё решение.

import type { SupabaseClient } from "@supabase/supabase-js";

const TG = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

function esc(s: string | null | undefined): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Дайджест ────────────────────────────────────────────────────────────────
export async function buildDigest(
  supabase: SupabaseClient,
  batchId: string
): Promise<{ text: string; reply_markup: object; count: number } | null> {
  const { data } = await supabase
    .from("seo_suggestions")
    .select("part_number, snap_impressions, snap_position, proposed_title_ru, proposed_desc_ru")
    .eq("batch_id", batchId)
    .eq("status", "draft")
    .order("snap_impressions", { ascending: false });

  if (!data?.length) return null;

  const snip = (s: string | null) => {
    const t = String(s ?? "").trim();
    return t.length > 90 ? t.slice(0, 88) + "…" : t;
  };
  const lines = data.slice(0, 15).map(
    (r, i) =>
      `${i + 1}. <code>${esc(r.part_number)}</code> · поз ${r.snap_position?.toFixed(1) ?? "—"} · пок ${r.snap_impressions ?? 0}\n   <b>${esc(r.proposed_title_ru)}</b>\n   <i>${esc(snip(r.proposed_desc_ru))}</i>`
  );
  const more = data.length > 15 ? `\n\n…и ещё ${data.length - 15}` : "";
  const text = `📋 <b>SEO-предложения</b> · ${data.length} карточек запчастей\n\n${lines.join("\n")}${more}`;

  const reply_markup = {
    inline_keyboard: [
      [{ text: `✅ Одобрить все ${data.length}`, callback_data: `seo_all:${batchId}` }],
      [
        { text: "📝 По одному", callback_data: `seo_one:${batchId}` },
        { text: "❌ Отклонить все", callback_data: `seo_none:${batchId}` },
      ],
    ],
  };
  return { text, reply_markup, count: data.length };
}

// Полные карточки для режима «По одному»
export async function buildItemMessages(
  supabase: SupabaseClient,
  batchId: string
): Promise<{ text: string; reply_markup: object }[]> {
  const { data } = await supabase
    .from("seo_suggestions")
    .select("id, part_number, snap_impressions, snap_position, proposed_title_ru, proposed_desc_ru, proposed_body_ru, proposed_cross_refs")
    .eq("batch_id", batchId)
    .eq("status", "draft")
    .order("snap_impressions", { ascending: false });

  return (data ?? []).map((r) => {
    const cross = Array.isArray(r.proposed_cross_refs) && r.proposed_cross_refs.length
      ? `\n<b>Кросс:</b> ${esc(r.proposed_cross_refs.join(", "))}`
      : "";
    const text =
      `🔧 <code>${esc(r.part_number)}</code> · поз ${r.snap_position?.toFixed(1) ?? "—"} · пок ${r.snap_impressions ?? 0}\n\n` +
      `<b>Title:</b> ${esc(r.proposed_title_ru)}\n` +
      `<b>Desc:</b> ${esc(r.proposed_desc_ru)}\n` +
      `<b>Текст:</b> ${esc(r.proposed_body_ru)}${cross}`;
    const reply_markup = {
      inline_keyboard: [
        [
          { text: "✅ Одобрить", callback_data: `seo_ok:${r.id}` },
          { text: "❌ Отклонить", callback_data: `seo_no:${r.id}` },
        ],
      ],
    };
    return { text, reply_markup };
  });
}

// ── Изменение статусов ──────────────────────────────────────────────────────
async function setStatus(
  supabase: SupabaseClient,
  filter: { batch_id?: string; id?: number },
  status: "approved" | "rejected"
): Promise<number> {
  let q = supabase
    .from("seo_suggestions")
    .update({ status, decided_at: new Date().toISOString() })
    .eq("status", "draft");
  if (filter.batch_id) q = q.eq("batch_id", filter.batch_id);
  if (filter.id) q = q.eq("id", filter.id);
  const { data } = await q.select("id");
  return data?.length ?? 0;
}

export const approveBatch = (sb: SupabaseClient, batchId: string) => setStatus(sb, { batch_id: batchId }, "approved");
export const rejectBatch = (sb: SupabaseClient, batchId: string) => setStatus(sb, { batch_id: batchId }, "rejected");
export const approveOne = (sb: SupabaseClient, id: number) => setStatus(sb, { id }, "approved");
export const rejectOne = (sb: SupabaseClient, id: number) => setStatus(sb, { id }, "rejected");

// ── Отправка ────────────────────────────────────────────────────────────────
async function tgSend(chatId: string, text: string, reply_markup?: object) {
  const res = await fetch(`${TG}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", reply_markup }),
  });
  const data = await res.json();
  if (!data.ok) console.error("[seo-telegram] sendMessage:", JSON.stringify(data));
  return data;
}

/** Отправляет дайджест батча администратору. */
export async function sendSeoDigest(
  supabase: SupabaseClient,
  batchId: string
): Promise<{ sent: boolean; count: number }> {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return { sent: false, count: 0 };

  const d = await buildDigest(supabase, batchId);
  if (!d) return { sent: false, count: 0 };

  await tgSend(chatId, d.text, d.reply_markup);
  return { sent: true, count: d.count };
}

/** Отправляет карточки батча по одной (drill-down). */
export async function sendItemMessages(supabase: SupabaseClient, batchId: string): Promise<number> {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return 0;
  const items = await buildItemMessages(supabase, batchId);
  for (const it of items) await tgSend(chatId, it.text, it.reply_markup);
  return items.length;
}
