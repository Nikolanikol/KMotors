import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildCarDescription,
  buildCarJsonLd,
  countKnownOptions,
  localizeColor,
  notableOptions,
  parseSellerPlace,
  type CarFacts,
} from "@/lib/carContent";
import { photoAlt, photoTypeLabels, pickSchemaImages } from "@/lib/carPhotos";
import type { CarsDict } from "@/lib/carLabels";

const HANGUL = /[ㄱ-힝]/;

// Словарь Encar в том виде, как его даёт cars.json (ru-набор).
const DICT_RU: CarsDict = { 가솔린: "Бензин", 오토: "Автомат", SUV: "SUV", 세단: "Седан" };
const DICT_EN: CarsDict = { 가솔린: "Gasoline", 오토: "Automatic", 세단: "Sedan", 스포츠카: "Sports Car", 왜건: "Wagon 5-Door" };

const BASE: CarFacts = {
  lang: "ru",
  brand: "Hyundai",
  model: "Tucson",
  yearMonth: "202410",
  mileage: 15624,
  displacement: 1598,
  fuelRaw: "가솔린",
  transmissionRaw: "오토",
  bodyRaw: "SUV",
  colorRaw: "흰색",
  seats: 5,
  address: "경기 수원시 권선구",
  standardCodes: ["010", "079", "087", "023", "005"],
  choiceCodes: ["1091"],
  record: { accidents: 0, owners: 1 },
  inspection: { simpleRepair: false, date: "2026-11-12" },
};

const dictFor = (lang: string) => (lang === "ru" ? DICT_RU : DICT_EN);
const text = (f: CarFacts) => buildCarDescription(f, dictFor(f.lang)).paragraphs.join("\n");

describe("buildCarDescription: данные машины, а не шаблон", () => {
  it("ru: год и месяц, пробег, объём, КПП, кузов, цвет, места, регион, опции", () => {
    const t = text(BASE);
    expect(t).toContain("октябрь 2024");
    expect(t).toContain("км");
    expect(t).toContain("бензин, 1.6 л");
    expect(t).toContain("коробка передач: автомат");
    expect(t).toContain("кузов: SUV");
    expect(t).toContain("цвет: белый");
    expect(t).toContain("мест: 5");
    expect(t).toContain("регион Кёнги, город Сувон");
    expect(t).toContain("Опций в объявлении Encar: 5");
  });

  it("en: тот же состав на английском", () => {
    const t = text({ ...BASE, lang: "en" });
    expect(t).toContain("October 2024");
    expect(t).toContain("gasoline, 1.6 L");
    expect(t).toContain("transmission: automatic");
    expect(t).toContain("Gyeonggi region, Suwon");
    expect(t).toContain("Options listed in the Encar ad: 5");
  });

  it("en: значения из словаря идут со строчной, аббревиатуры не трогаем", () => {
    expect(text({ ...BASE, lang: "en", bodyRaw: "스포츠카" })).toContain("body: sports car");
    expect(text({ ...BASE, lang: "en", bodyRaw: "왜건" })).toContain("body: wagon 5-door");
    expect(text({ ...BASE, lang: "en", bodyRaw: "SUV" })).toContain("body: SUV");
  });

  it("ka и ar собираются без хангыля и без «undefined»", () => {
    for (const lang of ["ka", "ar"]) {
      const t = text({ ...BASE, lang });
      expect(t).not.toMatch(HANGUL);
      expect(t).not.toContain("undefined");
      expect(t).toContain("2024");
      expect(t).toContain("3–6");
    }
  });

  it("известных ошибок шаблона нет: «бензин двигателем», «7–14 дней», противоречие сроков", () => {
    for (const lang of ["ru", "en", "ka", "ar"]) {
      const v = buildCarDescription({ ...BASE, lang }, dictFor(lang));
      const all = [v.heading, ...v.paragraphs, v.summary, ...v.tags].join("\n");
      expect(all).not.toMatch(/бензин двигател/i);
      expect(all).not.toMatch(/литровым бензин/i);
      expect(all).not.toContain("7–14");
      expect(all).toContain("3–6");
    }
  });

  it("не обещает «без ДТП», даже когда обращений по страховке 0", () => {
    for (const lang of ["ru", "en", "ka", "ar"]) {
      const t = text({ ...BASE, lang, record: { accidents: 0, owners: 0 } });
      expect(t).not.toMatch(/без ДТП|accident-free|no accidents|უავარიო|بدون حوادث/i);
    }
    // но факт из записи называет: число обращений и смен владельца
    expect(text({ ...BASE, record: { accidents: 0, owners: 2 } })).toContain(
      "обращений по страховке — 0, смен владельца — 2",
    );
  });

  it("нет записи истории / нет листа осмотра — этих предложений нет", () => {
    const t = text({ ...BASE, record: null, inspection: null });
    expect(t).not.toContain("страховой истории");
    expect(t).not.toContain("листе осмотра");
    expect(text(BASE)).toContain("простой ремонт» внешних панелей не стоит");
    expect(text({ ...BASE, inspection: { simpleRepair: true, date: null } })).toContain(
      "простой ремонт» внешних панелей стоит",
    );
    // флаг в листе неизвестен — не придумываем
    expect(text({ ...BASE, inspection: { simpleRepair: null, date: null } })).not.toContain("листе осмотра");
  });

  it("пропущенные поля пропускаются, а не превращаются в «null» или хангыль", () => {
    const t = text({
      ...BASE,
      colorRaw: "알수없는색",
      address: "알수없음 어딘가",
      bodyRaw: "알수없는 차체",
      mileage: 0,
      seats: null,
      yearMonth: null,
    });
    expect(t).not.toMatch(HANGUL);
    expect(t).not.toMatch(/null|undefined|NaN/);
    expect(t).not.toContain("цвет:");
    expect(t).not.toContain("Продавец");
    expect(t).not.toContain("кузов:");
    expect(t).not.toContain("Пробег");
  });

  it("две разные машины дают разный текст", () => {
    const a = text(BASE);
    const b = text({ ...BASE, yearMonth: "201907", mileage: 98000, colorRaw: "검정색", address: "서울 강남구", standardCodes: ["001"] });
    expect(a).not.toEqual(b);
    expect(b).toContain("июль 2019");
    expect(b).toContain("регион Сеул");
    expect(b).not.toContain("город");
  });

  it("телефон и улица из адреса в текст не попадают", () => {
    const t = text({ ...BASE, address: "경기 수원시 권선구 평동로 65 031-278-9461" });
    expect(t).not.toMatch(/031|평동로|65/);
  });
});

describe("parseSellerPlace / цвет / опции", () => {
  it("регион и город на ru и en; города уровня региона не дублируются", () => {
    expect(parseSellerPlace("경기 수원시 권선구", "ru")).toEqual({ region: "Кёнги", city: "Сувон" });
    expect(parseSellerPlace("경기 수원시 권선구", "ka")).toEqual({ region: "Gyeonggi", city: "Suwon" });
    expect(parseSellerPlace("서울 강남구", "ru")).toEqual({ region: "Сеул", city: null });
    expect(parseSellerPlace("충청남도 천안시", "en")).toEqual({ region: "South Chungcheong", city: "Cheonan" });
    expect(parseSellerPlace("", "ru")).toBeNull();
    expect(parseSellerPlace("Нет такого", "ru")).toBeNull();
  });

  it("цвет: известный переводится, неизвестный — null", () => {
    expect(localizeColor("흰색", "ru")).toBe("белый");
    expect(localizeColor("검정색", "ar")).toBe("أسود");
    expect(localizeColor("???", "ru")).toBeNull();
  });

  it("опции: считаются только известные словарю, значимые — по порядку и на языке страницы", () => {
    expect(countKnownOptions(["010", "079", "1091", "99999"])).toBe(2);
    expect(notableOptions(["010", "087", "079"], "en", 2)).toEqual(["360° around-view camera", "Adaptive cruise control"]);
    expect(notableOptions(["010"], "ru")[0]).toBe("Люк");
    expect(notableOptions(undefined, "ru")).toEqual([]);
  });
});

describe("фото: alt и выбор для разметки", () => {
  it("alt: «{авто} — фото N, экстерьер» на языке страницы; THUMBNAIL без типа", () => {
    const l = photoTypeLabels("ru");
    expect(photoAlt({ carName: "Kia K5 2022", photoLabel: "фото", index: 0, type: "OUTER", typeLabels: l })).toBe(
      "Kia K5 2022 — фото 1, экстерьер",
    );
    expect(photoAlt({ carName: "Kia K5 2022", photoLabel: "photo", index: 9, type: "INNER", typeLabels: photoTypeLabels("en") })).toBe(
      "Kia K5 2022 — photo 10, interior",
    );
    expect(photoAlt({ carName: "Kia K5 2022", photoLabel: "фото", index: 1, type: "THUMBNAIL", typeLabels: l })).toBe(
      "Kia K5 2022 — фото 2",
    );
    expect(photoAlt({ photoLabel: "фото", index: 2 })).toBe("photo 3");
    expect(photoTypeLabels("ka").OPTION).toBeTruthy();
    expect(photoTypeLabels("ar").INNER).toBeTruthy();
  });

  const mk = (type: string, code: string, path = `/p/${code}.jpg`) => ({ type, code, path });

  it("image: 5–8 разных кадров, экстерьер первым, без THUMBNAIL-дублей", () => {
    const photos = [
      mk("THUMBNAIL", "012", "/p/001.jpg"),
      mk("INNER", "010"),
      mk("OUTER", "002"),
      mk("OUTER", "001"),
      mk("OUTER", "001", "/p/001.jpg"), // тот же путь, что у THUMBNAIL — дубль не нужен
      ...Array.from({ length: 12 }, (_, i) => mk("OPTION", String(20 + i))),
    ];
    const urls = pickSchemaImages(photos);
    expect(urls.length).toBeLessThanOrEqual(8);
    expect(urls.length).toBeGreaterThanOrEqual(5);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls[0]).toContain("/p/001.jpg");
    expect(urls[1]).toContain("/p/002.jpg");
    expect(urls.every((u) => u.startsWith("https://ci.encar.com/"))).toBe(true);
  });

  it("нет фото — пустой массив, в JSON-LD поля image нет (не [null])", () => {
    expect(pickSchemaImages(undefined)).toEqual([]);
    expect(pickSchemaImages([mk("THUMBNAIL", "001")])).toEqual([]);
    const ld = buildCarJsonLd({ ...LD, images: [] });
    expect("image" in ld).toBe(false);
  });
});

const LD = {
  pageUrl: "https://www.kmotors.shop/ru/catalog/43148397",
  carName: "Hyundai Tucson Inspiration",
  year: "2024",
  brand: "Hyundai",
  description: "Описание на языке страницы.",
  images: ["https://ci.encar.com/a.jpg"],
  vin: "KMHJE81BGRU386662",
  yearMonth: "202410",
  formYear: "2024",
  mileage: 15624,
  displacement: 1598,
  fuelRaw: "가솔린",
  bodyType: "SUV",
  color: "белый",
  transmission: "Автомат",
  seats: 5,
  priceKrw: 31_430_000,
};

describe("buildCarJsonLd", () => {
  const ld = buildCarJsonLd(LD) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

  it("Offer.url = адрес самой страницы, цена и валюта — видимые (KRW, со сбором)", () => {
    expect(ld.offers.url).toBe(LD.pageUrl);
    expect(ld.offers.price).toBe(31_430_000);
    expect(ld.offers.priceCurrency).toBe("KRW");
    expect(ld.offers.availability).toBe("https://schema.org/InStock");
  });

  it("name с годом, description на языке страницы, массив image", () => {
    expect(ld.name).toBe("Hyundai Tucson Inspiration 2024");
    expect(ld.description).toBe(LD.description);
    expect(Array.isArray(ld.image)).toBe(true);
  });

  it("поля машины: кузов, цвет, КПП, топливо, двигатель, пробег, даты, места", () => {
    expect(ld.bodyType).toBe("SUV");
    expect(ld.color).toBe("белый");
    expect(ld.vehicleTransmission).toBe("Автомат");
    expect(ld.fuelType).toBe("https://schema.org/Gasoline");
    expect(ld.vehicleEngine.engineDisplacement.value).toBe(1598);
    expect(ld.mileageFromOdometer.value).toBe(15624);
    expect(ld.vehicleModelDate).toBe("2024");
    expect(ld.productionDate).toBe("2024-10");
    expect(ld.vehicleSeatingCapacity).toBe(5);
  });

  it("ничего не выдумано: нет priceValidUntil, рейтингов и отзывов", () => {
    const s = JSON.stringify(ld);
    expect(s).not.toMatch(/priceValidUntil|aggregateRating|review|ratingValue/i);
  });

  it("нет значения — нет поля", () => {
    const bare = buildCarJsonLd({
      pageUrl: LD.pageUrl, carName: "X", year: null, brand: "", description: "", images: [], priceKrw: 1,
    }) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    for (const k of ["image", "description", "vehicleIdentificationNumber", "bodyType", "color",
      "vehicleTransmission", "fuelType", "vehicleEngine", "mileageFromOdometer", "vehicleModelDate",
      "productionDate", "vehicleSeatingCapacity"]) {
      expect(k in bare).toBe(false);
    }
    expect(bare.name).toBe("X");
    expect(bare.offers.url).toBe(LD.pageUrl);
  });
});

describe("исходники не возвращают прежние ошибки шаблона", () => {
  it("в описании карточки нет «бензин двигателем» и «7–14 дней»", () => {
    for (const f of ["src/lib/carContent.ts", "src/components/Catalog/CarDetail/CarDescription.tsx"]) {
      const src = readFileSync(f, "utf8");
      expect(src).not.toMatch(/\$\{fuel\} двигателем/);
      expect(src).not.toMatch(/7–14 (дней|days)/);
    }
  });
});
