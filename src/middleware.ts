import { NextResponse, type NextFetchEvent } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isbot } from "isbot";
import { isLang, resolveLang } from "@/lib/lang";
import { probeVehicle } from "@/lib/vehicleProbe";
import { carPageTarget, verdictHttpStatus } from "@/lib/vehicleStatus";
import {
  ADMIN_LOGIN_PATH,
  classifyRequest,
  hasSupabaseSessionCookie,
  isCanonicalHostHeader,
} from "@/lib/routes";

// IP адреса которые не трекаем (разработчики, владельцы)
const EXCLUDED_IPS = ["14.5.115.104"];

// ⚠️ Списки путей ядер (Корея, 410, редиректы, витрина аукциона, исключения)
// живут в манифестах `src/lib/routes/*`. Новый маршрут ядра — туда, не сюда:
// здесь только порядок шагов и сборка ответов.

// Канонический хост — `CANONICAL_HOST` в `src/lib/routes/shared.ts`. Всё прочее
// (служебный поддомен за Cloudflare Access, превью Coolify, обращение по IP) —
// служебный вход: не индексируется, не считается в аналитике, без гео-скрытия.
function isCanonicalHost(request: NextRequest): boolean {
  return isCanonicalHostHeader(request.headers.get("host"));
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

// Запрос самой страницы (HTML), а не подгрузки при клиентской навигации. Статус
// RSC-ответа никто не читает, а проба Encar на каждый переход лишняя.
// ⚠️ Next вырезает из запроса, который видит middleware, заголовки RSC /
// Next-Router-* и параметр `_rsc` (проверено на сборке 27.11.2026) — по ним
// клиентскую навигацию не распознать. Остаются `Accept: text/x-component` и `Next-Url`,
// их и проверяем. Промах не страшен: RSC-ответ с кодом 410 клиентский роутер Next
// не принимает и перезагружает страницу целиком — получается тот же результат.
function isDocumentRequest(request: NextRequest): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if ((request.headers.get("accept") || "").includes("text/x-component")) return false;
  if (request.headers.get("next-url")) return false;
  return true;
}

// Ответ Кореи (слой 3 из трёх, решение владельца 05.10.2026; пути — в манифестах).
function koreaBlockedResponse(api: boolean): NextResponse {
  const headers = {
    // Ответ зависит от страны — его нельзя класть ни в какой общий кеш, иначе
    // 403 уехал бы посетителям из других стран (или наоборот).
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
  };
  if (api) {
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

// ─── Supabase: обновление сессии с потолком по времени ───────────────────────
// ⚠️ Раньше здесь стоял голый `await supabase.auth.getUser()` на пути КАЖДОЙ
// страницы: Supabase на VPS тормозит или лежит — висит весь сайт, включая блог и
// калькулятор. Правило то же, что у Encar: страница из-за Supabase не падает и не
// ждёт НИКОГДА.
//  • Нет cookie сессии — вызова нет вовсе (supabase-js без сессии ответил бы
//    локально, но создавать клиент незачем).
//  • Есть — не дольше SUPABASE_TIMEOUT_MS; таймаут или исключение → лог, страница
//    уходит без обновления сессии (обновит следующий запрос или клиент).
const SUPABASE_TIMEOUT_MS = 2000;

async function refreshSupabaseSession(request: NextRequest, response: NextResponse): Promise<void> {
  if (!hasSupabaseSessionCookie(request.cookies.getAll().map((c) => c.name))) return;

  // После таймаута ответ уже ушёл — запоздавший getUser не должен трогать его cookie.
  let settled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            if (settled) return;
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );
    const timeout = new Promise<"timeout">((resolve) => {
      timer = setTimeout(() => resolve("timeout"), SUPABASE_TIMEOUT_MS);
    });
    const result = await Promise.race([supabase.auth.getUser(), timeout]);
    if (result === "timeout") {
      console.error(`[middleware] supabase getUser: нет ответа за ${SUPABASE_TIMEOUT_MS} мс, сессия не обновлена (${request.nextUrl.pathname})`);
    }
  } catch (e) {
    console.error(`[middleware] supabase getUser: ошибка, сессия не обновлена (${request.nextUrl.pathname}):`, e);
  } finally {
    settled = true;
    if (timer) clearTimeout(timer);
  }
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
  const path = request.nextUrl.pathname;

  // Порядок шагов и все пути — в classifyRequest (src/lib/routes/index.ts).
  const decision = classifyRequest({
    path,
    hasSearch: !!request.nextUrl.search,
    host: request.headers.get("host") || "",
    ua,
    isBot: isbot(ua),
    country: request.headers.get("cf-ipcountry") || "",
    canonical: isCanonicalHost(request),
  });

  switch (decision.kind) {
    case "electron-forbidden":
      return new NextResponse("Forbidden", { status: 403 });

    case "korea-blocked":
      return koreaBlockedResponse(decision.api);

    case "gone":
      return new NextResponse(null, { status: 410 });

    case "redirect": {
      const url = request.nextUrl.clone();
      url.pathname = decision.pathname;
      return NextResponse.redirect(url, decision.status);
    }

    case "admin": {
      if (path === ADMIN_LOGIN_PATH) return NextResponse.next();
      const adminPassword = process.env.ADMIN_PASSWORD;
      const cookie = request.cookies.get("admin_session");
      if (!adminPassword || !cookie || cookie.value !== "1") {
        return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
      }
      return NextResponse.next();
    }

    case "service-robots":
      // src/app/robots.ts отдаёт один и тот же файл на любом хосте — со ссылкой на
      // sitemap.xml и разрешением обходить всё. На служебном поддомене это
      // приглашение проиндексировать дубль сайта, поэтому подменяем ответ здесь.
      return new NextResponse("User-agent: *\nDisallow: /\n", {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });

    case "auction-bot-blocked":
      return new NextResponse(null, {
        status: 403,
        headers: { "X-Robots-Tag": "noindex, nofollow" },
      });

    case "excluded":
      return NextResponse.next();

    case "page":
      break;
  }

  // --- Карточка авто: честный HTTP-статус проданной (410) и битой (404) ---
  // Статус нельзя отдать из страницы: loading.tsx уже отправил оболочку с 200 (см.
  // src/lib/vehicleStatus.ts). Поэтому на ЗАПРОСЕ ДОКУМЕНТА (не RSC, не prefetch)
  // спрашиваем Encar здесь и подменяем статус у rewrite на тот же адрес — страница
  // рендерится как раньше (снимок проданной, подписка, похожие), меняется только код.
  // Авария Encar / блокировка / таймаут → вердикт unknown → статус как раньше (200).
  let carVerdictStatus: 410 | 404 | null = null;
  let carVerdict: string | null = null;
  const carTarget = isDocumentRequest(request) ? carPageTarget(path) : null;
  if (carTarget) {
    const verdict = await probeVehicle(carTarget.id);
    carVerdictStatus = verdictHttpStatus(verdict);
    carVerdict = verdict;
  }

  // --- Supabase: refresh сессии (с таймаутом, без сессии — без вызова) ---
  const response = carVerdictStatus
    ? NextResponse.rewrite(request.nextUrl.clone(), { request, status: carVerdictStatus })
    : NextResponse.next({ request });
  if (carVerdictStatus && carVerdict) {
    response.headers.set("X-Car-Verdict", carVerdict);
    if (carVerdict === "sold") response.headers.set("X-Robots-Tag", "noindex, follow");
  }
  await refreshSupabaseSession(request, response);

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
