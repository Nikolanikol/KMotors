import { OG_CONTENT_TYPE, OG_SIZE, makeOgRoute, ogCopy } from "@/lib/ogCard";

// Карточка по умолчанию для всего под [lang]: главная и всё, что не
// перекрыто своим файлом. `alt` у файловой конвенции статический и параметров
// не видит — поэтому он на русском, языке по умолчанию. Картинка язык учитывает.
export const alt = ogCopy("home", "ru").alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default makeOgRoute("home");
