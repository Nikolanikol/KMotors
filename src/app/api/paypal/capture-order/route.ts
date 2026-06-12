import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";
import { sendPaymentConfirmation } from "@/lib/email";

// ── PayPal access token ─────────────────────────────────────────────────────

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_CLIENT_SECRET!;
  const base = process.env.PAYPAL_API_BASE!;

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// ── Telegram notification ───────────────────────────────────────────────────

async function sendTelegramNotification(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_WORK_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch(() => {});
}

// ── POST /api/paypal/capture-order ──────────────────────────────────────────
// Body: { paypalOrderId: string, orderId: string (our DB order ID) }
// Captures payment, verifies amount, updates DB, sends Telegram

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paypalOrderId, orderId } = (await req.json()) as {
      paypalOrderId: string;
      orderId: string;
    };

    if (!paypalOrderId || !orderId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Load our order
    const db = createServerClient(); // service role for updates
    const { data: order, error: orderErr } = await db
      .from("orders")
      .select("id, order_number, total_usd, user_id, payment_status, shipping_address")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ error: "Already paid" }, { status: 400 });
    }

    // Capture the PayPal order
    const accessToken = await getPayPalAccessToken();
    const base = process.env.PAYPAL_API_BASE!;

    const captureRes = await fetch(
      `${base}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!captureRes.ok) {
      const errText = await captureRes.text();
      console.error("PayPal capture error:", errText);
      return NextResponse.json(
        { error: "Payment capture failed" },
        { status: 500 }
      );
    }

    const captureData = await captureRes.json();

    // Verify payment status
    if (captureData.status !== "COMPLETED") {
      console.error("PayPal capture status not COMPLETED:", captureData.status);
      return NextResponse.json(
        { error: `Payment status: ${captureData.status}` },
        { status: 400 }
      );
    }

    // Verify captured amount matches our order
    const capture =
      captureData.purchase_units?.[0]?.payments?.captures?.[0];
    const capturedAmount = parseFloat(capture?.amount?.value ?? "0");
    const expectedAmount = order.total_usd;

    if (Math.abs(capturedAmount - expectedAmount) > 0.01) {
      console.error(
        `Amount mismatch! Expected: ${expectedAmount}, Got: ${capturedAmount}`
      );
      // Still mark as paid but log the discrepancy
    }

    // Extract PayPal transaction ID
    const paypalTransactionId = capture?.id ?? paypalOrderId;

    // Update our order in DB
    const { error: updateErr } = await db
      .from("orders")
      .update({
        payment_status: "paid",
        status: "paid",
        paypal_order_id: paypalOrderId,
        paypal_transaction_id: paypalTransactionId,
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateErr) {
      console.error("Order update error:", updateErr);
      // Payment was captured but DB update failed
      // Notify via Telegram so we can fix manually
      await sendTelegramNotification(
        `⚠️ <b>ОШИБКА ОБНОВЛЕНИЯ ЗАКАЗА</b>\n\n` +
        `Заказ: <b>#${order.order_number}</b>\n` +
        `PayPal: <code>${paypalTransactionId}</code>\n` +
        `Ошибка: ${updateErr.message}\n\n` +
        `⚡ Оплата прошла, но статус не обновлён! Нужно обновить вручную.`
      );
    }

    // Telegram notification
    const addr = order.shipping_address as Record<string, string> | null;
    const tgText =
      `💰 <b>ОПЛАТА ПОЛУЧЕНА!</b>\n\n` +
      `📋 Заказ: <b>#${order.order_number}</b>\n` +
      `💵 Сумма: <b>$${capturedAmount.toFixed(2)}</b>\n` +
      `🆔 PayPal: <code>${paypalTransactionId}</code>\n` +
      (addr
        ? `👤 ${addr.name}\n📞 ${addr.phone}\n📍 ${addr.city}, ${addr.country}`
        : "");

    await sendTelegramNotification(tgText);

    // Email to customer
    if (user.email) {
      sendPaymentConfirmation({
        to: user.email,
        lang: "ru",
        orderNumber: order.order_number,
        totalUsd: capturedAmount,
        transactionId: paypalTransactionId,
      }).catch((err) => console.error("Payment email error:", err));
    }

    return NextResponse.json({
      success: true,
      transactionId: paypalTransactionId,
    });
  } catch (err) {
    console.error("PayPal capture-order error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
