import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const text = await res.text();
    throw new Error(`PayPal auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// ── POST /api/paypal/create-order ───────────────────────────────────────────
// Body: { orderId: string (our Supabase order UUID) }
// Returns: { paypalOrderId: string }

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = (await req.json()) as { orderId: string };
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    // Load our order from DB to get the authoritative total
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, order_number, total_usd, user_id, payment_status")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify ownership
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Don't allow re-payment of already paid orders
    if (order.payment_status === "paid") {
      return NextResponse.json({ error: "Order already paid" }, { status: 400 });
    }

    // Create PayPal order with our authoritative amount
    const accessToken = await getPayPalAccessToken();
    const base = process.env.PAYPAL_API_BASE!;

    const paypalRes = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: order.order_number,
            description: `K-Axis Order ${order.order_number}`,
            amount: {
              currency_code: "USD",
              value: order.total_usd.toFixed(2),
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "K-Axis",
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
            },
          },
        },
      }),
    });

    if (!paypalRes.ok) {
      const errText = await paypalRes.text();
      console.error("PayPal create order error:", errText);
      return NextResponse.json(
        { error: "PayPal order creation failed" },
        { status: 500 }
      );
    }

    const paypalOrder = await paypalRes.json();

    return NextResponse.json({ paypalOrderId: paypalOrder.id });
  } catch (err) {
    console.error("PayPal create-order error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
