// Чистые помощники SEO-страниц запчастей (/parts, /parts/[slug], category, fitment).
// Без обращений к БД и next/*: безопасно импортировать и из серверных, и из клиентских
// модулей, и из тестов (tests/seo/partsSeo.spec.ts).

/**
 * Параметры, которые превращают /parts в отфильтрованную выдачу. Только они делают
 * страницу noindex: utm_*, gclid, fbclid, yclid и прочие метки не меняют содержимое, и
 * noindex на них отнимал бы показы у чистого адреса, на который ведёт canonical.
 * Список обязан совпадать с параметрами, которые читает PartsCatalogClient.
 */
export const PARTS_FILTER_PARAMS = [
  "q",
  "cat",
  "cats",
  "sub",
  "brand",
  "brands",
  "model",
  "sort",
  "min",
  "max",
  "page",
] as const;

type SearchParams = Record<string, string | string[] | undefined>;

/** Есть ли в query хоть один непустой параметр фильтра из белого списка. */
export function hasFilterParams(sp: SearchParams): boolean {
  return PARTS_FILTER_PARAMS.some((key) => {
    const v = sp[key];
    if (Array.isArray(v)) return v.some((x) => x.trim() !== "");
    return typeof v === "string" && v.trim() !== "";
  });
}

/**
 * Сериализация для <script type="application/ld+json">. JSON.stringify не экранирует `<`,
 * и название детали с «</script>» закрыло бы тег и выпустило разметку наружу.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Цена в вонах задана и положительна. Иначе деталь «по запросу»: ни Offer, ни цены в сниппете. */
export function hasPrice(priceKrw: number | null | undefined): boolean {
  return typeof priceKrw === "number" && priceKrw > 0;
}

// Корейские названия производителей из parts_products.manufacturer → латиница для текстов.
export const MANUFACTURER_NAMES: Record<string, string> = {
  "현대모비스": "Hyundai Mobis",
  "기아모비스": "Kia Mobis",
  "현대자동차": "Hyundai Motor",
  "기아자동차": "Kia Motors",
  "만도": "Mando",
  "한온시스템": "Hanon Systems",
  "현대위아": "Hyundai Wia",
  "에스엘": "SL Corporation",
  "현대트랜시스": "Hyundai Transys",
  "현대케피코": "Hyundai Kefico",
};

/**
 * Название производителя для текста и разметки: латиница из словаря, иначе как в базе,
 * иначе null. Подставлять «Hyundai Mobis» вместо отсутствующего значения НЕЛЬЗЯ:
 * в базе есть детали других производителей, и текст про Mobis для них — неправда.
 */
export function manufacturerLabel(raw: string | null | undefined): string | null {
  const m = (raw ?? "").trim();
  if (!m) return null;
  return MANUFACTURER_NAMES[m] ?? m;
}

/** Ключ сравнения артикулов без учёта регистра, дефисов, пробелов и прочей пунктуации. */
export function normalizePartKey(s: string): string {
  return s.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
}

/**
 * ILIKE-образец для поиска артикула по ключу `normalizePartKey`: символы ключа через `%`,
 * то есть дефис в любом месте не мешает. Образец грубый (под него попадут и чужие
 * артикулы), поэтому результат ОБЯЗАТЕЛЬНО перепроверяется `normalizePartKey(row) === key`.
 * Ключ состоит только из [0-9A-Z], экранировать `%`/`_` не нужно.
 */
export function partKeyLikePattern(key: string): string {
  return key.split("").join("%");
}

/** Вариант слага стоит искать в базе: длиннее 5 знаков и с цифрой (артикул, а не мусор ботов). */
export function isPlausiblePartKey(key: string): boolean {
  return key.length >= 6 && key.length <= 24 && /\d/.test(key);
}
