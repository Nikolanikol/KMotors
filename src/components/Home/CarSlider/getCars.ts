import type { ICar, ICarResponce } from "./dataType";

// Те же значения и приём, что в src/lib/vehicle.ts и Catalog/Row/utils/service.ts:
// прямой Encar — 8 с, прокси на Render — 20 с (холодный старт ~20 с).
const PRIMARY_TIMEOUT_MS = 8000;
const FALLBACK_TIMEOUT_MS = 20000;

function timeoutFor(reqString: string): number {
  try {
    return new URL(reqString).hostname.endsWith("onrender.com")
      ? FALLBACK_TIMEOUT_MS
      : PRIMARY_TIMEOUT_MS;
  } catch {
    return FALLBACK_TIMEOUT_MS;
  }
}

/**
 * Машины для карусели главной. НЕ бросает: таймаут, сеть, не-200 и битый JSON
 * дают [] — карусель тогда просто не рисуется. Различать «пусто» и «апстрим
 * лёг» здесь не нужно: кеширует результат только успешный ответ (res.ok).
 */
export const getCars = async (reqString: string): Promise<ICar[]> => {
  try {
    const res = await fetch(reqString, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(timeoutFor(reqString)),
    });
    if (!res.ok) return [];
    const data: ICarResponce = await res.json();
    // Normalize: direct Encar API returns numbers, proxy returns strings
    return (data.SearchResults ?? []).map((car) => ({
      ...car,
      Mileage: String(car.Mileage ?? ""),
      Price: String(car.Price ?? ""),
      // ⚠️ Photos обрезается до ПЕРВОГО кадра: карточка показывает ровно его
      // (Slider.tsx: `photo={item.Photos?.[0]?.location}`), а Encar присылает весь
      // альбом объявления — по ~24 кадра на машину. При двух каруселях по 20
      // машин это 964 URL в RSC-payload главной при 66 реальных <img> на
      // странице (замер 22.08.2026). Массив уезжает в HTML целиком, потому что
      // данные передаются в клиентский компонент.
      // Понадобится галерея прямо в карточке — резать здесь под её нужды, а не
      // возвращать весь альбом.
      Photos: (car.Photos ?? []).slice(0, 1),
    }));
  } catch {
    return [];
  }
};
