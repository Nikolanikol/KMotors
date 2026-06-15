import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM ?? "K-Axis <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.kmotors.shop";

export async function POST(req: NextRequest) {
  const { email, lang = "ru" } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  if (!resend) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }

  const supabase = createServerClient();

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${SITE_URL}/auth/callback?next=/${lang}/auth?mode=reset`,
    },
  });

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ ok: true });
  }

  const resetLink = data.properties.action_link;
  const isRu = lang !== "en" && lang !== "ko";

  const subject = isRu
    ? "Сброс пароля — K-Axis"
    : lang === "ko"
    ? "비밀번호 재설정 — K-Axis"
    : "Reset your password — K-Axis";

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#333;">
      <div style="background:#002C5F;padding:24px 32px;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:20px;">K-Axis</h1>
      </div>
      <div style="padding:24px 32px;background:#fff;border:1px solid #eee;border-top:none;">
        <h2 style="color:#002C5F;margin:0 0 8px;">
          ${isRu ? "Сброс пароля" : lang === "ko" ? "비밀번호 재설정" : "Reset your password"}
        </h2>
        <p style="color:#666;margin:0 0 24px;">
          ${isRu
            ? "Нажмите кнопку ниже, чтобы установить новый пароль. Ссылка действительна 1 час."
            : lang === "ko"
            ? "아래 버튼을 클릭하여 새 비밀번호를 설정하세요. 링크는 1시간 동안 유효합니다."
            : "Click the button below to set a new password. This link is valid for 1 hour."}
        </p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${resetLink}" style="display:inline-block;background:#002C5F;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:16px;">
            ${isRu ? "Сбросить пароль" : lang === "ko" ? "비밀번호 재설정" : "Reset Password"}
          </a>
        </div>
        <p style="color:#999;font-size:12px;margin-top:24px;">
          ${isRu
            ? "Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо."
            : lang === "ko"
            ? "비밀번호 재설정을 요청하지 않았다면 이 이메일을 무시하세요."
            : "If you didn't request a password reset, just ignore this email."}
        </p>
      </div>
      <div style="padding:16px 32px;background:#f8f9fa;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none;text-align:center;">
        <p style="margin:0;color:#999;font-size:12px;">© K-Axis — Korean Auto Parts · kmotors.shop</p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({ from: FROM, to: email, subject, html });
  } catch (err) {
    console.error("Password reset email error:", err);
  }

  return NextResponse.json({ ok: true });
}
