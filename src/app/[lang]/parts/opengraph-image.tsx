import { OG_SIZE, makeOgRoute, ogContentType, ogCopy } from "@/lib/ogCard";

// Листинг запчастей. Карточка товара — своя, в [slug]/.
export const alt = ogCopy("parts", "ru").alt;
export const size = OG_SIZE;
export const contentType = ogContentType("parts");

export default makeOgRoute("parts");
