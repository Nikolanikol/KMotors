import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";
import { krwToDisplayUsd } from "@/lib/pricing";

interface ShippingAddress {
  name: string;
  phone: string;
  city: string;
  address: string;
  zip: string;
  country: string;
}

interface CheckoutBody {
  country: string;
  shippingMethod: "EMS" | "EMS_PREMIUM" | null;
  shippingCostUsd: number;
  shippingAddress: ShippingAddress;
  notes: string;
  krwToUsd: number;
}

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `KM-${date}-${rand}`;
}

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

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const userSupabase = await createClient();
    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CheckoutBody;
    const { country, shippingMethod, shippingCostUsd, shippingAddress, notes, krwToUsd } = body;

    if (!country || !shippingAddress?.name || !shippingAddress?.phone) {
      return NextResponse.json({ error: "Недостаточно данных" }, { status: 400 });
    }

    const db = createServerClient(); // service role

    // ── Load cart ─────────────────────────────────────────────────────────────
    const { data: cart } = await db
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!cart) {
      return NextResponse.json({ error: "Корзина не найдена" }, { status: 404 });
    }

    const { data: cartItems } = await db
      .from("cart_items")
      .select("id, quantity, product_id")
      .eq("cart_id", cart.id);

    if (!cartItems?.length) {
      return NextResponse.json({ error: "Корзина пуста" }, { status: 400 });
    }

    const productIds = cartItems.map((i) => i.product_id);

    const { data: products } = await db
      .from("parts_products")
      .select("id, part_number, name_ru, name_en, price_krw, image_url, weight_kg, ship_method, category_id, subcategory_id")
      .in("id", productIds);

    // ── Load logistics via v_category_logistics (same as product detail page) ─
    const logisticsCatIds = [
      ...new Set(
        (products ?? [])
          .map((p) => (p.subcategory_id ?? p.category_id))
          .filter(Boolean) as number[]
      ),
    ];

    const { data: logistics } = logisticsCatIds.length
      ? await db
          .from("v_category_logistics")
          .select("id, weight_avg_kg, billed_weight_kg, ship_method, length_cm, width_cm, height_cm")
          .in("id", logisticsCatIds)
      : { data: [] as { id: number; weight_avg_kg: number | null; billed_weight_kg: number | null; ship_method: string | null; length_cm: number | null; width_cm: number | null; height_cm: number | null }[] };

    // ── Build order items ─────────────────────────────────────────────────────
    const orderItems = cartItems.map((ci) => {
      const p = products?.find((x) => x.id === ci.product_id);
      const logCatId = (p?.subcategory_id ?? p?.category_id) as number | null;
      const cat = logistics?.find((x) => x.id === logCatId);

      const weight = (p?.weight_kg ?? cat?.weight_avg_kg ?? 1.0) as number;
      const billedWeightKg = cat?.billed_weight_kg
        ? p?.weight_kg
          ? Math.round(Math.max(p.weight_kg * 1.12,
              cat.length_cm && cat.width_cm && cat.height_cm
                ? (cat.length_cm * cat.width_cm * cat.height_cm) / 5000 : 0) * 1000) / 1000
          : (cat.billed_weight_kg as number)
        : Math.round(weight * 1.12 * 1000) / 1000;
      const itemShipMethod = (p?.ship_method ?? cat?.ship_method ?? "CLARIFY") as string;

      return {
        product_id: ci.product_id as number,
        quantity: ci.quantity as number,
        price_krw: (p?.price_krw ?? 0) as number,
        part_number: (p?.part_number ?? "") as string,
        name_ru: (p?.name_ru ?? "") as string,
        name_en: (p?.name_en ?? "") as string,
        image_url: (p?.image_url ?? null) as string | null,
        weight_kg: weight,
        billed_weight_kg: billedWeightKg,
        ship_method: itemShipMethod,
      };
    });

    // ── Calculate totals ──────────────────────────────────────────────────────
    const subtotalKrw = orderItems.reduce(
      (s, i) => s + i.price_krw * i.quantity,
      0
    );
    const subtotalUsd = orderItems.reduce(
      (s, i) => s + krwToDisplayUsd(i.price_krw, krwToUsd) * i.quantity,
      0
    );
    const totalUsd = subtotalUsd + (shippingCostUsd ?? 0);

    const hasSea = orderItems.some(
      (i) => i.ship_method === "SEA" || i.ship_method === "CLARIFY"
    );
    const effectiveShipMethod =
      hasSea && !shippingMethod
        ? "SEA"
        : hasSea
        ? "MIXED"
        : shippingMethod ?? "CLARIFY";

    // ── Create order ──────────────────────────────────────────────────────────
    const orderNumber = generateOrderNumber();

    const { data: order, error: orderError } = await db
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        status: "pending",
        subtotal_krw: subtotalKrw,
        shipping_method: effectiveShipMethod,
        shipping_country: country,
        shipping_cost_usd: shippingCostUsd ?? 0,
        exchange_rate: krwToUsd,
        total_usd: totalUsd,
        shipping_address: shippingAddress,
        notes: notes || null,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Order insert error:", orderError);
      return NextResponse.json(
        { error: "Ошибка создания заказа: " + (orderError?.message ?? "unknown") },
        { status: 500 }
      );
    }

    // ── Create order items ────────────────────────────────────────────────────
    const { error: itemsError } = await db.from("order_items").insert(
      orderItems.map((i) => ({ ...i, order_id: order.id }))
    );

    if (itemsError) {
      console.error("Order items insert error:", itemsError);
      // Order created but items failed — still return order number, log for manual fix
    }

    // ── Clear cart ────────────────────────────────────────────────────────────
    await db.from("cart_items").delete().eq("cart_id", cart.id);

    // ── Telegram notification ─────────────────────────────────────────────────
    const usdFmt = new Intl.NumberFormat("en-US");
    const itemLines = orderItems
      .map(
        (i) =>
          `• ${i.name_ru || i.name_en} × ${i.quantity} — $${usdFmt.format(krwToDisplayUsd(i.price_krw, krwToUsd) * i.quantity)}`
      )
      .join("\n");

    const tgText =
      `🛒 <b>НОВЫЙ ЗАКАЗ #${orderNumber}</b>\n\n` +
      `👤 <b>${shippingAddress.name}</b>\n` +
      `📞 ${shippingAddress.phone}\n` +
      `📍 ${shippingAddress.city}, ${shippingAddress.address}${shippingAddress.zip ? `, ${shippingAddress.zip}` : ""}, ${country}\n\n` +
      `📦 Товары:\n${itemLines}\n\n` +
      `💵 Товары: $${usdFmt.format(subtotalUsd)}\n` +
      (shippingCostUsd
        ? `🚚 Доставка (${shippingMethod}): $${usdFmt.format(shippingCostUsd)}\n`
        : "") +
      (hasSea ? `🚢 Море: уточнить\n` : "") +
      `💰 <b>ИТОГО: $${usdFmt.format(totalUsd)}${hasSea ? " + море" : ""}</b>` +
      (notes ? `\n\n💬 ${notes}` : "");

    await sendTelegramNotification(tgText);

    return NextResponse.json({ orderNumber });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ошибка сервера" },
      { status: 500 }
    );
  }
}
