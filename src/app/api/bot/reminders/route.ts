// Крон клиентского бота: напоминания менеджерам и один «дожим» клиенту.
// Зовёт scripts/cron/run.mjs bot-reminders каждые 10 минут (Coolify Scheduled Tasks).
// Гейт fail-closed: без POSTER_CRON_SECRET — 401 на всё.

import { NextRequest, NextResponse } from "next/server";
import { clientsForReminders, updateClient } from "@/lib/tgbot/store";
import { decide } from "@/lib/tgbot/reminders";
import { notifyManagers } from "@/lib/tgbot/inbox";
import { send, isBlocked } from "@/lib/tgbot/api";
import { t } from "@/lib/tgbot/texts";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const secret = process.env.POSTER_CRON_SECRET;
  if (!secret || req.headers.get("x-poster-secret") !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const clients = await clientsForReminders();
  if (!clients) return NextResponse.json({ ok: false, error: "база не ответила" }, { status: 500 });

  const now = new Date();
  let reminded = 0;
  let followups = 0;
  let offhours = 0;

  for (const c of clients) {
    const d = decide(c, now);

    if (d.remindManager) {
      const mins = Math.round((now.getTime() - Date.parse(c.last_client_msg_at!)) / 60000);
      await notifyManagers(c, `⏰ <b>Клиент ждёт ответа ${mins} мин.</b> Ответьте в этой теме или нажмите «Отказ» в шапке.`);
      await updateClient(c.chat_id, { manager_reminded_at: now.toISOString() });
      reminded++;
    }

    if (d.offhoursAck) {
      const r = await send(c.chat_id, t(c.lang).offhoursAck);
      await updateClient(c.chat_id, { offhours_ack_at: now.toISOString(), ...(isBlocked(r) ? { blocked: true } : {}) });
      if (r.ok) {
        await notifyManagers(c, "🌙 Нерабочее время: бот ответил клиенту, что менеджер напишет в рабочий день. Черновик ответа — выше, если он есть.");
        offhours++;
      }
    }

    if (d.followup) {
      const x = t(c.lang);
      const r = await send(c.chat_id, c.car_id ? x.followup : x.followupParts, [
        [{ text: x.followupContact, callback_data: "b:mgr" }],
        c.car_id
          ? [{ text: x.menuCatalog, url: `${SITE_URL}/${c.lang}/catalog?utm_source=telegram_bot&utm_medium=bot&utm_campaign=followup` }]
          : [{ text: x.partAnother, callback_data: "b:parts" }],
        [{ text: x.followupNo, callback_data: "b:fno" }],
      ]);
      // Отметку ставим и при отказе Telegram: второй попытки «дожима» быть не должно.
      await updateClient(c.chat_id, { followup_sent_at: now.toISOString(), ...(isBlocked(r) ? { blocked: true } : {}) });
      if (r.ok) {
        await notifyManagers(c, "📨 Бот отправил клиенту напоминание «остались вопросы?» (сутки без ответа после цены).");
        followups++;
      }
    }
  }

  return NextResponse.json({ ok: true, checked: clients.length, reminded, followups, offhours });
}
