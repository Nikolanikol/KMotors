import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isbot } from "isbot";

const LANGS = ["ru", "en", "ko", "ka", "ar"];
const DEFAULT_LANG = "ru";

function shouldTrack(request: NextRequest): boolean {
  // Пропускаем RSC-запросы Next.js (React Server Component payload)
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/x-component")) return false;

  // Пропускаем prefetch-запросы (hover на ссылку)
  if (request.headers.get("next-router-prefetch") === "1") return false;
  if (request.headers.get("purpose") === "prefetch") return false;

  // Пропускаем ботов
  const ua = request.headers.get("user-agent") || "";
  if (!ua || isbot(ua)) return false;

  // Пропускаем владельца сайта (залогинен в админку)
  const adminSession = request.cookies.get("admin_session");
  if (adminSession?.value) return false;

  // Пропускаем саморефералы (переходы внутри сайта)
  const referer = request.headers.get("referer") || "";
  if (referer) {
    try {
      const refHost = new URL(referer).hostname;
      const ownHost = request.nextUrl.hostname;
      if (refHost === ownHost) return false;
    } catch {}
  }

  return true;
}

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

    // Аналитика — только реальные пользователи, не боты и не RSC
    if (shouldTrack(request)) {
      const referrer = request.headers.get("referer") || "";
      const origin = request.nextUrl.origin;
      // Страна — бесплатный заголовок Vercel, на localhost будет пустым
      const country = request.headers.get("x-vercel-ip-country") || "";
      // Устройство — определяем по User-Agent
      const ua = request.headers.get("user-agent") || "";
      const device = /mobile|android|iphone|ipad|ipod/i.test(ua)
        ? "mobile"
        : /tablet|ipad/i.test(ua)
        ? "tablet"
        : "desktop";

      fetch(`${origin}/api/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, referrer, country, device }),
      }).catch(() => {});
    }

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
