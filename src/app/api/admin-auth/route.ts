import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: "ADMIN_PASSWORD не настроен в .env.local" },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
    }

    // Устанавливаем cookie с паролем как токен сессии
    const response = NextResponse.json({ ok: true });
    response.cookies.set("admin_session", adminPassword, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
