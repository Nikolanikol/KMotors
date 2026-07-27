import type { Resource } from "i18next";

// ⚠️ SERVER-ONLY. Импортировать ТОЛЬКО из серверных компонентов (напр. [lang]/layout).
// Здесь статически подключены все локали, но так как модуль тянется лишь серверным
// layout'ом, JSON остаётся в серверном бандле и НЕ попадает в клиентский. На клиент
// уезжает только сериализованный результат loadResources().
// (Не импортируй это в "use client" компонент — иначе все локали улетят в клиентский бандл.)
//
// Результат этой функции сериализуется в RSC-payload КАЖДОЙ страницы, поэтому его
// размер — это вес каждой страницы сайта. Раньше сюда безусловно уходили оба
// неймспейса обоих языков (~106 KB на страницу), из которых:
//   • en/common целиком дублировал активный язык — фолбэку нужно 0 ключей из 453
//     для ru и 6 из 453 для ka/ar;
//   • cars (76 KB en + ~6 KB активного) нужен ровно одной утилите
//     translateGenerationRow, то есть только каталогу авто, избранному и сравнению.
// Теперь en-фолбэк ужимается до реально недостающих ключей, а cars подключается
// только на тех маршрутах, где он используется.
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

type Dict = Record<string, unknown>;
type Ns = "common" | "cars";

const isBranch = (v: unknown): v is Dict =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Ветка en-словаря с одними лишь ключами, которых нет в активном языке.
 * Возвращает undefined, если добавлять нечего.
 *
 * Смысл: i18next обращается к fallbackLng только за отсутствующим ключом, поэтому
 * полный en-бандл в payload — чистый дубликат. Если у en значение-объект, а у
 * активного языка на том же месте лист (или наоборот), ветка берётся целиком —
 * такой конфликт типов трактуем в пользу фолбэка.
 */
function missingKeys(en: Dict, active: Dict | undefined): Dict | undefined {
  if (!active) return Object.keys(en).length ? en : undefined;
  const out: Dict = {};
  for (const [key, value] of Object.entries(en)) {
    const mine = active[key];
    if (isBranch(value)) {
      const sub = missingKeys(value, isBranch(mine) ? mine : undefined);
      if (sub) out[key] = sub;
    } else if (mine === undefined) {
      out[key] = value;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

// Дельта считается один раз на процесс: словари статические, а loadResources
// вызывается на каждый запрос.
const fallbackCache = new Map<string, Dict>();

function trimmedFallback(lang: string, ns: Ns): Dict | undefined {
  const cacheKey = `${lang}:${ns}`;
  if (!fallbackCache.has(cacheKey)) {
    const active = (BUNDLES as Record<string, Record<Ns, Dict>>)[lang]?.[ns];
    fallbackCache.set(cacheKey, missingKeys(BUNDLES.en[ns] as Dict, active) ?? {});
  }
  const delta = fallbackCache.get(cacheKey)!;
  return Object.keys(delta).length ? delta : undefined;
}

/**
 * Только неймспейс `cars` — активный язык + недостающие ключи из en.
 * Отдаётся маршрутами авто через <CarsDictionary/>, а не общим layout'ом:
 * layout под [lang] не перерисовывается при клиентской навигации, поэтому
 * переход /parts → /catalog оставил бы каталог без словаря.
 */
export function loadCarsResources(lang: string): Resource {
  return loadResources(lang, { cars: true, common: false });
}

export interface LocaleOptions {
  /**
   * Подключить неймспейс `cars` — словарь Encar (76 KB на en).
   * Нужен только там, где вызывается translateGenerationRow: каталог авто,
   * карточка авто, избранное, сравнение. По умолчанию false — вызывающий
   * обязан запросить его явно.
   */
  cars?: boolean;
  /** Отключить `common` — для догрузки одного лишь словаря Encar. */
  common?: boolean;
}

/** Ресурсы для i18next: активный язык + минимальный en-фолбэк. */
export function loadResources(lang: string, opts: LocaleOptions = {}): Resource {
  const namespaces: Ns[] = [
    ...(opts.common === false ? [] : (["common"] as Ns[])),
    ...(opts.cars ? (["cars"] as Ns[]) : []),
  ];
  const active = (BUNDLES as Record<string, Record<Ns, Dict>>)[lang];

  const pick = (bundle: Record<Ns, Dict>) =>
    Object.fromEntries(namespaces.map((ns) => [ns, bundle[ns]]));

  if (!active || lang === "en") {
    return { en: pick(BUNDLES.en as unknown as Record<Ns, Dict>) } as unknown as Resource;
  }

  const fallback = Object.fromEntries(
    namespaces
      .map((ns) => [ns, trimmedFallback(lang, ns)] as const)
      .filter(([, delta]) => delta !== undefined)
  );

  return {
    [lang]: pick(active),
    ...(Object.keys(fallback).length ? { en: fallback } : {}),
  } as unknown as Resource;
}
