import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Защита /admin — проверяем cookie с паролем
  if (path.startsWith("/admin")) {
    // Страницу логина пропускаем без проверки
    if (path === "/admin/login") {
      return NextResponse.next();
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    const cookie = request.cookies.get("admin_session");

    if (!adminPassword || !cookie || cookie.value !== adminPassword) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
  }

  // Пропускаем API, статику, _next, файлы с расширением
  if (
    path.startsWith("/api") ||
    path.startsWith("/_next") ||
    path.includes(".xml") ||
    path.includes("robots") ||
    path.includes("sitemap") ||
    path.match(/\.[a-zA-Z0-9]+$/) // любые файлы с расширением (.ico, .png, .js, .css и т.д.)
  ) {
    return NextResponse.next();
  }

  // Логируем просмотр страницы асинхронно (не блокируем ответ)
  const referrer = request.headers.get("referer") || "";
  const origin = request.nextUrl.origin;

  fetch(`${origin}/api/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, referrer }),
  }).catch(() => {}); // игнорируем ошибки — трекинг не должен ломать сайт

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Запускаем middleware на всех маршрутах кроме _next/static и _next/image
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
