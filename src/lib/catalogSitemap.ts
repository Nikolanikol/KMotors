// Сайтмап каталога авто: чистая часть — константы, окно, сборка XML.
// Запросы к Supabase лежат рядом, в catalogSitemapDb.ts: здесь нет ни базы, ни
// сети, поэтому всё это проверяется vitest'ом без заглушек (tests/catalog/catalogSitemap.spec.ts).
//
// Почему источник — таблица cars_seen, а не выдача Encar, и что это починило —
// docs/core-seo.md, раздел «Сайтмап каталога идёт из cars_seen». Что менялось
// 27.11.2026 (английские адреса, окно 20 000, отбор по подтверждённой живости) —
// там же и в docs/core-cars-data.md.

import { SITE_URL } from "@/lib/site";
import { LANGS } from "@/lib/lang";

/** Машин в одном файле сайтмапа. Файл = 2 × этого числа записей <url> (en + ru). */
export const CATALOG_SITEMAP_PAGE_SIZE = 1_000;

/**
 * Потолок машин в сайтмапе: 20 000 = 20 файлов по 1 000 машин = 40 000 записей <url>
 * в сумме, не больше 2 000 в файле. Лимиты Google — 50 000 URL и 50 МБ на файл; файл
 * весит ~1,4 МБ (замер по шаблону: ~700 байт на запись с пятью xhtml:link).
 *
 * Было 5 000, и это не работало: окно «новейшие N» скользит, и каждая добавленная
 * машина вытесняет самую старую. Адрес жил в карте дни, Google не успевал дойти
 * (замер 02.10.2026: 8 из 8 проверенных URL «ни разу не сканировались»).
 * Теперь окно ЛИПКОЕ — см. catalogSitemapDb.ts: берутся самые ранние по first_seen_at
 * из подтверждённо живых, поэтому живая машина занимает своё место, пока её не продали.
 *
 * ⚠️ Было 5 000 URL машин против 48 700 запчастей (~9%), стало 40 000 записей <url>
 * (20 000 × en+ru) против тех же 48 700 — каталог авто почти сравнялся с запчастями по
 * числу адресов. Краулерский бюджет делится не поровну (docs/core-seo.md), поэтому
 * приоритет машин по-прежнему 0.5 против 0.7 у запчастей; смотреть в GSC, не потеснили ли
 * карточки запчастей (отчёт «Статистика обхода»), и при потеснении снижать потолок.
 */
export const CATALOG_SITEMAP_MAX = 20_000;

/**
 * Машина попадает в карту, только если её подтвердили живой не позднее стольких дней
 * назад (cars_seen.last_seen_at: листинг, рендер карточки или суточная проверка живости,
 * carsLiveness.ts). Это и есть отсев проданных, о которых мы ещё не знаем: подтверждение
 * протухло — адрес сам выпадает из карты, не дожидаясь 404.
 *
 * 21 день подобран под проверку живости: 1 000 проверок в сутки обходят 20 000 машин за
 * 20 дней, то есть каждая живая машина успевает быть подтверждена раньше, чем протухнет.
 * Меньше значение — карта чище, но нужно больше проверок в сутки (потолок/дни).
 */
export const CATALOG_SITEMAP_FRESH_DAYS = 21;

/**
 * Если по свежести набралось меньше этого — крон встал надолго, и строгий отбор отдал
 * бы почти пустую карту. Индекс без каталога Google читает как «этих URL у нас больше
 * нет», это хуже, чем отдать кого есть: режим деградирует до «все непроданные, новые
 * сверху» (как до 27.11.2026).
 */
export const CATALOG_SITEMAP_FLOOR = 2_000;

/**
 * Языки, чьи адреса выводятся в <loc>. ka/ar их не получают: карточка на них рендерит
 * английский фолбэк, то есть дубль /en/ под чужим префиксом. В xhtml:link они остаются —
 * hreflang описывает группу страниц целиком. Порядок важен: сначала английский (упор на
 * него), потом русский.
 */
export const CATALOG_SITEMAP_LOC_LANGS = ["en", "ru"] as const;

/** x-default — английский. Страница карточки выставляет то же самое в метаданных. */
export const CATALOG_SITEMAP_X_DEFAULT = "en";

/** Строка карты: адрес и даты. */
export interface SitemapCar {
  encar_id: string;
  first_seen_at: string;
  last_seen_at?: string | null;
}

// Id у Encar — число. В XML кладём только его: всё остальное — мусор из таблицы,
// а в <loc> он попал бы без экранирования.
const ID_RE = /^\d{6,10}$/;

/** Сколько файлов нужно на `count` машин (потолок учитывается здесь же). */
export function sitemapFileCount(count: number): number {
  const capped = Math.min(Math.max(0, count), CATALOG_SITEMAP_MAX);
  return Math.ceil(capped / CATALOG_SITEMAP_PAGE_SIZE);
}

/**
 * Какие позиции окна отдаёт файл №page (с единицы). null — страницы нет вовсе:
 * мусор в адресе или за потолком. Хвост окна обрезается потолком, а не размером файла.
 */
export function sitemapPageWindow(
  page: number
): { offset: number; take: number } | null {
  if (!Number.isInteger(page) || page < 1) return null;
  const offset = (page - 1) * CATALOG_SITEMAP_PAGE_SIZE;
  if (offset >= CATALOG_SITEMAP_MAX) return null;
  return {
    offset,
    take: Math.min(CATALOG_SITEMAP_PAGE_SIZE, CATALOG_SITEMAP_MAX - offset),
  };
}

/** Граница свежести ISO: раньше неё подтверждение считается протухшим. */
export function freshCutoffIso(now: number, days = CATALOG_SITEMAP_FRESH_DAYS): string {
  return new Date(now - days * 86_400_000).toISOString();
}

/** Адрес карточки без хвостового слэша, абсолютный (как в hreflang страницы). */
export function carUrl(lang: string, id: string): string {
  return `${SITE_URL}/${lang}/catalog/${id}`;
}

/** Все языки группы hreflang: английский первым, остальные в порядке LANGS. */
function hreflangOrder(): string[] {
  return [CATALOG_SITEMAP_X_DEFAULT, ...LANGS.filter((l) => l !== CATALOG_SITEMAP_X_DEFAULT)];
}

/** Набор xhtml:link одной машины: все языки + x-default = английский. */
export function carAlternates(id: string): string {
  return [
    ...hreflangOrder().map(
      (lang) =>
        `    <xhtml:link rel="alternate" hreflang="${lang}" href="${carUrl(lang, id)}"/>`
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${carUrl(CATALOG_SITEMAP_X_DEFAULT, id)}"/>`,
  ].join("\n");
}

/**
 * <lastmod> — дата, когда машину впервые увидели МЫ. Она у машины не меняется
 * (upsert first_seen_at не трогает), поэтому тег не просит переобход на ровном месте.
 *
 * last_seen_at сюда НЕ годится, хотя «дата обновления» звучит подходяще: это отметка
 * «подтвердили живой», она сдвигается при каждой проверке и каждом проходе листинга.
 * Отдавать её значило бы объявлять изменённой всю карту каждые три недели, а Google
 * на таком сайте перестаёт верить lastmod целиком. Контент карточки мы не отслеживаем
 * (цену в таблице не сверяем), честной «даты изменения» у нас нет.
 */
export function carLastmod(car: SitemapCar): string {
  return String(car.first_seen_at).slice(0, 10);
}

/** Две записи <url> на машину: /en/, затем /ru/. Мусорный id — пустая строка. */
export function carUrlBlocks(car: SitemapCar): string[] {
  if (!ID_RE.test(String(car.encar_id))) return [];
  const lastmod = carLastmod(car);
  const alternates = carAlternates(car.encar_id);
  return CATALOG_SITEMAP_LOC_LANGS.map(
    (lang) => `  <url>
    <loc>${carUrl(lang, car.encar_id)}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>0.5</priority>
${alternates}
  </url>`
  );
}

export const EMPTY_CATALOG_SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

/** Файл сайтмапа целиком. Дубли id внутри файла схлопываются (страховка, не штатный путь). */
export function buildCatalogSitemapXml(cars: SitemapCar[]): string {
  const seen = new Set<string>();
  const blocks: string[] = [];
  for (const car of cars) {
    if (seen.has(car.encar_id)) continue;
    seen.add(car.encar_id);
    blocks.push(...carUrlBlocks(car));
  }
  if (blocks.length === 0) return EMPTY_CATALOG_SITEMAP_XML;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${blocks.join("\n")}
</urlset>`;
}
