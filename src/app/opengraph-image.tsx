import { OG_SIZE, makeStaticOgRoute, ogContentType, ogCopy } from "@/lib/ogCard";

/**
 * Корневая карточка — для маршрутов без языкового префикса (легаси
 * `/blog/[slug]`) и как фолбэк. Языковые страницы берут свою из
 * `[lang]/opengraph-image.tsx`.
 *
 * ⚠️ Маршрут достижим только потому, что `isExcluded` в `src/middleware.ts`
 * знает про `opengraph-image`: путь без расширения иначе уходит редиректом
 * на `/ru/opengraph-image`, которого нет (307 → 404).
 */
export const alt = ogCopy("fallback", "ru").alt;
export const size = OG_SIZE;
export const contentType = ogContentType("fallback");

export default makeStaticOgRoute("fallback", "ru");
