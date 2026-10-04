import { NextResponse, type NextFetchEvent } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isbot } from "isbot";
import { isLang, resolveLang } from "@/lib/lang";

// IP адреса которые не трекаем (разработчики, владельцы)
const EXCLUDED_IPS = ["14.5.115.104"];

// Канонический хост публичного сайта. Всё остальное, что доезжает до origin
// (служебный поддомен за Cloudflare Access, превью-домены Coolify, обращение по
// IP), считается служебным входом: он не индексируется, не попадает в аналитику
// и не подчиняется гео-скрытию ссылок на каталог.
const CANONICAL_HOST = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kmotors.shop"
).hostname;

function isCanonicalHost(request: NextRequest): boolean {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  return (
    host === CANONICAL_HOST ||
    host === "localhost" ||
    host === "127.0.0.1"
  );
}

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

  // Пропускаем владельца сайта: служебный хост, cookie админки, известный IP.
  // Через служебный поддомен ходит только владелец — считать эти заходы
  // трафиком значит портить собственную статистику.
  if (!isCanonicalHost(request)) return false;
  const adminSession = request.cookies.get("admin_session");
  if (adminSession?.value) return false;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";
  if (EXCLUDED_IPS.includes(ip)) return false;

  // Пропускаем localhost (разработка)
  const hostname = request.nextUrl.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") return false;

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

// ─── Корея: всё про машины закрыто на www (решение владельца 05.10.2026) ─────
//
// Каталог Encar, аукционы, избранное/сравнение и ВСЕ API, которые отдают данные
// машин, — «и вниз по дереву»: страница, её RSC-запросы, og-картинка и ручки,
// из которых страница добирает данные. До этого закрывал только WAF Cloudflare,
// и только часть путей: владелец 05.10.2026 открыл из Кореи страницу машины
// аукциона, при том что список аукциона был закрыт. Это слой 3 — настоящий
// запрет на origin, а не скрытие ссылок (слой 2, useCountry).
//
// ⚠️ Только канонический хост. Служебный (вход владельца через Cloudflare
// Access) — рабочее место, его не трогаем. Кроны ходят на 127.0.0.1 без
// cf-ipcountry — им запрет не мешает.
// ⚠️ Страна — только cf-ipcountry: Cloudflare ставит его сам, клиент его не
// подделает (запрос мимо Cloudflare — отдельная дыра, закрывается файрволом VPS).
const KR_BLOCKED_PAGE = /^\/(?:(?:ru|en|ka|ar|ko)\/)?(?:catalog|auction|favorites|compare)(?:\/|$)/;
const KR_BLOCKED_API = /^\/api\/(?:recommended|vehicle|carnect|cars|kcar|showcase)(?:\/|$)/;

function isKoreaBlocked(request: NextRequest, path: string): boolean {
  if (!isCanonicalHost(request)) return false;
  if ((request.headers.get("cf-ipcountry") || "").toUpperCase() !== "KR") return false;
  return KR_BLOCKED_PAGE.test(path) || KR_BLOCKED_API.test(path);
}

function koreaBlockedResponse(path: string): NextResponse {
  const headers = {
    // Ответ зависит от страны — его нельзя класть ни в какой общий кеш, иначе
    // 403 уехал бы посетителям из других стран (или наоборот).
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
  };
  if (path.startsWith("/api/")) {
    return NextResponse.json({ error: "not available in your region" }, { status: 403, headers });
  }
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>K-Axis</title></head>` +
      `<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0A0A;color:#F5F0EB;font-family:system-ui,sans-serif;text-align:center;padding:16px">` +
      `<div><h1 style="font-size:20px;font-weight:600">This section is not available in your region.</h1>` +
      `<p style="color:#8A8A8A"><a href="/" style="color:#B67749">Go to the home page</a></p></div></body></html>`,
    { status: 403, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } },
  );
}

// Пути которые не нуждаются в lang-префиксе
function isExcluded(path: string): boolean {
  return (
    path.startsWith("/admin") ||
    path.startsWith("/api") ||
    path.startsWith("/auth") ||
    path.startsWith("/_next") ||
    path.includes(".xml") ||
    path.includes("robots") ||
    path.includes("sitemap") ||
    // ⚠️ Карточки соцсетей файловой конвенции Next. Расширения в пути НЕТ,
    // поэтому без этой строки корневой /opengraph-image уходит редиректом на
    // /ru/opengraph-image, которого не существует: 307 → 404, и все ссылки на
    // сайт репостятся без картинки. Иконки (icon.svg, apple-icon.png) спасает
    // расширение, og-карточку спасать нечем.
    path.includes("opengraph-image") ||
    path.includes("twitter-image") ||
    path.match(/\.[a-zA-Z0-9]+$/) !== null
  );
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  // ⚠️ event пробрасывается в handle НАМЕРЕННО: вся логика живёт там, а
  // аналитике нужен waitUntil, чтобы фоновый запрос успел уйти до того, как
  // рантайм свернёт вызов. Без проброса TypeScript молча возьмёт глобальный
  // DOM-Event, у которого waitUntil нет.
  const response = await handle(request, event);

  // ⚠️ Служебный хост обязан быть закрыт от индексации, иначе в выдаче окажется
  // ПОЛНАЯ копия сайта на втором домене. Заголовок ставится здесь, поверх ЛЮБОГО
  // ответа middleware, а не в отдельных ветках: их восемь, и новая забудется.
  // Индексации мешают три независимых вещи — Cloudflare Access (крауле́р до
  // страницы не доходит), этот заголовок и абсолютные canonical на www в самих
  // страницах. Заголовок в HTML не запекается, поэтому общий кеш Next между
  // хостами его не разносит.
  if (!isCanonicalHost(request)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

async function handle(request: NextRequest, event: NextFetchEvent) {
  const ua = request.headers.get("user-agent") || "";

  // --- Блокируем Electron-ботов/скраперов (кроме localhost) ---
  const host = request.headers.get("host") || "";
  if (/electron/i.test(ua) && !host.startsWith("localhost")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const path = request.nextUrl.pathname;

  // --- Корея: машины и всё, что под ними (см. KR_BLOCKED_*) ---
  if (isKoreaBlocked(request, path)) return koreaBlockedResponse(path);

  // --- 410 для мусорных путей (проиндексированных Google по ошибке) ---
  if (/^\/carpicture\d/.test(path) || path.startsWith("/cdn-cgi/")) {
    return new NextResponse(null, { status: 410 });
  }

  // --- 301: корейский язык отключён → переносим на английский ---
  // Аудитория преимущественно англоязычная; проиндексированные /ko/* URL
  // получают постоянный редирект на /en/*, вес страниц консолидируется.
  if (path === "/ko" || path.startsWith("/ko/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/en" + path.slice(3); // "/ko" → "/en", "/ko/x" → "/en/x"
    return NextResponse.redirect(url, 301);
  }

  // --- 308: старые URL запчастей "PN--name-slug" → канонический "PN" ---
  // Редирект должен быть настоящим HTTP (не из page.tsx: там loading.tsx
  // запускает стриминг и статус уже отправлен как 200)
  const oldPartsSlug = path.match(/^\/(ru|en|ko|ka|ar)\/parts\/([^/]+?)--[^/]+$/);
  if (oldPartsSlug) {
    const url = request.nextUrl.clone();
    url.pathname = `/${oldPartsSlug[1]}/parts/${oldPartsSlug[2]}`;
    return NextResponse.redirect(url, 308);
  }

  // --- Защита /admin ---
  if (path.startsWith("/admin")) {
    if (path === "/admin/login") return NextResponse.next();

    const adminPassword = process.env.ADMIN_PASSWORD;
    const cookie = request.cookies.get("admin_session");
    if (!adminPassword || !cookie || cookie.value !== "1") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // --- robots.txt служебного хоста: запрет целиком ---
  // src/app/robots.ts отдаёт один и тот же файл на любом хосте — со ссылкой на
  // sitemap.xml и разрешением обходить всё. На служебном поддомене это
  // приглашение проиндексировать дубль сайта, поэтому подменяем ответ здесь.
  if (path === "/robots.txt" && !isCanonicalHost(request)) {
    return new NextResponse("User-agent: *\nDisallow: /\n", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  // --- Пропускаем статику, API, sitemaps, файлы ---
  if (isExcluded(path)) {
    return NextResponse.next();
  }

  // --- Supabase: refresh сессии ---
  const response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
  await supabase.auth.getUser();

  // --- Определяем lang из URL ---
  const segments = path.split("/").filter(Boolean); // ['ru', 'catalog'] или ['catalog']
  const pathLang = segments[0];

  if (isLang(pathLang)) {
    /**
     * ⚠️ Cookie СТАВЯТСЯ НЕ ВСЕГДА, и это про краулинг, а не про экономию байт.
     *
     * Любой `Set-Cookie` на ответе делает его приватным: CDN такой ответ не
     * кеширует никогда. Замер 29.09.2026 — на каждой странице сайта
     * `Cache-Control: private, no-store` и `cf-cache-status: DYNAMIC`, потому
     * что эти две cookie ставились на КАЖДЫЙ ответ. Для Googlebot это особенно
     * больно: cookie он не хранит, поэтому условие «её ещё нет» срабатывало
     * каждый раз, и ни один его запрос закешировать было нельзя.
     *
     * Отсюда два правила ниже.
     */

    // 1. Боту языковая cookie не нужна вовсе: он не переключает язык и не
    //    ходит по сайту с состоянием. Зато без Set-Cookie его ответ кешируем.
    //    Даты последнего обхода на 29.09.2026 — 6 июня, 29 июня, 28 июля: для
    //    каталога на 50 тысяч страниц это ничтожно, и дорогой обход тому причина.
    const isCrawler = isbot(ua);

    // 2. Живому посетителю ставим, только когда значение ДРУГОЕ. Повторная
    //    запись того же значения ничего не меняет в браузере, но лишает
    //    кеша каждый его переход по сайту.
    const setIfChanged = (name: string, value: string, maxAge: number) => {
      if (isCrawler) return;
      if ((request.cookies.get(name)?.value ?? "") === value) return;
      response.cookies.set(name, value, { path: "/", sameSite: "lax", maxAge });
    };

    setIfChanged("kmotors-lang", pathLang, 60 * 60 * 24 * 365); // 1 год

    // Страна пользователя — от Cloudflare (cf-ipcountry) или Vercel fallback.
    // ⚠️ На служебном хосте страну НЕ проставляем, и это и есть снятие слоя 2:
    // из Кореи cf-ipcountry так и остаётся KR, а шесть компонентов и две
    // серверные страницы сравнивают эту cookie с "KR" и прячут ссылки на
    // каталог. Без обнуления служебный вход пускал бы на /catalog, но адрес
    // приходилось бы набирать руками. Cookie host-only (Domain не задан),
    // поэтому на www она не протекает.
    //
    // ⚠️ Правило «только при изменении» этого НЕ ломает: на служебном хосте
    // желаемое значение пустое, а в браузере лежит «KR» — значения разные,
    // значит cookie перезапишется. Совпали — переписывать и нечего.
    const country = isCanonicalHost(request)
      ? request.headers.get("cf-ipcountry") ||
        request.headers.get("x-country") ||
        ""
      : "";
    setIfChanged("x-user-country", country, 60 * 60 * 24); // 24 часа

    // Аналитика — только реальные пользователи, не боты и не RSC
    if (shouldTrack(request)) {
      const referrer = request.headers.get("referer") || "";
      const origin = request.nextUrl.origin;
      // Страна — бесплатный заголовок Vercel, на localhost будет пустым
      const country = request.headers.get("cf-ipcountry") || request.headers.get("x-country") || "";
      // Устройство — определяем по User-Agent
      const ua = request.headers.get("user-agent") || "";
      const device = /mobile|android|iphone|ipad|ipod/i.test(ua)
        ? "mobile"
        : /tablet|ipad/i.test(ua)
        ? "tablet"
        : "desktop";

      // ⚠️ event.waitUntil, а НЕ голый fetch. Без него middleware возвращает
      // ответ, рантайм сворачивает вызов, и запрос к /api/track может не
      // успеть уйти вовсе — в логах при этом пусто, потому что ошибки не
      // было. Именно так счётчик и замолчал: эндпоинт исправен, а строк нет.
      //
      // ⚠️ И НЕ `.catch(() => {})`. Провал записи — это не мелочь, которую
      // можно проглотить: по этим цифрам принимают решения, а молчащий
      // счётчик хуже отсутствующего. Пусть ляжет в лог контейнера.
      event.waitUntil(
        fetch(`${origin}/api/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, referrer, country, device }),
        })
          .then(async (r) => {
            if (!r.ok) {
              console.error(`[track] ${r.status} на ${path}:`, (await r.text().catch(() => "")).slice(0, 200));
            }
          })
          .catch((e) => console.error(`[track] запрос не ушёл (${path}):`, e)),
      );
    }

    return response;
  }

  // --- Нет lang-префикса — редирект на нужный язык ---
  // Вариант A: cookie → язык браузера (любая наша локаль) → страна (Cloudflare) → дефолт.
  const targetLang = resolveLang({
    cookie: request.cookies.get("kmotors-lang")?.value,
    acceptLanguage: request.headers.get("accept-language"),
    country:
      request.headers.get("cf-ipcountry") || request.headers.get("x-country"),
  });

  const url = request.nextUrl.clone();
  url.pathname = `/${targetLang}${path === "/" ? "" : path}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon_io).*)"],
};
