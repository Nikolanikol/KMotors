import { OG_SIZE, makeOgRoute, ogContentType, ogCopy } from "@/lib/ogCard";

// Лента блога. Статья с обложкой перекрывает конвенцию своим cover_url.
export const alt = ogCopy("blog", "ru").alt;
export const size = OG_SIZE;
export const contentType = ogContentType("blog");

export default makeOgRoute("blog");
