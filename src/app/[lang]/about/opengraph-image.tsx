import { OG_SIZE, makeOgRoute, ogContentType, ogCopy } from "@/lib/ogCard";

// Страница объявляет свой openGraph — значит нужен свой файл карточки,
// иначе og:image не будет вовсе. См. makeOgRoute в src/lib/ogCard.tsx.
export const alt = ogCopy("fallback", "ru").alt;
export const size = OG_SIZE;
export const contentType = ogContentType("fallback");

export default makeOgRoute("fallback");
