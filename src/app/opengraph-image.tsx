import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, ogCopy } from "@/lib/ogCard";

/**
 * Корневая карточка — для маршрутов без языкового префикса (легаси
 * `/blog/[slug]`) и как фолбэк. Языковые страницы берут свою из
 * `[lang]/opengraph-image.tsx`.
 *
 * ⚠️ Маршрут достижим только потому, что `isExcluded` в `src/middleware.ts`
 * знает про `opengraph-image`: путь без расширения иначе уходит редиректом
 * на `/ru/opengraph-image`, которого нет (307 → 404).
 */
export const alt = ogCopy("home", "ru").alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(<OgCard {...ogCopy("home", "ru")} />, { ...size });
}
