import { OG_CONTENT_TYPE, OG_SIZE, makeOgRoute, ogCopy } from "@/lib/ogCard";

// Страница объявляет свой openGraph — значит нужен свой файл карточки,
// иначе og:image не будет вовсе. См. makeOgRoute в src/lib/ogCard.tsx.
export const alt = ogCopy("home", "ru").alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default makeOgRoute("home");
