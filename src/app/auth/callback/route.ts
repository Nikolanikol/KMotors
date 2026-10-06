import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { notifySignup } from "@/lib/signupNotify";
import { tagUserSite } from "@/lib/userSite";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/ru/parts";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.kmotors.shop";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Новый аккаунт — менеджеру в Telegram, как заявка. Сюда приходит и вход
      // через Google, и ссылка подтверждения почты — способ берём из аккаунта,
      // а не считаем любой колбэк Google-входом (так было до 05.10.2026).
      // Дубли и старые аккаунты отсекает notifySignup (src/lib/signupNotify.ts).
      if (data.user) {
        const method = data.user.app_metadata?.provider === "google" ? "google" : "email";
        await Promise.all([notifySignup(data.user, { method, path: next }), tagUserSite(data.user)]);
      }
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/ru/auth?mode=login`);
}
