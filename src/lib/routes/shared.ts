// Общие пути и хосты для middleware. Чистые функции: без Node-API, без NextRequest —
// безопасны для edge-runtime и проверяются тестами `tests/routes`.

import { LANGS } from "@/lib/lang";
import { SITE_URL } from "@/lib/site";

/**
 * Префиксы локалей во ВХОДЯЩИХ путях. `ko` отключена (301 → `/en`), но в регулярках
 * её сохраняем: старые /ko/* ссылки ещё приходят и обязаны получать те же ответы
 * (403 из Кореи, 308 запчастей), что и раньше.
 */
export const PATH_LANGS: readonly string[] = [...LANGS, "ko"];

/** Группа `(?:ru|en|ka|ar|ko)` для сборки регулярок манифестов. */
export const LANG_GROUP = `(?:${PATH_LANGS.join("|")})`;

/** Путь страницы ядра с необязательным префиксом локали: `/catalog`, `/ru/catalog/…`. */
export function pageRegex(segments: readonly string[]): RegExp {
  return new RegExp(`^\\/(?:${LANG_GROUP}\\/)?(?:${segments.join("|")})(?:\\/|$)`);
}

/** API ядра: `/api/<segment>` и всё ниже. */
export function apiRegex(segments: readonly string[]): RegExp {
  return new RegExp(`^\\/api\\/(?:${segments.join("|")})(?:\\/|$)`);
}

// ─── Хост ───────────────────────────────────────────────────────────────────
// Канонический хост публичного сайта. Всё остальное, что доезжает до origin
// (служебный поддомен за Cloudflare Access, превью-домены Coolify, обращение по
// IP), считается служебным входом: он не индексируется, не попадает в аналитику
// и не подчиняется гео-скрытию ссылок на каталог. Определение то же, что в
// `src/lib/serviceHost.ts` — меняешь здесь, меняй там.
export const CANONICAL_HOST = new URL(SITE_URL).hostname;

/** Заголовок `host` (с портом или без) → это боевой хост или локальная разработка. */
export function isCanonicalHostHeader(hostHeader: string | null | undefined): boolean {
  const host = (hostHeader || "").split(":")[0].toLowerCase();
  return host === CANONICAL_HOST || host === "localhost" || host === "127.0.0.1";
}

// ─── 410 для мусорных путей (проиндексированных Google по ошибке) ──────────
export function isGonePath(path: string): boolean {
  return /^\/carpicture\d/.test(path) || path.startsWith("/cdn-cgi/");
}

// ─── 301: корейский язык отключён → английский ─────────────────────────────
// Аудитория преимущественно англоязычная; проиндексированные /ko/* URL
// получают постоянный редирект на /en/*, вес страниц консолидируется.
/** Новый путь для `/ko`, `/ko/…` или null. */
export function koToEnPath(path: string): string | null {
  if (path === "/ko" || path.startsWith("/ko/")) return "/en" + path.slice(3); // "/ko" → "/en"
  return null;
}

// ─── Пути без lang-префикса (не редиректятся на язык, без сессии и cookie) ──
export function isExcludedPath(path: string): boolean {
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

// ─── Админка ────────────────────────────────────────────────────────────────
export const ADMIN_LOGIN_PATH = "/admin/login";

export function isAdminPath(path: string): boolean {
  return path.startsWith("/admin");
}

// ─── Electron-скраперы (кроме localhost) ────────────────────────────────────
export function isElectronScraper(ua: string, hostHeader: string): boolean {
  return /electron/i.test(ua) && !hostHeader.startsWith("localhost");
}

// ─── Сборщики превью ссылок ─────────────────────────────────────────────────
// isbot считает их ботами, но это один запрос на одну присланную человеком
// ссылку, а не обход. meta-externalagent сюда НЕ входит — это краулер Meta для
// ИИ, превью Facebook/Instagram ходят как facebookexternalhit.
const LINK_PREVIEW_BOT =
  /TelegramBot|WhatsApp|facebookexternalhit|Facebot|Twitterbot|Slackbot|Discordbot|LinkedInBot|vkShare|Viber|SkypeUriPreview/i;

export function isLinkPreviewBot(ua: string): boolean {
  return LINK_PREVIEW_BOT.test(ua);
}
