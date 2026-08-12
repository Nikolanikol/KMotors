import { OG_SIZE, makeOgRoute, ogContentType, ogCopy } from "@/lib/ogCard";

// Карточка по умолчанию для всего под [lang]. Секции с собственным смыслом
// перекрывают её своим файлом.
export const alt = ogCopy("home", "ru").alt;
export const size = OG_SIZE;
export const contentType = ogContentType("home");

export default makeOgRoute("home");
