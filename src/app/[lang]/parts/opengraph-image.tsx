import { OG_CONTENT_TYPE, OG_SIZE, makeOgRoute, ogCopy } from "@/lib/ogCard";

// Листинг запчастей. Карточка товара — своя, в [slug]/, она показывает фото
// детали и здесь не участвует.
export const alt = ogCopy("parts", "ru").alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default makeOgRoute("parts");
