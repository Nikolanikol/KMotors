// Определение языка для middleware (Вариант A).
// Каскад: cookie → язык браузера (любая наша локаль) → страна (Cloudflare) → дефолт.
// Чистые функции без Node-API — безопасны для edge-runtime middleware.

export const LANGS = ["ru", "en", "ka", "ar"] as const;
export const DEFAULT_LANG = "ru";

export function isLang(lang: string): boolean {
  return (LANGS as readonly string[]).includes(lang);
}

// Страна (cf-ipcountry, ISO-3166 alpha-2) → локаль.
// Используется только как фолбэк, когда язык браузера не из наших четырёх.
const COUNTRY_LANG: Record<string, string> = {
  // Грузия
  GE: "ka",
  // Арабские страны
  SA: "ar", AE: "ar", EG: "ar", IQ: "ar", JO: "ar", KW: "ar", LB: "ar",
  QA: "ar", BH: "ar", OM: "ar", YE: "ar", SY: "ar", LY: "ar", TN: "ar",
  DZ: "ar", MA: "ar", SD: "ar", PS: "ar", MR: "ar",
  // СНГ / русскоязычные
  RU: "ru", BY: "ru", KZ: "ru", UZ: "ru", KG: "ru", TJ: "ru", TM: "ru",
  AM: "ru", AZ: "ru", MD: "ru",
};

// Разбор Accept-Language: "ru-RU,ru;q=0.9,en;q=0.8" → первый поддерживаемый
// язык по убыванию q-веса. Возвращает локаль или null.
export function fromAcceptLanguage(header: string | null | undefined): string | null {
  if (!header) return null;
  const parsed = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const weight = qParam ? parseFloat(qParam.trim().slice(2)) : 1;
      const lang = tag.split("-")[0].toLowerCase(); // en-US → en
      return { lang, weight: Number.isNaN(weight) ? 0 : weight };
    })
    .sort((a, b) => b.weight - a.weight);
  return parsed.find((p) => isLang(p.lang))?.lang ?? null;
}

// Страна → локаль (или null, если страна не в карте / пустая).
export function fromCountry(country: string | null | undefined): string | null {
  if (!country) return null;
  return COUNTRY_LANG[country.toUpperCase()] ?? null;
}

// Вариант A: cookie → язык браузера → страна → дефолт.
export function resolveLang(opts: {
  cookie?: string | null;
  acceptLanguage?: string | null;
  country?: string | null;
}): string {
  const { cookie, acceptLanguage, country } = opts;

  // 1. Явный выбор пользователя (cookie переключателя языка)
  if (cookie && isLang(cookie)) return cookie;

  // 2. Язык браузера, если поддерживаем (включая en — по правилу A он главнее страны)
  const byBrowser = fromAcceptLanguage(acceptLanguage);
  if (byBrowser) return byBrowser;

  // 3. Фолбэк по стране (Cloudflare) — только для «экзотических» языков браузера
  const byCountry = fromCountry(country);
  if (byCountry) return byCountry;

  // 4. Крайний дефолт
  return DEFAULT_LANG;
}
