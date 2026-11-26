// Манифест ядра «каталог Encar» (+ избранное и сравнение машин).
// Новый маршрут, отдающий данные машин, — добавить сюда, а не в middleware.

/** Страницы под запретом из Кореи («и вниз по дереву»). */
export const CARS_KR_BLOCKED_PAGES = ["catalog", "favorites", "compare"] as const;

/** API, из которых страницы машин добирают данные: `/api/<x>` и ниже. */
export const CARS_KR_BLOCKED_API = ["recommended", "vehicle", "cars"] as const;
