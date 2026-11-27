import { describe, expect, it } from "vitest";
import {
  hasFilterParams,
  hasPrice,
  isPlausiblePartKey,
  jsonLd,
  manufacturerLabel,
  normalizePartKey,
  partKeyLikePattern,
} from "@/lib/partsSeo";

describe("hasFilterParams: noindex только по белому списку", () => {
  it("метки кампаний не считаются фильтром", () => {
    expect(hasFilterParams({ utm_source: "x", utm_medium: "cpc", gclid: "1", fbclid: "2", yclid: "3" })).toBe(false);
    expect(hasFilterParams({})).toBe(false);
  });

  it("каждый параметр из белого списка включает noindex", () => {
    for (const k of ["q", "cat", "cats", "sub", "brand", "brands", "model", "sort", "min", "max", "page"]) {
      expect(hasFilterParams({ [k]: "1" })).toBe(true);
    }
  });

  it("фильтр + метка = фильтр; пустое значение фильтром не является", () => {
    expect(hasFilterParams({ utm_source: "x", cat: "brakes" })).toBe(true);
    expect(hasFilterParams({ q: "" })).toBe(false);
    expect(hasFilterParams({ q: "  " })).toBe(false);
    expect(hasFilterParams({ brands: ["kia", "hyundai"] })).toBe(true);
    expect(hasFilterParams({ brands: [] })).toBe(false);
    expect(hasFilterParams({ cat: undefined })).toBe(false);
  });
});

describe("jsonLd", () => {
  it("экранирует «<», чтобы название не закрыло <script>", () => {
    const out = jsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});

describe("hasPrice", () => {
  it("только положительное число", () => {
    expect(hasPrice(1)).toBe(true);
    expect(hasPrice(0)).toBe(false);
    expect(hasPrice(-5)).toBe(false);
    expect(hasPrice(null)).toBe(false);
    expect(hasPrice(undefined)).toBe(false);
    expect(hasPrice(Number.NaN)).toBe(false);
  });
});

describe("manufacturerLabel", () => {
  it("корейское имя из словаря → латиница, чужое — как в базе, пусто → null", () => {
    expect(manufacturerLabel("현대모비스")).toBe("Hyundai Mobis");
    expect(manufacturerLabel("Bosch")).toBe("Bosch");
    expect(manufacturerLabel("  ")).toBeNull();
    expect(manufacturerLabel(null)).toBeNull();
    expect(manufacturerLabel(undefined)).toBeNull();
  });
});

describe("варианты слага артикула", () => {
  it("normalizePartKey не различает регистр, дефисы и пробелы", () => {
    expect(normalizePartKey("51712-b4000")).toBe("51712B4000");
    expect(normalizePartKey("51712 B4000")).toBe("51712B4000");
    expect(normalizePartKey("51712B4000")).toBe(normalizePartKey("51712-B4000"));
  });

  it("образец ILIKE пропускает дефис в любом месте", () => {
    expect(partKeyLikePattern("51712B4000")).toBe("5%1%7%1%2%B%4%0%0%0");
  });

  it("мусор ботов (короткий, без цифр, слишком длинный) в базу не идёт", () => {
    expect(isPlausiblePartKey("51712B4000")).toBe(true);
    expect(isPlausiblePartKey("ABC")).toBe(false);
    expect(isPlausiblePartKey("ABCDEFGHIJ")).toBe(false);
    expect(isPlausiblePartKey("1".repeat(30))).toBe(false);
  });
});
