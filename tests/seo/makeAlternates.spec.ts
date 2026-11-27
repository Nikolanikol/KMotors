import { describe, expect, it } from "vitest";
import { makeAlternates } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

describe("makeAlternates", () => {
  it("по умолчанию x-default = ru: остальные страницы сайта не меняются", () => {
    const a = makeAlternates("en", "/catalog");
    expect(a.languages["x-default"]).toBe(`${SITE_URL}/ru/catalog`);
    expect(a.canonical).toBe(`${SITE_URL}/en/catalog`);
  });

  it("xDefault: 'en' переключает только x-default, канонический адрес и языки прежние", () => {
    const a = makeAlternates("ru", "/catalog/43148397", { xDefault: "en" });
    expect(a.languages["x-default"]).toBe(`${SITE_URL}/en/catalog/43148397`);
    expect(a.canonical).toBe(`${SITE_URL}/ru/catalog/43148397`);
    expect(Object.keys(a.languages).sort()).toEqual(["ar", "en", "ka", "ru", "x-default"]);
    expect(a.languages.ru).toBe(`${SITE_URL}/ru/catalog/43148397`);
  });

  it("xDefault: 'ru' эквивалентен умолчанию, главная ('') даёт адрес без хвостового слэша", () => {
    expect(makeAlternates("ru", "", { xDefault: "ru" })).toEqual(makeAlternates("ru", ""));
    expect(makeAlternates("en", "", { xDefault: "en" }).languages["x-default"]).toBe(`${SITE_URL}/en`);
  });

  it("opts без xDefault не ломает умолчание", () => {
    expect(makeAlternates("ka", "/x", {}).languages["x-default"]).toBe(`${SITE_URL}/ru/x`);
  });
});
