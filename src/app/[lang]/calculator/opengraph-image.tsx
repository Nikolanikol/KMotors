import { OG_SIZE, makeOgRoute, ogContentType, ogCopy } from "@/lib/ogCard";

// Хаб калькулятора. У страниц стран свой файл в [country]/.
export const alt = ogCopy("calculator", "ru").alt;
export const size = OG_SIZE;
export const contentType = ogContentType("calculator");

export default makeOgRoute("calculator");
