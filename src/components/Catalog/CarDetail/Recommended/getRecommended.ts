// Данные для блока «Рекомендуемые авто».
// Пайплайн: recommend/{id} → массив carIds → ОДИН батч-запрос
// /v1/readside/vehicles?vehicleIds=... (все машины сразу).
// Всё server-side, кэш 1 час. Любой сбой → пустой массив (блок просто не покажется).

const ENCAR = "https://api.encar.com";
const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

export interface RecommendedCar {
  id: string;
  photo: string; // путь encar, напр. /carpicture09/pic4229/xxx.jpg
  manufacturer: string;
  model: string;
  grade: string;
  year: string; // "2023.06"
  mileage: number;
  fuel: string;
  priceKRW: number; // уже × 10000
}

// Порядок типов фото: OUTER (экстерьер) первым — как на детали и в каталоге.
const PHOTO_TYPE_ORDER: Record<string, number> = { OUTER: 0, OPTION: 1, INNER: 2 };

function toCard(d: any): RecommendedCar | null {
  const cat = d?.category;
  const spec = d?.spec;
  const adv = d?.advertisement;
  const photos = d?.photos;
  if (!cat || !adv?.price || !photos?.length) return null;
  const ym: string = String(cat.yearMonth || "");
  const year = ym.length >= 6 ? `${ym.slice(0, 4)}.${ym.slice(4, 6)}` : ym;
  // Обложка: приоритет фото type=DIAG* (главный ракурс encar, = обложке каталога, path _027).
  // Если DIAG нет (бывает) — фолбэк на первое внешнее (OUTER) по алгоритму детали.
  const diag = photos.find((p: any) => String(p?.type || "").startsWith("DIAG"));
  const cover =
    diag ??
    [...photos].sort((a: any, b: any) => {
      const ta = PHOTO_TYPE_ORDER[a?.type] ?? 1;
      const tb = PHOTO_TYPE_ORDER[b?.type] ?? 1;
      if (ta !== tb) return ta - tb;
      return String(a?.code || "").localeCompare(String(b?.code || ""), undefined, {
        numeric: true,
      });
    })[0];
  return {
    id: String(d.vehicleId ?? ""),
    photo: cover?.path ?? "",
    manufacturer: cat.manufacturerEnglishName ?? "",
    model: cat.modelGroupEnglishName ?? "",
    grade: cat.gradeEnglishName ?? "",
    year,
    mileage: Number(spec?.mileage ?? 0),
    fuel: spec?.fuelName ?? "",
    priceKRW: Number(adv.price) * 10000,
  };
}

export async function getRecommendedCars(
  currentId: string,
): Promise<RecommendedCar[]> {
  let ids: number[] = [];
  try {
    const res = await fetch(
      `${ENCAR}/legacy/usedcar/sale/cars/recommend/${currentId}`,
      { next: { revalidate: 3600 }, headers: { "user-agent": MOBILE_UA } },
    );
    if (!res.ok) return [];
    const json = await res.json();

    ids = Array.isArray(json?.carIds) ? json.carIds.slice(0, 8) : [];
  } catch {
    return [];
  }
  if (!ids.length) return [];

  // Один батч-запрос на все машины (эндпоинт резолвит id в канонические vehicleId).
  try {
    const url = `${ENCAR}/v1/readside/vehicles?vehicleIds=${ids.join(",")}&include=SPEC,ADVERTISEMENT,PHOTOS,CATEGORY`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const arr = await res.json();

    if (!Array.isArray(arr)) return [];
    return arr
      .map((d) => toCard(d))
      .filter((c): c is RecommendedCar => c !== null && c.id !== "");
  } catch {
    return [];
  }
}
