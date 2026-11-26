// Манифесты маршрутов по ядрам и решение «что делать с запросом» для middleware.
//
// ⚠️ Новый маршрут ядра (страница или API машин/аукциона, мусорный путь, редирект)
// добавлять в манифест своего ядра (`cars.ts`, `auction.ts`, `parts.ts`, `shared.ts`),
// а не в `src/middleware.ts`: тот только исполняет решение `classifyRequest`.
// Всё здесь — чистые функции без Node-API и NextRequest (edge-safe); матрица
// «путь × страна × бот» проверяется `tests/routes`.

import { AUCTION_KR_BLOCKED_API, AUCTION_KR_BLOCKED_PAGES, isAuctionShowcasePath } from "./auction";
import { CARS_KR_BLOCKED_API, CARS_KR_BLOCKED_PAGES } from "./cars";
import { legacyPartsRedirect } from "./parts";
import {
  apiRegex,
  isAdminPath,
  isElectronScraper,
  isExcludedPath,
  isGonePath,
  isLinkPreviewBot,
  koToEnPath,
  pageRegex,
} from "./shared";

export { isAuctionShowcasePath } from "./auction";
export { legacyPartsRedirect } from "./parts";
export { hasSupabaseSessionCookie } from "./session";
export {
  ADMIN_LOGIN_PATH,
  CANONICAL_HOST,
  isAdminPath,
  isCanonicalHostHeader,
  isExcludedPath,
  isGonePath,
  isLinkPreviewBot,
  koToEnPath,
} from "./shared";

// ─── Корея: всё про машины закрыто на www (решение владельца 05.10.2026) ─────
//
// Каталог Encar, аукционы, избранное/сравнение и ВСЕ API, которые отдают данные
// машин, — «и вниз по дереву»: страница, её RSC-запросы, og-картинка и ручки,
// из которых страница добирает данные. Это слой 3 — настоящий запрет на origin,
// а не скрытие ссылок (слой 2, useCountry). Списки — в манифестах ядер.
const KR_BLOCKED_PAGE = pageRegex([...CARS_KR_BLOCKED_PAGES, ...AUCTION_KR_BLOCKED_PAGES]);
const KR_BLOCKED_API = apiRegex([...CARS_KR_BLOCKED_API, ...AUCTION_KR_BLOCKED_API]);

/** Путь закрыт из Кореи (без учёта хоста и страны). */
export function isKoreaBlockedPath(path: string): boolean {
  return KR_BLOCKED_PAGE.test(path) || KR_BLOCKED_API.test(path);
}

/** Страна из `cf-ipcountry` — Корея. */
export function isKoreaCountry(country: string | null | undefined): boolean {
  return (country || "").toUpperCase() === "KR";
}

export type RouteInput = {
  /** `request.nextUrl.pathname` */
  path: string;
  /** Есть query-строка (`request.nextUrl.search` непустой). */
  hasSearch: boolean;
  /** Заголовок `host` как пришёл (с портом). */
  host: string;
  /** User-Agent (пустая строка, если нет). */
  ua: string;
  /** `isbot(ua)` — считается снаружи, чтобы манифесты не тянули зависимость. */
  isBot: boolean;
  /** `cf-ipcountry` (пустая строка, если нет). */
  country: string;
  /** Запрос на боевой хост (`isCanonicalHostHeader(host)`). */
  canonical: boolean;
};

export type RouteDecision =
  | { kind: "electron-forbidden" }
  | { kind: "korea-blocked"; api: boolean }
  | { kind: "gone" }
  | { kind: "redirect"; status: 301 | 308; pathname: string }
  | { kind: "admin" }
  | { kind: "service-robots" }
  | { kind: "auction-bot-blocked" }
  | { kind: "excluded" }
  | { kind: "page" };

/**
 * Решение по запросу. ПОРЯДОК ШАГОВ — тот же, что был в middleware до выноса;
 * менять его — значит менять поведение для посетителей.
 */
export function classifyRequest(r: RouteInput): RouteDecision {
  // Electron-боты/скраперы (кроме localhost)
  if (isElectronScraper(r.ua, r.host)) return { kind: "electron-forbidden" };

  // Корея: только боевой хост (служебный — рабочее место владельца; кроны ходят
  // на 127.0.0.1 без cf-ipcountry). Страна — только cf-ipcountry: его ставит
  // Cloudflare, клиент не подделает.
  if (r.canonical && isKoreaCountry(r.country) && isKoreaBlockedPath(r.path)) {
    return { kind: "korea-blocked", api: r.path.startsWith("/api/") };
  }

  if (isGonePath(r.path)) return { kind: "gone" };

  const en = koToEnPath(r.path);
  if (en !== null) return { kind: "redirect", status: 301, pathname: en };

  const part = legacyPartsRedirect(r.path);
  if (part !== null) return { kind: "redirect", status: 308, pathname: part };

  if (isAdminPath(r.path)) return { kind: "admin" };

  // robots.txt служебного хоста — запрет целиком (см. middleware).
  if (r.path === "/robots.txt" && !r.canonical) return { kind: "service-robots" };

  // Боты на витрине аукциона с фильтрами — 403 до рендера (замер 11.11.2026:
  // ~6.5 рендеров/с от GPTBot/Perplexity/meta-externalagent/Semrush). Голая
  // /auction кешируется и открыта; превью ссылок в мессенджерах пропускаем.
  if (r.hasSearch && isAuctionShowcasePath(r.path) && r.isBot && !isLinkPreviewBot(r.ua)) {
    return { kind: "auction-bot-blocked" };
  }

  if (isExcludedPath(r.path)) return { kind: "excluded" };

  return { kind: "page" };
}
