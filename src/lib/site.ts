// ЕДИНСТВЕННОЕ место, где задан адрес сайта. Не заводить локальных `BASE` / `SITE` /
// `SITE_URL` с «https://www.kmotors.shop» — импортировать отсюда.
//
// Значение — `NEXT_PUBLIC_SITE_URL` (канонический хост, по нему middleware отличает
// боевой хост от служебного), без хвостового слэша; фолбэк — боевой www.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.kmotors.shop").replace(
  /\/+$/,
  "",
);
