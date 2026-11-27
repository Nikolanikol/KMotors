import { isbot } from "isbot";
import { describe, expect, it } from "vitest";
import {
  CANONICAL_HOST,
  classifyRequest,
  hasSupabaseSessionCookie,
  isAuctionShowcasePath,
  isExcludedPath,
  isGonePath,
  isKoreaBlockedPath,
  isLinkPreviewBot,
  koToEnPath,
  legacyPartsRedirect,
  type RouteDecision,
} from "@/lib/routes";
import { isCanonicalHostHeader } from "@/lib/routes/shared";
import {
  legacyAuctionShowcase,
  legacyExcluded,
  legacyGone,
  legacyKo,
  legacyKoreaBlockedPath,
  legacyLinkPreviewBot,
  legacyParts,
} from "./legacy";

// Набор путей для сверки с эталоном (старые регулярки middleware до шага 14).
// Граничные случаи намеренно: регистр, хвостовой слэш, похожие слова, ko, без локали.
const PATHS = [
  "/", "/ru", "/en", "/ka", "/ar", "/ko", "/RU", "/ru/", "/xx", "/kor",
  "/ru/catalog", "/en/catalog", "/ka/catalog", "/ar/catalog", "/ko/catalog",
  "/catalog", "/catalog/", "/ru/catalog/", "/RU/catalog", "/ru/Catalog",
  "/ru/catalogue", "/ru/catalog-x", "/ru/catalogs", "/ru/catalog/123", "/ru/catalog/hyundai/sonata",
  "/ru/catalog/opengraph-image", "/xx/catalog", "/ru/ru/catalog", "/catalog.xml", "/ru/my-catalog",
  "/en/auction", "/auction", "/auction/", "/ru/auction/", "/ko/auction",
  "/ru/auction/lot/42", "/ru/auction/lotte", "/ru/auction/sk", "/ru/auctions", "/ru/auction-x",
  "/ka/favorites", "/favorites", "/ru/favorites/", "/ru/favorite", "/ar/compare",
  "/compare", "/ru/compare/1-2", "/ru/comparex", "/ru/parts", "/ru/parts/",
  "/ru/parts/86511-2S000", "/ru/parts/86511-2S000--bumper-front", "/en/parts/86511--x", "/ko/parts/86511--x", "/ka/parts/PN--a-b-c",
  "/ar/parts/PN--", "/ru/parts/--slug", "/ru/parts/a--b/c", "/parts/PN--slug", "/RU/parts/PN--slug",
  "/xx/parts/PN--slug", "/ru/parts/category/engine", "/ru/parts/PN---triple", "/ru/blog", "/ru/blog/post-1",
  "/ru/calculator", "/en/calculator/kz", "/ru/tracking", "/ru/about", "/ru/contacts",
  "/api/recommended", "/api/recommended/", "/api/recommended/x", "/api/recommendedx", "/api/vehicle/123",
  "/api/vehicles", "/api/carnect/search", "/api/carnect", "/api/cars", "/api/cars/list",
  "/api/carsx", "/api/kcar/lot", "/api/parts/search",
  "/api/parts", "/api/track", "/api/auth/callback", "/API/cars", "/api",
  "/ru/api/cars", "/admin", "/admin/login", "/admin/auction", "/administrator",
  "/auth/callback", "/_next/static/x.js", "/favicon.ico", "/favicon_io/site.webmanifest", "/opengraph-image",
  "/twitter-image", "/ru/opengraph-image", "/sitemap.xml", "/sitemap/0.xml", "/robots.txt",
  "/ru/robots-guide", "/icon.svg", "/apple-icon.png", "/llms.txt", "/ru/catalog/photo.jpg",
  "/carpicture1", "/carpicture12/a.jpg", "/carpicture", "/carpictures", "/cdn-cgi/l/email-protection",
  "/cdn-cgi", "/ru/cdn-cgi/x", "/ko/", "/ko/blog/post", "/kofe",
  "/ko/parts/PN--slug", "/en/auction?x", "/ru/auction/index", "/ru/auction.xml", "/ru/sitemaps",
];

describe("эталон: новые функции совпадают со старыми регулярками", () => {
  it("набор путей не меньше 100", () => {
    expect(PATHS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(PATHS).size).toBe(PATHS.length);
  });

  it.each(PATHS)("%s", (p) => {
    expect(isKoreaBlockedPath(p)).toBe(legacyKoreaBlockedPath(p));
    expect(isExcludedPath(p)).toBe(legacyExcluded(p));
    expect(isGonePath(p)).toBe(legacyGone(p));
    expect(koToEnPath(p)).toBe(legacyKo(p));
    expect(legacyPartsRedirect(p)).toBe(legacyParts(p));
    expect(isAuctionShowcasePath(p)).toBe(legacyAuctionShowcase(p));
  });
});

// ─── Эталон всего порядка шагов handle() до выноса ───────────────────────────
type Input = { path: string; search: string; host: string; ua: string; country: string };

function legacyCanonical(host: string): boolean {
  const h = host.split(":")[0].toLowerCase();
  return h === CANONICAL_HOST || h === "localhost" || h === "127.0.0.1";
}

function legacyDecision(r: Input): RouteDecision {
  if (/electron/i.test(r.ua) && !r.host.startsWith("localhost")) return { kind: "electron-forbidden" };
  if (legacyCanonical(r.host) && r.country.toUpperCase() === "KR" && legacyKoreaBlockedPath(r.path)) {
    return { kind: "korea-blocked", api: r.path.startsWith("/api/") };
  }
  if (legacyGone(r.path)) return { kind: "gone" };
  const ko = legacyKo(r.path);
  if (ko !== null) return { kind: "redirect", status: 301, pathname: ko };
  const part = legacyParts(r.path);
  if (part !== null) return { kind: "redirect", status: 308, pathname: part };
  if (r.path.startsWith("/admin")) return { kind: "admin" };
  if (r.path === "/robots.txt" && !legacyCanonical(r.host)) return { kind: "service-robots" };
  if (r.search && legacyAuctionShowcase(r.path) && isbot(r.ua) && !legacyLinkPreviewBot(r.ua)) {
    return { kind: "auction-bot-blocked" };
  }
  if (legacyExcluded(r.path)) return { kind: "excluded" };
  return { kind: "page" };
}

function decide(r: Input): RouteDecision {
  return classifyRequest({
    path: r.path,
    hasSearch: !!r.search,
    host: r.host,
    ua: r.ua,
    isBot: isbot(r.ua),
    country: r.country,
    canonical: isCanonicalHostHeader(r.host),
  });
}

const HUMAN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const GPTBOT = "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)";
const TELEGRAM = "TelegramBot (like TwitterBot)";
const ELECTRON = "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Electron/30.0 Safari/537.36";
const UAS = [HUMAN, GPTBOT, TELEGRAM, ELECTRON, ""];
const HOSTS = [CANONICAL_HOST, "office.kmotors.shop", "localhost:3000", "127.0.0.1:3000"];
const COUNTRIES = ["KR", "kr", "RU", ""];
const SEARCHES = ["", "?make=kia&page=2"];

describe("матрица путь × хост × страна × бот × query совпадает с эталоном", () => {
  it("все сочетания", () => {
    let n = 0;
    for (const path of PATHS) for (const host of HOSTS) for (const country of COUNTRIES)
      for (const ua of UAS) for (const search of SEARCHES) {
        const r = { path, host, country, ua, search };
        expect(decide(r), JSON.stringify(r)).toEqual(legacyDecision(r));
        n++;
      }
    expect(n).toBe(PATHS.length * HOSTS.length * COUNTRIES.length * UAS.length * SEARCHES.length);
  });
});

const www = (path: string, country = "", ua = HUMAN, search = "") =>
  decide({ path, host: CANONICAL_HOST, country, ua, search });

describe("Корея (боевой хост)", () => {
  it.each(["/ru/catalog", "/en/auction", "/ka/favorites", "/ar/compare", "/catalog", "/ko/catalog/1"])(
    "страница %s — 403 из KR, открыта из RU",
    (p) => {
      expect(www(p, "KR")).toEqual({ kind: "korea-blocked", api: false });
      expect(www(p, "RU").kind).not.toBe("korea-blocked");
    },
  );

  it.each(["/api/recommended", "/api/carnect/search", "/api/vehicle/1", "/api/cars", "/api/kcar/x"])(
    "API %s — 403 JSON из KR",
    (p) => {
      expect(www(p, "KR")).toEqual({ kind: "korea-blocked", api: true });
      expect(www(p, "RU")).toEqual({ kind: "excluded" });
    },
  );

  it.each(["/ru", "/ru/parts", "/ru/blog", "/ru/calculator", "/api/parts/search", "/ru/catalogue", "/RU/catalog"])(
    "%s из KR не блокируется",
    (p) => expect(www(p, "KR").kind).not.toBe("korea-blocked"),
  );

  it("служебный хост из KR не блокируется", () => {
    expect(decide({ path: "/ru/catalog", host: "office.kmotors.shop", country: "KR", ua: HUMAN, search: "" }))
      .toEqual({ kind: "page" });
  });

  it("бот из KR тоже получает 403 на каталог", () => {
    expect(www("/ru/catalog", "KR", GPTBOT)).toEqual({ kind: "korea-blocked", api: false });
  });
});

describe("исключения из языкового редиректа", () => {
  it.each(["/favicon.ico", "/opengraph-image", "/twitter-image", "/sitemap.xml", "/icon.svg", "/llms.txt", "/api/track", "/auth/callback"])(
    "%s — excluded",
    (p) => expect(www(p)).toEqual({ kind: "excluded" }),
  );
  it.each(["/", "/catalog", "/ru/blog"])("%s — page (дальше язык/сессия)", (p) => expect(www(p)).toEqual({ kind: "page" }));
});

describe("410, 301, 308", () => {
  it.each(["/carpicture1", "/carpicture12/a.jpg", "/cdn-cgi/l/x"])("%s — 410", (p) => expect(www(p)).toEqual({ kind: "gone" }));
  it.each(["/carpicture", "/cdn-cgi"])("%s — не 410", (p) => expect(www(p).kind).not.toBe("gone"));

  it("ko → en", () => {
    expect(www("/ko")).toEqual({ kind: "redirect", status: 301, pathname: "/en" });
    expect(www("/ko/blog/post")).toEqual({ kind: "redirect", status: 301, pathname: "/en/blog/post" });
    expect(www("/kofe").kind).not.toBe("redirect");
  });

  it("PN--name-slug → PN", () => {
    expect(www("/ru/parts/86511-2S000--bumper-front")).toEqual({ kind: "redirect", status: 308, pathname: "/ru/parts/86511-2S000" });
    expect(www("/ka/parts/PN--a-b-c")).toEqual({ kind: "redirect", status: 308, pathname: "/ka/parts/PN" });
    expect(www("/ru/parts/86511-2S000")).toEqual({ kind: "page" });
    expect(www("/parts/PN--slug").kind).not.toBe("redirect");
  });
});

describe("боты на витрине аукциона", () => {
  const q = "?make=kia";
  it("GPTBot с фильтром — 403, без фильтра — page", () => {
    expect(www("/ru/auction", "", GPTBOT, q)).toEqual({ kind: "auction-bot-blocked" });
    expect(www("/ru/auction", "", GPTBOT)).toEqual({ kind: "page" });
  });
  it("превью Telegram и человек с фильтром — page", () => {
    expect(isLinkPreviewBot(TELEGRAM)).toBe(true);
    expect(www("/ru/auction", "", TELEGRAM, q)).toEqual({ kind: "page" });
    expect(www("/ru/auction", "", HUMAN, q)).toEqual({ kind: "page" });
  });
  it("лот аукциона с фильтром боту не закрыт", () => {
    expect(www("/ru/auction/lot/1", "", GPTBOT, q)).toEqual({ kind: "page" });
  });
});

describe("cookie сессии Supabase", () => {
  it.each([
    [["sb-abc-auth-token"], true],
    [["sb-abc-auth-token.0", "sb-abc-auth-token.1"], true],
    [["sb-supabase-auth-token.1"], true],
    [["kmotors-lang", "x-user-country"], false],
    [["sb-abc-auth-token-code-verifier"], false],
    [["sb-abc-auth-token.01"], false],
    [["xsb-abc-auth-token"], false],
    [[], false],
  ])("%j → %s", (names, expected) => expect(hasSupabaseSessionCookie(names)).toBe(expected));
});
