import { OG_CONTENT_TYPE, OG_SIZE, makeOgRoute, ogCopy } from "@/lib/ogCard";

// Листинг каталога. Карточка конкретной машины — своя, в [id]/.
export const alt = ogCopy("catalog", "ru").alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default makeOgRoute("catalog");
