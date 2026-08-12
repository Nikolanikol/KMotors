import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, ogCopy } from "@/lib/ogCard";

/**
 * Легаси-блог без языкового префикса. `makeOgRoute` тут не подходит: у сегмента
 * нет параметра `lang`, а контент этих постов русский (`title_ru`).
 */
export const alt = ogCopy("blog", "ru").alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(<OgCard {...ogCopy("blog", "ru")} />, { ...size });
}
