import { ImageLoaderProps } from "next/image";

const WTM = "https://ci.encar.com/wt_mark/w_mark_04.png";

/**
 * Кастомный loader для изображений encar CDN.
 * Next.js автоматически запрашивает разные ширины (640, 750, 828, 1080...)
 * и loader строит правильный URL для каждого размера.
 * Соотношение сторон 16:10 (как у карточек авто).
 */
export function encarLoader({ src, width }: ImageLoaderProps): string {
  const h = Math.round(width * 0.625); // 16:10 aspect ratio
  return `${src}?impolicy=heightRate&rh=${h}&cw=${width}&ch=${h}&cg=Center&wtmk=${WTM}`;
}

/**
 * Loader для миниатюр (thumbnails) — 3:2, ровно как отрисованная лента 90×60.
 * Квадрат здесь был лишним кропом поверх кропа: CDN резал 1:1, CSS дорезал в
 * 3:2 через object-cover, и мы тянули на треть больше пикселей, чем показываем.
 */
export function encarThumbLoader({ src, width }: ImageLoaderProps): string {
  const h = Math.round(width * 0.667); // 3:2
  return `${src}?impolicy=heightRate&rh=${h}&cw=${width}&ch=${h}&cg=Center&wtmk=${WTM}`;
}
