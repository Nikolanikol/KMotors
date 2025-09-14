export async function POST(req: Request) {
  const body = await req.json();

  const message = `
📥 Новая заявка:
Имя: ${body.name}
Телефон: ${body.phone}
Email: ${body.email}
Комментарий: ${body.message}
Способ связи: ${body.method}

  `;

  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN!;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
  const CHAT_ID_DIANA = process.env.TELEGRAM_CHAT_ID_DIANA!;
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
    }),
  });
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID_DIANA,
      text: message,
    }),
  });
  return new Response("OK", { status: 200 });
}
