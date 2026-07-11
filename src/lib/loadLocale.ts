import type { Resource } from "i18next";

// ⚠️ SERVER-ONLY. Импортировать ТОЛЬКО из серверных компонентов (напр. [lang]/layout).
// Здесь статически подключены все локали, но так как модуль тянется лишь серверным
// layout'ом, JSON остаётся в серверном бандле и НЕ попадает в клиентский. На клиент
// уезжает только сериализованный результат loadResources() — активный язык + en.
// (Не импортируй это в "use client" компонент — иначе все локали улетят в клиентский бандл.)
import enCommon from "../locales/en/common.json";
import enCars from "../locales/en/cars.json";
import ruCommon from "../locales/ru/common.json";
import ruCars from "../locales/ru/cars.json";
import kaCommon from "../locales/ka/common.json";
import kaCars from "../locales/ka/cars.json";
import arCommon from "../locales/ar/common.json";
import arCars from "../locales/ar/cars.json";

const BUNDLES = {
  en: { common: enCommon, cars: enCars },
  ru: { common: ruCommon, cars: ruCars },
  ka: { common: kaCommon, cars: kaCars },
  ar: { common: arCommon, cars: arCars },
} as const;

type Bundle = (typeof BUNDLES)[keyof typeof BUNDLES];

// Ресурсы для i18next: активный язык + en как фолбэк (кроме самих en-страниц).
export function loadResources(lang: string): Resource {
  const active = (BUNDLES as Record<string, Bundle>)[lang];
  if (!active || active === BUNDLES.en) {
    return { en: BUNDLES.en } as unknown as Resource;
  }
  return { [lang]: active, en: BUNDLES.en } as unknown as Resource;
}
