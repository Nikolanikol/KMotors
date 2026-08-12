import { OG_CONTENT_TYPE, OG_SIZE, makeOgRoute, ogCopy } from "@/lib/ogCard";

// Лента блога. Статья с обложкой перекрывает файловую конвенцию своим
// cover_url — это и нужно; сюда попадают посты без обложки.
export const alt = ogCopy("blog", "ru").alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default makeOgRoute("blog");
