// Сообщения о сбоях синка carnect в рабочий Telegram-чат.
//
// Зачем. Задание крона, которое тихо не сделало работу, снаружи выглядит так
// же, как сделавшее: каталог просто стареет, и замечают это через неделю.
// Таймаут Coolify задачу обрывает, но никому ничего не пишет. Поэтому
// синк сам сообщает о каждом сбое, а об успехе молчит: чат, куда сыплются «всё
// хорошо», перестают читать, и настоящий сбой тонет в шуме.
//
// ⚠️ Уходит в TELEGRAM_WORK_CHAT_ID — служебный чат, клиенты его не видят.
// Тот же бот (TELEGRAM_BOT_TOKEN) и тот же чат, что у отчёта рассылки
// подписок (api/subscriptions/run). Переменной нет — молча пропускаем:
// отсутствие чата не повод ронять синк.
//
// Не бросает никогда: уведомление вторично, синк важнее.

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WORK_CHAT_ID = process.env.TELEGRAM_WORK_CHAT_ID;

/** Telegram режет сообщение длиннее 4096 символов — оставляем запас. */
const MAX_LEN = 3800;

export async function notifyWorkChat(lines: string[]): Promise<void> {
  if (!TOKEN || !WORK_CHAT_ID) return;
  let text = lines.join("\n");
  if (text.length > MAX_LEN) text = `${text.slice(0, MAX_LEN)}\n…`;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Без parse_mode: в тексте названия машин и ошибки от чужого сайта,
      // любой случайный «<» в HTML-режиме уронил бы отправку целиком.
      body: JSON.stringify({ chat_id: WORK_CHAT_ID, text, disable_web_page_preview: true }),
      // Сам Telegram тоже может не ответить — ждать его дольше синка незачем.
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json()) as { ok?: boolean };
    if (!data.ok) console.error("[carnect] уведомление не ушло:", JSON.stringify(data));
  } catch (e) {
    console.error("[carnect] уведомление упало:", e instanceof Error ? e.message : String(e));
  }
}
