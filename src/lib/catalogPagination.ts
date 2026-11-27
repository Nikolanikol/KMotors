/**
 * Пагинация листинга /[lang]/catalog: чистые функции без React и сети.
 * Их зовут CarsRow, Pagination и generateMetadata страницы каталога — одно место
 * правды про номер страницы, потолок глубины, адреса ссылок и noindex.
 */

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

/**
 * Глубина, дальше которой листинг Encar отдаёт мусор: смещение (offset) считается
 * от начала выдачи, и «безопасных» машин всего CATALOG_MAX_OFFSET штук.
 *
 * Замер 27.11.2026 (premium-листинг, `|ModifiedDate|offset|20`): offset 0…9 980
 * дают разные уникальные страницы; с offset 10 000 выдача превращается в набор из
 * 4 повторяющихся «пачек», одни и те же ответы приходят на offset 10 000 / 30 000 /
 * 154 500, 15 000 / 45 000 / 50 000, 20 000 / 40 000, 25 000 / 35 000, и повторный
 * запрос того же offset (30 000) отдаёт уже другую пачку. Похоже на окно выдачи
 * в 10 000 записей. Прежняя оценка «кламп после ~50k» была ошибкой выборки: все
 * замеры лежали глубже 10 000. Границу 9 980…10 000 вплотную проверить не удалось
 * (Encar перестал отвечать), поэтому берём 9 000 с запасом.
 *
 * Offset = (page-1)*pageSize, то есть потолок в страницах зависит от размера
 * страницы: 450 на десктопе (20 карточек) и 900 на мобиле (10).
 */
export const CATALOG_MAX_OFFSET = 9_000;

/** Последняя достижимая страница при данном размере страницы. */
export function maxCatalogPage(pageSize: number): number {
  return Math.max(1, Math.floor(CATALOG_MAX_OFFSET / Math.max(1, pageSize)));
}

/**
 * Номер страницы из `?page=`. Принимается только целое из цифр: `abc`, `1.5`, `-3`,
 * `1e3`, пусто, массив (`?page=1&page=2`) — это 1. Раньше такие значения давали
 * offset NaN, Encar отвечал 400, а каталог — «временно недоступен».
 */
export function parsePageParam(raw: unknown): number {
  if (typeof raw !== "string" || !/^\d{1,9}$/.test(raw)) return 1;
  return Math.max(1, Number(raw));
}

export interface ResolvedPage {
  /** Запрошенная страница (≥ 1), без обрезки по потолку. */
  page: number;
  /** Потолок для этого размера страницы. */
  maxPage: number;
  /** page выше потолка: в Encar за такой страницей не ходим. */
  outOfRange: boolean;
}

export function resolvePage(raw: unknown, pageSize: number): ResolvedPage {
  const page = parsePageParam(raw);
  const maxPage = maxCatalogPage(pageSize);
  return { page, maxPage, outOfRange: page > maxPage };
}

/** Сколько страниц показывать в пагинации: по числу машин, но не глубже потолка. */
export function reachableTotalPages(count: number, pageSize: number): number {
  if (!Number.isFinite(count) || count <= 0 || pageSize <= 0) return 0;
  return Math.min(Math.ceil(count / pageSize), maxCatalogPage(pageSize));
}

export type PageItem = number | "gap";

/**
 * Окно номеров: первая, текущая ±siblings, многоточия. Последняя страница отдельным
 * пунктом НЕ выводится — при тысячах страниц она недостижима (потолок глубины), а
 * ссылка на неё вела бы в мусор. Исключение: когда страниц так мало, что окно и
 * есть весь список (total ≤ 2·siblings+3), номера показываются подряд.
 * Хвостовое «…» — признак, что дальше есть ещё страницы.
 */
export function pageWindow(current: number, total: number, siblings = 2): PageItem[] {
  if (total <= 1) return [];
  const cur = Math.min(Math.max(1, current), total);
  if (total <= 2 * siblings + 3) return Array.from({ length: total }, (_, i) => i + 1);

  const start = Math.max(1, cur - siblings);
  const end = Math.min(total, cur + siblings);
  const items: PageItem[] = [];
  if (start > 1) items.push(1);
  if (start > 2) items.push("gap");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < total) items.push("gap");
  return items;
}

/**
 * Адрес страницы списка с СОХРАНЕНИЕМ всех параметров фильтра (action, цена, пробег,
 * год, manufacture, carNo и всё остальное) — меняется только `page`. Страница 1
 * живёт без `page`, чтобы не плодить дубль `/catalog?page=1`.
 */
export function pageHref(basePath: string, sp: CatalogSearchParams, page: number): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === "page" || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) qs.append(key, v);
  }
  if (page > 1) qs.set("page", String(page));
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

/**
 * Бренд из `?manufacture=`. ⚠️ Раньше стояло `.slice(1)`: фильтр дописывал в начало
 * лишний «%» (`%Kia`), и срез его снимал, — но ссылки со страниц моделей и из
 * JSON-LD главной идут БЕЗ «%» (`?manufacture=Kia`), и срез съедал первую букву
 * («ia»). Теперь «%» снимается только если он есть; «null»/«undefined» — след
 * прежней сборки адреса без выбранной марки — считаем пустым значением.
 */
export function parseManufacture(raw: string | string[] | undefined): string {
  const first = Array.isArray(raw) ? raw[0] : raw;
  const value = (first ?? "").replace(/^%/, "").trim();
  return value === "null" || value === "undefined" ? "" : value;
}

/** Параметры, которые меняют выдачу. Любой непустой делает страницу noindex. */
export const CATALOG_FILTER_KEYS = [
  "action",
  "manufacture",
  "priceMin",
  "priceMax",
  "mileageMin",
  "mileageMax",
  "yearMin",
  "yearMax",
  "carNo",
] as const;

function firstValue(raw: string | string[] | undefined): string {
  const v = Array.isArray(raw) ? raw.find((x) => x.trim() !== "") ?? "" : raw ?? "";
  return v.trim();
}

/** Значение фильтра после разбора: непустая строка или "". */
function filterValue(key: (typeof CATALOG_FILTER_KEYS)[number], sp: CatalogSearchParams): string {
  return key === "manufacture" ? parseManufacture(sp[key]) : firstValue(sp[key]);
}

export function hasCatalogFilters(sp: CatalogSearchParams): boolean {
  return CATALOG_FILTER_KEYS.some((key) => filterValue(key, sp) !== "");
}

export interface CatalogSeo {
  /** Можно ли индексировать: только голый /catalog без фильтров и без страницы > 1. */
  index: boolean;
  /** Путь (с query) самой страницы — для canonical и hreflang, без языка и домена. */
  path: string;
}

/**
 * Индексация и canonical листинга.
 *
 *   /catalog (и ?page=1, ?page=abc, ?utm=… — всё, что нормализуется в первую
 *     страницу без фильтров)           → index, canonical /catalog
 *   /catalog?page=N (N > 1)            → noindex,follow, canonical = СЕБЯ
 *   любой фильтр (action, марка, цена, пробег, год, carNo) → noindex,follow,
 *     canonical = себя (известные параметры в фиксированном порядке, без мусора)
 *
 * Почему noindex у страниц списка: лента отсортирована по ModifiedDate и
 * пересобирается при каждом переподнятии объявления, поэтому страница N через час
 * держит другие машины — индексировать нечего, а карточки Google берёт из
 * sitemap-catalog (из cars_seen). Ссылки пагинации при этом настоящие, и краулер
 * по ним ходит (follow).
 *
 * Почему canonical на себя, а не на /catalog: пара «noindex + canonical на другой
 * адрес» противоречива — Google вправе счесть, что noindex относится и к адресу из
 * canonical, то есть к самому /catalog. Самореференс этого не допускает. Страница
 * вне потолка глубины получает canonical на последнюю достижимую, чтобы набор
 * адресов в canonical был ограничен.
 */
export function catalogSeo(sp: CatalogSearchParams, pageSize: number): CatalogSeo {
  const { page, maxPage } = resolvePage(sp.page, pageSize);
  const filtered = hasCatalogFilters(sp);
  if (!filtered && page === 1) return { index: true, path: "/catalog" };

  const qs = new URLSearchParams();
  for (const key of CATALOG_FILTER_KEYS) {
    const value = filterValue(key, sp);
    if (value !== "") qs.set(key, value);
  }
  const canonicalPage = Math.min(page, maxPage);
  if (canonicalPage > 1) qs.set("page", String(canonicalPage));
  const s = qs.toString();
  return { index: false, path: s ? `/catalog?${s}` : "/catalog" };
}
