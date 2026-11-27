// ЭТАЛОН: дословная копия регулярок и предикатов `src/middleware.ts` до выноса
// в манифесты (шаг 14, 26.11.2026, коммит-база 2d25988). НЕ ПРАВИТЬ: это то, с чем
// сверяются манифесты `src/lib/routes`. Меняется поведение намеренно — меняй
// ожидание в routes.spec.ts, а не эту копию.

export const KR_BLOCKED_PAGE = /^\/(?:(?:ru|en|ka|ar|ko)\/)?(?:catalog|auction|favorites|compare)(?:\/|$)/;
export const KR_BLOCKED_API = /^\/api\/(?:recommended|vehicle|carnect|cars|kcar)(?:\/|$)/;
export const AUCTION_SHOWCASE = /^\/(?:(?:ru|en|ka|ar|ko)\/)?auction\/?$/;
export const LINK_PREVIEW_BOT =
  /TelegramBot|WhatsApp|facebookexternalhit|Facebot|Twitterbot|Slackbot|Discordbot|LinkedInBot|vkShare|Viber|SkypeUriPreview/i;

export function legacyKoreaBlockedPath(path: string): boolean {
  return KR_BLOCKED_PAGE.test(path) || KR_BLOCKED_API.test(path);
}

export function legacyGone(path: string): boolean {
  return /^\/carpicture\d/.test(path) || path.startsWith("/cdn-cgi/");
}

export function legacyKo(path: string): string | null {
  if (path === "/ko" || path.startsWith("/ko/")) return "/en" + path.slice(3);
  return null;
}

export function legacyParts(path: string): string | null {
  const m = path.match(/^\/(ru|en|ko|ka|ar)\/parts\/([^/]+?)--[^/]+$/);
  return m ? `/${m[1]}/parts/${m[2]}` : null;
}

export function legacyExcluded(path: string): boolean {
  return (
    path.startsWith("/admin") ||
    path.startsWith("/api") ||
    path.startsWith("/auth") ||
    path.startsWith("/_next") ||
    path.includes(".xml") ||
    path.includes("robots") ||
    path.includes("sitemap") ||
    path.includes("opengraph-image") ||
    path.includes("twitter-image") ||
    path.match(/\.[a-zA-Z0-9]+$/) !== null
  );
}

export function legacyAuctionShowcase(path: string): boolean {
  return AUCTION_SHOWCASE.test(path);
}

export function legacyLinkPreviewBot(ua: string): boolean {
  return LINK_PREVIEW_BOT.test(ua);
}
