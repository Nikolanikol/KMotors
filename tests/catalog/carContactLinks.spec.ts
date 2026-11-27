import { describe, expect, it } from "vitest";
import { carContactLinks } from "@/lib/carContactLinks";
import { WA_PHONE } from "@/lib/contact";
import { SITE_URL } from "@/lib/site";

const ID = "39871234";
const NAME = "Kia Sportage 2.0 Prestige";
const textOf = (waUrl: string) => decodeURIComponent(waUrl.split("?text=")[1]);

describe("carContactLinks: ссылки мессенджеров с привязкой к машине", () => {
  it("Telegram: deep-link бота с car_<id>", () => {
    expect(carContactLinks("ru", ID, NAME).tgUrl).toBe(`https://t.me/KMOTORS_form_bot?start=car_${ID}`);
  });

  it("WhatsApp: наш номер, в тексте имя, id и ссылка на карточку", () => {
    const { waUrl } = carContactLinks("en", ID, NAME);
    expect(waUrl.startsWith(`https://wa.me/${WA_PHONE}?text=`)).toBe(true);
    const text = textOf(waUrl);
    expect(text).toContain(NAME);
    expect(text).toContain(`ID: ${ID}`);
    expect(text).toContain(`${SITE_URL}/en/catalog/${ID}`);
  });

  it("ссылка на карточку есть на каждом языке (раньше ka/ar её не имели)", () => {
    for (const lang of ["ru", "en", "ka", "ar", "ko"]) {
      expect(textOf(carContactLinks(lang, ID, NAME).waUrl)).toContain(`${SITE_URL}/${lang}/catalog/${ID}`);
    }
  });

  it("неизвестный язык — русский текст", () => {
    expect(textOf(carContactLinks("xx", ID, NAME).waUrl).startsWith("Здравствуйте!")).toBe(true);
  });

  it("имя с & и # не ломает query-строку", () => {
    const { waUrl } = carContactLinks("en", ID, "A&B #1");
    expect(waUrl.split("?text=")[1]).not.toMatch(/[&# ]/);
  });
});
