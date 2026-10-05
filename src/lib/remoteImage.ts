// Фото аукционов с чужих CDN — какие пропускать через оптимизатор Next.
//
// ⚠️ Замер 05.10.2026, одно фото плитки каталога (плитка ~300 px):
//   K Car 10 КБ · Autohub 18 КБ · Autobell 31 КБ — площадка сама отдаёт уменьшенное;
//   Lotte 208 КБ · SK 249 КБ · HeyDealer 646 КБ (до 940) — ОРИГИНАЛЫ в несколько тысяч px.
// Каталог по умолчанию открывается новыми лотами, а это почти всегда HeyDealer:
// 24 плитки ≈ 15 МБ, первый экран — 3–5 МБ. В галерее лота миниатюра 90×60
// тоже была полным оригиналом.
//
// Поэтому тяжёлые хосты идут через /_next/image (sharp на сервере, webp,
// кеш в .next/cache/images), лёгкие — напрямую: их пережатие только грело бы
// сервер. Хосты обязаны быть и здесь, и в images.remotePatterns next.config.ts —
// иначе оптимизатор ответит 400 и картинка не покажется.

export const HEAVY_IMAGE_HOSTS = [
  "heydealer-api.s3.amazonaws.com",
  "imgmk.lotteautoauction.net",
  "auction.skcarrental.com",
] as const;

export function isHeavyImage(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return (HEAVY_IMAGE_HOSTS as readonly string[]).includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * Адрес уменьшенной копии для обычного <img>. `width` — из стандартной сетки
 * Next (imageSizes 16…384, deviceSizes 640…3840), иначе оптимизатор вернёт 400.
 * Лёгкие и неизвестные хосты — как есть.
 */
export function resizedImage(url: string | null | undefined, width: 128 | 256 | 384 | 640 | 828, quality = 70): string | null {
  if (!url) return null;
  return isHeavyImage(url) ? `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}` : url;
}
