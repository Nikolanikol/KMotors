// Уведомить менеджера о регистрации — зовёт окно входа (AuthModal) после
// удачной регистрации или входа по email. Вход через Google уведомляет сам
// колбэк (/auth/callback). Логика и защита — src/lib/signupNotify.ts.
//
// Тело — только КОНТЕКСТ (путь и заголовок страницы). Кто зарегистрировался и
// его телефон — из проверенной сессии, не из запроса.

import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { notifySignup } from "@/lib/signupNotify";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { path?: string; title?: string; method?: string };
  const result = await notifySignup(supabase, data.user, {
    method: body.method === "google" ? "google" : "email",
    path: body.path,
    title: body.title,
  });
  return NextResponse.json({ result });
}
