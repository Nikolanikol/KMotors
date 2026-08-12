import { OG_SIZE, makeOgRoute, ogContentType, ogCopy } from "@/lib/ogCard";

// Страница объявляет свой openGraph — значит нужен свой файл карточки,
// иначе og:image не будет вовсе. См. makeOgRoute в src/lib/ogCard.tsx.
export const alt = ogCopy("parts", "ru").alt;
export const size = OG_SIZE;
export const contentType = ogContentType("parts");

export default makeOgRoute("parts");
