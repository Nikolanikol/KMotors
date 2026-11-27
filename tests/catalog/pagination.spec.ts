import { describe, expect, it } from "vitest";
import {
  CATALOG_FILTER_KEYS,
  CATALOG_MAX_OFFSET,
  catalogSeo,
  hasCatalogFilters,
  maxCatalogPage,
  pageHref,
  pageWindow,
  parseManufacture,
  parsePageParam,
  reachableTotalPages,
  resolvePage,
} from "@/lib/catalogPagination";

describe("parsePageParam: нормализация ?page=", () => {
  it("целое из цифр проходит", () => {
    expect(parsePageParam("1")).toBe(1);
    expect(parsePageParam("7")).toBe(7);
    expect(parsePageParam("007")).toBe(7);
  });
  it("0, пусто, undefined → 1", () => {
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("")).toBe(1);
    expect(parsePageParam(undefined)).toBe(1);
  });
  it("отрицательные, дроби, мусор, экспонента, пробелы → 1", () => {
    for (const bad of ["-1", "-50", "1.5", "abc", "1e3", " 5", "5 ", "+5", "NaN", "Infinity", "5abc", "0x10"]) {
      expect(parsePageParam(bad), bad).toBe(1);
    }
  });
  it("массив (?page=2&page=3) → 1", () => {
    expect(parsePageParam(["2", "3"])).toBe(1);
  });
  it("слишком длинное число → 1 (не раздуваем offset)", () => {
    expect(parsePageParam("1234567890123")).toBe(1);
  });
});

describe("потолок глубины", () => {
  it("потолок зависит от размера страницы: offset не выше CATALOG_MAX_OFFSET", () => {
    expect(maxCatalogPage(20)).toBe(CATALOG_MAX_OFFSET / 20);
    expect(maxCatalogPage(10)).toBe(CATALOG_MAX_OFFSET / 10);
    expect((maxCatalogPage(20) - 1) * 20).toBeLessThan(CATALOG_MAX_OFFSET);
    expect(maxCatalogPage(20) * 20).toBeLessThanOrEqual(CATALOG_MAX_OFFSET);
  });
  it("resolvePage: выше потолка — outOfRange, на потолке — нет", () => {
    const max = maxCatalogPage(20);
    expect(resolvePage(String(max), 20)).toMatchObject({ page: max, outOfRange: false });
    expect(resolvePage(String(max + 1), 20)).toMatchObject({ page: max + 1, outOfRange: true });
    expect(resolvePage("abc", 20)).toMatchObject({ page: 1, outOfRange: false });
  });
  it("на мобиле потолок в страницах вдвое выше", () => {
    expect(resolvePage(String(maxCatalogPage(20) + 1), 10).outOfRange).toBe(false);
  });
  it("reachableTotalPages: по числу машин, но не глубже потолка; пусто → 0", () => {
    expect(reachableTotalPages(0, 20)).toBe(0);
    expect(reachableTotalPages(NaN, 20)).toBe(0);
    expect(reachableTotalPages(41, 20)).toBe(3);
    expect(reachableTotalPages(139_821, 20)).toBe(maxCatalogPage(20));
  });
});

describe("pageWindow: окно номеров", () => {
  it("одна страница или ничего — окна нет", () => {
    expect(pageWindow(1, 1)).toEqual([]);
    expect(pageWindow(1, 0)).toEqual([]);
  });
  it("мало страниц — все подряд, включая последнюю", () => {
    expect(pageWindow(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(pageWindow(4, 3)).toEqual([1, 2, 3]); // current выше total прижимается
  });
  it("начало: первая, ±2, хвостовое «…», последней нет", () => {
    expect(pageWindow(1, 100)).toEqual([1, 2, 3, "gap"]);
    expect(pageWindow(3, 100)).toEqual([1, 2, 3, 4, 5, "gap"]);
  });
  it("середина: первая, «…», current±2, «…»", () => {
    expect(pageWindow(50, 100)).toEqual([1, "gap", 48, 49, 50, 51, 52, "gap"]);
    expect(pageWindow(4, 100)).toEqual([1, 2, 3, 4, 5, 6, "gap"]);
    expect(pageWindow(5, 100)).toEqual([1, "gap", 3, 4, 5, 6, 7, "gap"]);
  });
  it("потолок: на последней достижимой хвостового «…» нет и номер не выходит за total", () => {
    const max = maxCatalogPage(20);
    const w = pageWindow(max, max);
    expect(w).toEqual([1, "gap", max - 2, max - 1, max]);
    expect(w.filter((x) => typeof x === "number" && x > max)).toEqual([]);
    expect(pageWindow(max - 1, max).at(-1)).toBe(max);
  });
  it("окно ±1 для узкого экрана", () => {
    expect(pageWindow(50, 100, 1)).toEqual([1, "gap", 49, 50, 51, "gap"]);
    expect(pageWindow(1, 5, 1)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(1, 6, 1)).toEqual([1, 2, "gap"]);
  });
});

describe("pageHref: адрес страницы с сохранением фильтра", () => {
  const base = "/ru/catalog";
  const sp = {
    action: "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.기아.))",
    page: "3",
    priceMin: "1000",
    priceMax: "3000",
    mileageMin: "",
    mileageMax: "50000",
    yearMin: "2020",
    yearMax: "2024",
    manufacture: "Kia",
    carNo: "12가3456",
  };

  it("меняет только page, остальные параметры идут как были", () => {
    const url = new URL(pageHref(base, sp, 5), "https://x.test");
    expect(url.pathname).toBe(base);
    expect(url.searchParams.get("page")).toBe("5");
    for (const [k, v] of Object.entries(sp)) {
      if (k !== "page") expect(url.searchParams.get(k), k).toBe(v);
    }
    expect([...url.searchParams.keys()]).toHaveLength(Object.keys(sp).length);
  });
  it("страница 1 — без page (нет дубля /catalog?page=1)", () => {
    expect(pageHref(base, { page: "4" }, 1)).toBe(base);
    expect(pageHref(base, { ...sp, page: "4" }, 1)).not.toContain("page=");
  });
  it("без параметров: голый путь и ?page=N", () => {
    expect(pageHref(base, {}, 1)).toBe(base);
    expect(pageHref(base, {}, 2)).toBe(`${base}?page=2`);
  });
  it("«+» и «&» в action не теряются, массив сохраняется, undefined пропускается", () => {
    const url = new URL(pageHref(base, { action: "a+b&c#d", tag: ["x", "y"], gone: undefined }, 2), "https://x.test");
    expect(url.searchParams.get("action")).toBe("a+b&c#d");
    expect(url.searchParams.getAll("tag")).toEqual(["x", "y"]);
    expect(url.searchParams.has("gone")).toBe(false);
  });
  it("page-массив заменяется одним значением", () => {
    expect(pageHref(base, { page: ["1", "2"] }, 3)).toBe(`${base}?page=3`);
  });
});

describe("parseManufacture", () => {
  it("снимает «%» только если он есть, не съедает букву", () => {
    expect(parseManufacture("%Kia")).toBe("Kia");
    expect(parseManufacture("Kia")).toBe("Kia");
  });
  it("null/undefined/пусто/массив", () => {
    expect(parseManufacture("null")).toBe("");
    expect(parseManufacture("undefined")).toBe("");
    expect(parseManufacture(undefined)).toBe("");
    expect(parseManufacture(["Kia", "Hyundai"])).toBe("Kia");
  });
});

describe("catalogSeo: noindex и canonical", () => {
  it("голый /catalog индексируется, canonical на себя", () => {
    expect(catalogSeo({}, 20)).toEqual({ index: true, path: "/catalog" });
  });
  it("?page=1, мусорный page и посторонние параметры — всё та же первая страница", () => {
    for (const sp of [{ page: "1" }, { page: "abc" }, { page: "0" }, { page: ["2", "3"] }, { utm_source: "x" }, { priceMin: "", yearMax: "  " }]) {
      expect(catalogSeo(sp, 20), JSON.stringify(sp)).toEqual({ index: true, path: "/catalog" });
    }
  });
  it("?page=N (N>1): noindex, canonical на саму страницу, не на /catalog", () => {
    expect(catalogSeo({ page: "2" }, 20)).toEqual({ index: false, path: "/catalog?page=2" });
    expect(catalogSeo({ page: "37" }, 20).path).toBe("/catalog?page=37");
  });
  it("страница вне потолка: canonical на последнюю достижимую", () => {
    const max = maxCatalogPage(20);
    expect(catalogSeo({ page: String(max + 500) }, 20)).toEqual({ index: false, path: `/catalog?page=${max}` });
  });
  it("КАЖДЫЙ параметр фильтра по одному делает страницу noindex", () => {
    for (const key of CATALOG_FILTER_KEYS) {
      const seo = catalogSeo({ [key]: "x" }, 20);
      expect(seo.index, key).toBe(false);
      expect(hasCatalogFilters({ [key]: "x" }), key).toBe(true);
    }
  });
  it("в частности те, что раньше не входили: action, priceMin, mileageMin/Max, carNo", () => {
    for (const key of ["action", "priceMin", "mileageMin", "mileageMax", "carNo"]) {
      expect(catalogSeo({ [key]: "5" }, 20).index, key).toBe(false);
    }
  });
  it("пустой фильтр (форма шлёт пустые значения) и manufacture=null не noindex", () => {
    const empty = Object.fromEntries(CATALOG_FILTER_KEYS.map((k) => [k, ""]));
    expect(catalogSeo(empty, 20).index).toBe(true);
    expect(catalogSeo({ manufacture: "null" }, 20).index).toBe(true);
    expect(catalogSeo({ manufacture: "undefined" }, 20).index).toBe(true);
  });
  it("фильтр: canonical на себя в фиксированном порядке, без мусорных параметров и без page=1", () => {
    const seo = catalogSeo({ yearMin: "2020", utm_source: "x", manufacture: "%Kia", page: "1" }, 20);
    expect(seo.index).toBe(false);
    expect(seo.path).toBe("/catalog?manufacture=Kia&yearMin=2020");
  });
  it("фильтр + страница: оба в canonical", () => {
    expect(catalogSeo({ priceMax: "3000", page: "4" }, 10).path).toBe("/catalog?priceMax=3000&page=4");
  });
});
