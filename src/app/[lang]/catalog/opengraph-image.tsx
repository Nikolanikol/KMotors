import { OG_SIZE, makeOgRoute, ogContentType, ogCopy } from "@/lib/ogCard";

// Листинг каталога. Карточка конкретной машины — своя, в [id]/.
export const alt = ogCopy("catalog", "ru").alt;
export const size = OG_SIZE;
export const contentType = ogContentType("catalog");

export default makeOgRoute("catalog");
