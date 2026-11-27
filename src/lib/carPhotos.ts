// Подписи и выбор фото карточки авто. Отдельный лёгкий модуль: его импортирует
// клиентская галерея (Carousel), поэтому тяжёлых зависимостей здесь быть не
// должно — словарь опций и прочее лежит в carContent.ts.
type Lang = "ru" | "en" | "ka" | "ar";
const asLang = (l: string): Lang => (l === "en" || l === "ka" || l === "ar" ? l : "ru");

// ---------------------------------------------------------------------------
// Фото: подписи и выбор для разметки
// ---------------------------------------------------------------------------

export interface EncarPhoto {
  code?: string;
  path?: string;
  type?: string;
}

const PHOTO_TYPE_LABELS: Record<Lang, Record<string, string>> = {
  ru: { OUTER: "экстерьер", INNER: "салон", OPTION: "детали" },
  en: { OUTER: "exterior", INNER: "interior", OPTION: "details" },
  ka: { OUTER: "ექსტერიერი", INNER: "სალონი", OPTION: "დეტალები" },
  ar: { OUTER: "المظهر الخارجي", INNER: "المقصورة", OPTION: "تفاصيل" },
};

/** Подписи типов фото Encar на языке страницы. THUMBNAIL и прочее — без подписи. */
export function photoTypeLabels(lang: string): Record<string, string> {
  return PHOTO_TYPE_LABELS[asLang(lang)];
}

/** «{Марка Модель Год} — фото N, экстерьер». Тип не известен — без хвоста. */
export function photoAlt(opts: {
  carName?: string;
  photoLabel: string;
  index: number;
  type?: string;
  typeLabels?: Record<string, string>;
}): string {
  const n = opts.index + 1;
  const typeLabel = opts.type ? opts.typeLabels?.[opts.type] : undefined;
  const base = opts.carName ? `${opts.carName} — ${opts.photoLabel} ${n}` : `photo ${n}`;
  return typeLabel ? `${base}, ${typeLabel}` : base;
}

const ENCAR_CDN = "https://ci.encar.com";
const SCHEMA_IMAGE_MAX = 8;
const SCHEMA_TYPE_ORDER = ["OUTER", "INNER", "OPTION"];

/**
 * 5–8 разных кадров для `image` в JSON-LD: сперва экстерьер, затем салон, затем
 * детали. THUMBNAIL — дубли основных кадров (тот же путь), их пропускаем. Фото
 * нет — пустой массив, и поле в разметке не выводим (не `[null]`).
 */
export function pickSchemaImages(photos: EncarPhoto[] | null | undefined, max = SCHEMA_IMAGE_MAX): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const type of SCHEMA_TYPE_ORDER) {
    const group = (photos ?? [])
      .filter((ph) => ph?.type === type && ph.path)
      .sort((a, b) => (a.code ?? "").localeCompare(b.code ?? "", undefined, { numeric: true }));
    for (const ph of group) {
      if (seen.has(ph.path!)) continue;
      seen.add(ph.path!);
      out.push(`${ENCAR_CDN}${ph.path}?impolicy=heightRate&rh=720&cw=1280&ch=720&cg=Center`);
      if (out.length >= max) return out;
    }
  }
  return out;
}

