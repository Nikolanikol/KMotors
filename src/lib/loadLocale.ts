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
// Словарь калькуляторов растаможки. Пока заполнен только ru — en/ka/ar лежат
// заглушками до отдельного шага с переводами.
import enCustoms from "../locales/en/customs.json";
import ruCustoms from "../locales/ru/customs.json";
import kaCustoms from "../locales/ka/customs.json";
import arCustoms from "../locales/ar/customs.json";

const BUNDLES = {
  en: { common: enCommon, cars: enCars, customs: enCustoms },
  ru: { common: ruCommon, cars: ruCars, customs: ruCustoms },
  ka: { common: kaCommon, cars: kaCars, customs: kaCustoms },
  ar: { common: arCommon, cars: arCars, customs: arCustoms },
} as const;

type Dict = Record<string, unknown>;
type Ns = "common" | "cars" | "customs";

/**
 * Разделы `common`, которые НЕ раздаются глобально: замер 22.08.2026 показал, что
 * втроём они занимают 65% словаря (parts 36%, buy 16%, tracking 13%), а
 * используются ровно на своих маршрутах — проверено поиском по всем вызовам.
 * Раздел уезжает в RSC-payload КАЖДОЙ страницы, поэтому на главной, в блоге и в
 * каталоге авто это был чистый балласт: 33 KB словаря против 8 KB нужного.
 *
 * ⚠️ Добавляя сюда раздел, СНАЧАЛА убедись, что его ключи не зовутся динамически
 * из глобального компонента. Header зовёт навигацию как `t(link.labelKey)`, и
 * поиск по `t("nav.` таких мест НЕ находит — вынос `nav` дал бы сырые ключи в
 * шапке на всём сайте, чего не поймали бы ни lint, ни tsc, ни сборка.
 * Раздел из этого списка обязан быть подключён на своих страницах через
 * <SectionDictionary sections={[...]} />, иначе тексты станут сырыми ключами.
 */
export const ROUTE_SECTIONS = ["parts", "buy", "tracking"] as const;
export type RouteSection = (typeof ROUTE_SECTIONS)[number];

/** Оставить в словаре только перечисленные разделы либо, наоборот, выбросить их. */
function filterSections(dict: Dict, sections: readonly string[], mode: "keep" | "omit"): Dict {
  return Object.fromEntries(
    Object.entries(dict).filter(([key]) =>
      mode === "keep" ? sections.includes(key) : !sections.includes(key)
    )
  );
}

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

/**
 * Только неймспейс `customs` — тексты калькуляторов растаможки.
 * Подключается страницами под /calculator по той же причине, что и `cars`:
 * layout под [lang] при клиентской навигации не перерисовывается.
 */
export function loadCustomsResources(lang: string): Resource {
  return loadResources(lang, { customs: true, common: false });
}

/**
 * Только перечисленные разделы `common` — для маршрутов, которым нужен раздел из
 * ROUTE_SECTIONS. Подключается через <SectionDictionary/> на самой странице, а не
 * в [lang]/layout, по той же причине, что `cars`: layout при клиентской навигации
 * внутри [lang] не перерисовывается, поэтому переход с главной на /parts не донёс
 * бы словарь и тексты остались бы сырыми ключами.
 */
export function loadSectionResources(lang: string, sections: readonly string[]): Resource {
  return loadResources(lang, { sections });
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
  /**
   * Подключить неймспейс `customs` — тексты калькуляторов растаможки.
   * Нужен только маршрутам под /calculator, поэтому по умолчанию выключен:
   * иначе словарь уезжал бы в RSC-payload каждой страницы сайта.
   */
  customs?: boolean;
  /**
   * Отдать из `common` ТОЛЬКО перечисленные разделы. Используется маршрутными
   * догрузками (см. loadSectionResources); при отсутствии из `common`
   * выбрасываются разделы ROUTE_SECTIONS.
   */
  sections?: readonly string[];
}

/** Ресурсы для i18next: активный язык + минимальный en-фолбэк. */
export function loadResources(lang: string, opts: LocaleOptions = {}): Resource {
  const namespaces: Ns[] = [
    ...(opts.common === false ? [] : (["common"] as Ns[])),
    ...(opts.cars ? (["cars"] as Ns[]) : []),
    ...(opts.customs ? (["customs"] as Ns[]) : []),
  ];
  const active = (BUNDLES as Record<string, Record<Ns, Dict>>)[lang];

  // `common` режется по разделам: либо ровно запрошенные (маршрутная догрузка),
  // либо всё кроме ROUTE_SECTIONS (базовый набор для layout). Остальные
  // неймспейсы (`cars`, `customs`) отдаются целиком — они и так подключаются
  // только своими маршрутами.
  const sliceCommon = (dict: Dict) =>
    opts.sections
      ? filterSections(dict, opts.sections, "keep")
      : filterSections(dict, ROUTE_SECTIONS, "omit");

  const pick = (bundle: Record<Ns, Dict>) =>
    Object.fromEntries(
      namespaces.map((ns) => [ns, ns === "common" ? sliceCommon(bundle[ns]) : bundle[ns]])
    );

  if (!active || lang === "en") {
    return { en: pick(BUNDLES.en as unknown as Record<Ns, Dict>) } as unknown as Resource;
  }

  const fallback = Object.fromEntries(
    namespaces
      .map((ns) => {
        const delta = trimmedFallback(lang, ns);
        if (!delta || ns !== "common") return [ns, delta] as const;
        const cut = sliceCommon(delta);
        return [ns, Object.keys(cut).length ? cut : undefined] as const;
      })
      .filter(([, delta]) => delta !== undefined)
  );

  return {
    [lang]: pick(active),
    ...(Object.keys(fallback).length ? { en: fallback } : {}),
  } as unknown as Resource;
}
