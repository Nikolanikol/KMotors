import { OG_SIZE, makeStaticOgRoute, ogContentType, ogCopy } from "@/lib/ogCard";

/**
 * Легаси-блог без языкового префикса. У сегмента нет параметра `lang`, а
 * контент этих постов русский (`title_ru`) — поэтому язык задан явно.
 */
export const alt = ogCopy("blog", "ru").alt;
export const size = OG_SIZE;
export const contentType = ogContentType("blog");

export default makeStaticOgRoute("blog", "ru");
