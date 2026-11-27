import { describe, expect, it } from "vitest";
import { getString } from "@/components/Catalog/Row/utils";
import { CAR_STORAGE_FEE_KRW } from "@/lib/carPricing";
import { escapeEncarQuery } from "@/lib/encarQuery";

const ACTION = "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.기아.))";
/** Все шесть параметров фильтра пустые — так их шлёт форма, пока ничего не выбрано. */
const EMPTY = { priceMin: "", priceMax: "", mileageMin: "", mileageMax: "", yearMin: "", yearMax: "" };

describe("getString: диапазоны фильтра", () => {
  it("сбор в 만원 — целое число (иначе сдвиг цены даст дробные границы)", () => {
    expect(CAR_STORAGE_FEE_KRW % 10_000).toBe(0);
  });

  it("пустые параметры формы не добавляют диапазонов", () => {
    expect(getString({ action: ACTION, ...EMPTY })).toBe(ACTION);
  });

  it("цена: границы сдвигаются на стояночный сбор (на карточке — Encar + сбор)", () => {
    const fee = CAR_STORAGE_FEE_KRW / 10_000;
    const q = getString({ action: ACTION, ...EMPTY, priceMin: "1500", priceMax: "2000" });
    expect(q).toContain(`_.Price.range(${1500 - fee}..${2000 - fee}).`);
  });

  it("цена «только до»: открытая нижняя граница", () => {
    const fee = CAR_STORAGE_FEE_KRW / 10_000;
    expect(getString({ action: ACTION, ...EMPTY, priceMax: "1500" })).toContain(
      `_.Price.range(..${1500 - fee}).`,
    );
  });

  it("цена «только от»: открытая верхняя граница", () => {
    const fee = CAR_STORAGE_FEE_KRW / 10_000;
    expect(getString({ action: ACTION, ...EMPTY, priceMin: "3000" })).toContain(
      `_.Price.range(${3000 - fee}..).`,
    );
  });

  it("цена ниже сбора не уходит в минус", () => {
    expect(getString({ action: ACTION, ...EMPTY, priceMin: "30", priceMax: "40" })).toContain(
      "_.Price.range(0..0).",
    );
  });

  it("пробег уходит как есть, год — YYYY00..YYYY99", () => {
    const q = getString({
      action: ACTION,
      ...EMPTY,
      mileageMin: "10000",
      mileageMax: "30000",
      yearMin: "2020",
      yearMax: "2022",
    });
    expect(q).toContain("_.Mileage.range(10000..30000).");
    expect(q).toContain("_.Year.range(202000..202299).");
  });

  it("диапазоны вклеиваются ВНУТРЬ закрывающей скобки запроса", () => {
    const q = getString({ action: ACTION, ...EMPTY, mileageMax: "30000" });
    expect(q.startsWith(ACTION.slice(0, -1))).toBe(true);
    expect(q.endsWith(")")).toBe(true);
  });

  it("поиск по номеру игнорирует диапазоны", () => {
    expect(getString({ carNo: "12가3456", action: ACTION, priceMax: "1000" })).toContain("Simple.keyword(");
  });

  it("мусор в числовых параметрах не попадает в запрос (Encar на него отвечает 400)", () => {
    for (const bad of ["abc", "-5", "1.5", "1e5", " ", "2020.5", "1&sr=x", "1#2"]) {
      const q = getString({ action: ACTION, ...EMPTY, priceMax: bad, mileageMax: bad, yearMax: bad, yearMin: bad });
      expect(q, bad).toBe(ACTION);
    }
  });

  it("повтор параметра (массив из searchParams) тоже отбрасывается", () => {
    const q = getString({ action: ACTION, ...EMPTY, priceMax: ["1", "2"] as unknown as string });
    expect(q).toBe(ACTION);
  });
});

describe("escapeEncarQuery", () => {
  it("«+» гибридов кодируется — иначе сервер читает его как пробел", () => {
    expect(escapeEncarQuery("BadgeGroup.가솔린+전기 2500cc.")).toBe("BadgeGroup.가솔린%2B전기 2500cc.");
  });

  it("«&» и «#» кодируются — они обрывают значение q", () => {
    expect(escapeEncarQuery("a&sr=1#x")).toBe("a%26sr=1%23x");
  });

  it("уже закодированный запрос не трогаем (нет двойного кодирования «%»)", () => {
    const encoded = "(And.Hidden.N._.Simple.keyword(%EA%B0%80%EC%9D%B4).)";
    expect(escapeEncarQuery(encoded)).toBe(encoded);
  });

  it("обычный запрос остаётся как был", () => {
    const q = "(And.Hidden.N._.(C.CarType.Y._.Manufacturer.기아.))";
    expect(escapeEncarQuery(q)).toBe(q);
  });
});
