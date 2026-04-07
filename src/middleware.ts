import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LANGS = ["ru", "en", "ko", "ka", "ar"];
const DEFAULT_LANG = "ru";

// Пути которые не нуждаются в lang-префиксе
function isExcluded(path: string): boolean {
  return (
    path.startsWith("/admin") ||
    path.startsWith("/api") ||
    path.startsWith("/_next") ||
    path.includes(".xml") ||
    path.includes("robots") ||
    path.includes("sitemap") ||
    path.match(/\.[a-zA-Z0-9]+$/) !== null
  );
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // --- Защита /admin ---
  if (path.startsWith("/admin")) {
    if (path === "/admin/login") return NextResponse.next();

    const adminPassword = process.env.ADMIN_PASSWORD;
    const cookie = request.cookies.get("admin_session");
    if (!adminPassword || !cookie || cookie.value !== adminPassword) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // --- Пропускаем статику, API, sitemaps, файлы ---
  if (isExcluded(path)) {
    return NextResponse.next();
  }

  // --- Определяем lang из URL ---
  const segments = path.split("/").filter(Boolean); // ['ru', 'catalog'] или ['catalog']
  const pathLang = segments[0];

  if (LANGS.includes(pathLang)) {
    // URL уже содержит валидный lang — ставим cookie и трекаем
    const response = NextResponse.next();
    response.cookies.set("kmotors-lang", pathLang, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 год
    });

    // Аналитика
    const referrer = request.headers.get("referer") || "";
    const origin = request.nextUrl.origin;
    fetch(`${origin}/api/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, referrer }),
    }).catch(() => {});

    return response;
  }

  // --- Нет lang-префикса — редирект на нужный язык ---
  // Пробуем определить язык из cookie или Accept-Language
  const cookieLang = request.cookies.get("kmotors-lang")?.value;
  const acceptLang = request.headers.get("accept-language")?.split(",")[0]?.split("-")[0];

  const targetLang =
    (cookieLang && LANGS.includes(cookieLang) ? cookieLang : null) ||
    (acceptLang && LANGS.includes(acceptLang) ? acceptLang : null) ||
    DEFAULT_LANG;

  const url = request.nextUrl.clone();
  url.pathname = `/${targetLang}${path === "/" ? "" : path}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon_io).*)"],
};
