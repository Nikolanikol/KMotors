// POST /api/poster/parts/run — автопостинг запчастей в Telegram ОТКЛЮЧЁН (решение владельца 26.11.2026).
//
// Причина: пост брал цену как вон × курс, мимо наценки из `src/lib/pricing.ts`, и обещал клиенту
// на 25–47% меньше каталога. Маршрут оставлен живым и отвечает 200, чтобы строка хостового
// crontab (`/api/poster/parts/run`, `30 */2 * * *`) не краснела; саму строку нужно снять на VPS.
// Код публикации `src/lib/poster/parts.ts` не вызывается и лежит как мёртвый — вернуть можно
// из тега `cleanup/03-serena-off` (перед шагом 04), но ТОЛЬКО с ценой через `krwToDisplayUsd`.

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.POSTER_CRON_SECRET;
  if (!secret || req.headers.get("x-poster-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    posted: false,
    disabled: true,
    reason: "автопостинг запчастей отключён владельцем 26.11.2026",
  });
}
