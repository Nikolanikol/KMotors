import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// До верификации домена Resend шлёт только с onboarding@resend.dev
// После — заменить на noreply@kmotors.shop
const FROM = process.env.EMAIL_FROM ?? "K-Axis <onboarding@resend.dev>";

interface OrderItem {
  name_ru: string;
  name_en: string;
  part_number: string;
  quantity: number;
  price_krw: number;
}

interface OrderEmailParams {
  to: string;
  lang: string;
  orderNumber: string;
  items: OrderItem[];
  totalUsd: number;
  shippingCostUsd: number;
  shippingCountry: string;
  shippingMethod: string;
  krwToUsd: number;
}

interface PaymentEmailParams {
  to: string;
  lang: string;
  orderNumber: string;
  totalUsd: number;
  transactionId: string;
}

function fmtUsd(krw: number, rate: number): string {
  return "$" + Math.round(krw * rate * 1.1).toLocaleString("en-US");
}

// ── Order confirmation (сразу после оформления) ────────────────────────────

export async function sendOrderConfirmation(params: OrderEmailParams) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping order email");
    return;
  }

  const { to, lang, orderNumber, items, totalUsd, shippingCostUsd, shippingMethod, krwToUsd } = params;
  const isRu = lang === "ru" || lang === "ka" || lang === "ar";

  const subject = isRu
    ? `Заказ ${orderNumber} принят — K-Axis`
    : `Order ${orderNumber} confirmed — K-Axis`;

  const itemsHtml = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${isRu ? i.name_ru || i.name_en : i.name_en || i.name_ru}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.part_number}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${fmtUsd(i.price_krw, krwToUsd)}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#333;">
      <div style="background:#002C5F;padding:24px 32px;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:20px;">K-Axis</h1>
      </div>
      <div style="padding:24px 32px;background:#fff;border:1px solid #eee;border-top:none;">
        <h2 style="color:#002C5F;margin:0 0 8px;">${isRu ? "Заказ принят!" : "Order confirmed!"}</h2>
        <p style="color:#666;margin:0 0 20px;">
          ${isRu
            ? `Номер заказа: <strong>${orderNumber}</strong>. Мы начали обработку вашего заказа.`
            : `Order number: <strong>${orderNumber}</strong>. We've started processing your order.`}
        </p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
          <thead>
            <tr style="background:#f8f9fa;">
              <th style="padding:8px 12px;text-align:left;">${isRu ? "Товар" : "Item"}</th>
              <th style="padding:8px 12px;text-align:center;">${isRu ? "Артикул" : "Part #"}</th>
              <th style="padding:8px 12px;text-align:center;">${isRu ? "Кол-во" : "Qty"}</th>
              <th style="padding:8px 12px;text-align:right;">${isRu ? "Цена" : "Price"}</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div style="border-top:2px solid #002C5F;padding-top:12px;font-size:14px;">
          ${shippingCostUsd > 0 ? `<p style="margin:4px 0;color:#666;">${isRu ? "Доставка" : "Shipping"} (${shippingMethod.toUpperCase()}): <strong>$${shippingCostUsd.toFixed(2)}</strong></p>` : ""}
          <p style="margin:4px 0;font-size:18px;color:#002C5F;"><strong>${isRu ? "Итого" : "Total"}: $${totalUsd.toFixed(2)}</strong></p>
        </div>

        <p style="color:#999;font-size:12px;margin-top:24px;">
          ${isRu
            ? "Это автоматическое уведомление. Если у вас есть вопросы — напишите нам."
            : "This is an automated notification. If you have questions, please contact us."}
        </p>
      </div>
      <div style="padding:16px 32px;background:#f8f9fa;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none;text-align:center;">
        <p style="margin:0;color:#999;font-size:12px;">© K-Axis — Korean Auto Parts · kmotors.shop</p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("Order email send error:", err);
  }
}

// ── Payment confirmation (после успешной оплаты) ───────────────────────────

export async function sendPaymentConfirmation(params: PaymentEmailParams) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping payment email");
    return;
  }

  const { to, lang, orderNumber, totalUsd, transactionId } = params;
  const isRu = lang === "ru" || lang === "ka" || lang === "ar";

  const subject = isRu
    ? `Оплата ${orderNumber} получена — K-Axis`
    : `Payment received for ${orderNumber} — K-Axis`;

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#333;">
      <div style="background:#002C5F;padding:24px 32px;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:20px;">K-Axis</h1>
      </div>
      <div style="padding:24px 32px;background:#fff;border:1px solid #eee;border-top:none;">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-block;width:48px;height:48px;background:#22c55e;border-radius:50%;line-height:48px;font-size:24px;color:#fff;">✓</div>
        </div>
        <h2 style="color:#002C5F;margin:0 0 8px;text-align:center;">${isRu ? "Оплата получена!" : "Payment received!"}</h2>
        <p style="color:#666;margin:0 0 20px;text-align:center;">
          ${isRu
            ? `Заказ <strong>${orderNumber}</strong> оплачен на сумму <strong>$${totalUsd.toFixed(2)}</strong>.`
            : `Order <strong>${orderNumber}</strong> paid: <strong>$${totalUsd.toFixed(2)}</strong>.`}
        </p>
        <div style="background:#f8f9fa;border-radius:8px;padding:12px 16px;font-size:13px;color:#666;">
          <p style="margin:4px 0;">Transaction ID: <code>${transactionId}</code></p>
        </div>
        <p style="color:#666;font-size:14px;margin-top:16px;">
          ${isRu
            ? "Менеджер приступит к сборке и отправке вашего заказа. Мы уведомим вас о статусе."
            : "Our team will begin processing and shipping your order. We'll keep you updated."}
        </p>
      </div>
      <div style="padding:16px 32px;background:#f8f9fa;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none;text-align:center;">
        <p style="margin:0;color:#999;font-size:12px;">© K-Axis — Korean Auto Parts · kmotors.shop</p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("Payment email send error:", err);
  }
}
