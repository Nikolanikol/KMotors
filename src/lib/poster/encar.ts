// Клиент Encar для постера: поиск по фильтрам + детали/история/диагностика.
// fetch (не axios) — конвенция KMotors. Детали авто берём через общий fetchVehicleData.
import { fetchVehicleData } from '@/lib/vehicle';
import type { Preset } from './config';

const SEARCH = 'https://api.encar.com/search/car/list/premium';
const DETAIL = 'https://api.encar.com/v1/readside';
const PHOTO_CDN = 'https://ci.encar.com';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  Referer: 'https://www.encar.com/',
  Origin: 'https://www.encar.com',
};

// ─── Поисковая выдача ─────────────────────────────────────────────────────────

export interface Listing {
  id: string;
  manufacturerKo: string;
  modelKo: string;
  badgeKo: string;
  year: number;       // YYYYMM
  formYear: string;
  mileage: number;
  priceMan: number;   // 만원
  fuelKo: string;
  transKo: string;
  city: string;
  isDuplicate: boolean;   // ServiceCopyCar === 'DUPLICATION'
  hasInspection: boolean; // Condition содержит 'Inspection'
}

/** Строит q-строку Encar из пресета. */
function buildQuery(p: Preset): string {
  const ranges: string[] = [];
  if (p.yearFrom) ranges.push(`Year.range(${p.yearFrom}00..).`);
  if (p.mileageMax) ranges.push(`Mileage.range(..${p.mileageMax}).`);
  const rangePart = ranges.join('_.');
  const carType = p.imported ? 'N' : 'Y'; // N = импорт (수입), Y = отечественная (국산)
  const carPart = `(C.CarType.${carType}._.(C.Manufacturer.${p.manufacturerKo}._.ModelGroup.${p.modelGroupKo}.))`;
  return rangePart
    ? `(And.Hidden.N._.${rangePart}_.${carPart})`
    : `(And.Hidden.N._.${carPart})`;
}

/** Ищет свежайшие объявления по пресету (сортировка по ModifiedDate). */
export async function searchListings(p: Preset, limit: number): Promise<Listing[]> {
  const q = buildQuery(p);
  const url = `${SEARCH}?count=false&q=${encodeURIComponent(q)}&sr=${encodeURIComponent(
    `|ModifiedDate|0|${limit}`,
  )}`;
  const res = await fetch(url, { headers: HEADERS, cache: 'no-store' });
  if (!res.ok) throw new Error(`Encar search ${res.status}`);
  const data = await res.json();

  return (data.SearchResults ?? []).map(
    (r: any): Listing => ({
      id: String(r.Id),
      manufacturerKo: r.Manufacturer ?? '',
      modelKo: r.Model ?? '',
      badgeKo: r.Badge ?? '',
      year: Number(r.Year) || 0,
      formYear: String(r.FormYear ?? ''),
      mileage: Number(r.Mileage) || 0,
      priceMan: Number(r.Price) || 0,
      fuelKo: r.FuelType ?? '',
      transKo: r.Transmission ?? '',
      city: r.OfficeCityState ?? '',
      isDuplicate: r.ServiceCopyCar === 'DUPLICATION',
      hasInspection: Array.isArray(r.Condition) && r.Condition.includes('Inspection'),
    }),
  );
}

// ─── Детали для квалити-гейта ─────────────────────────────────────────────────

export interface AccidentRecord {
  myAccidentCnt: number;
  ownerChangeCnt: number;
}
export interface Inspection {
  accident: boolean;         // факт ДТП — из master.accdient (надёжнее, чем detail)
  waterlog: boolean;
  hasSeriousDamage: boolean; // любой outer с RANK_ONE (панель под замену/сварку)
}
export interface EncarDetail {
  photos: string[];
  optionCodes: string[]; // коды опций (standard ∪ choice) для хайлайтов в подписи
  record: AccidentRecord | null;
  inspection: Inspection | null;
}

function extractOptionCodes(vehicle: any): string[] {
  const o = vehicle?.options ?? {};
  const codes = [...(o.standard ?? []), ...(o.choice ?? [])].map(String);
  return [...new Set(codes)];
}

function extractPhotos(vehicle: any, limit: number): string[] {
  const raw: string[] = (vehicle?.photos ?? [])
    .map((p: any) => (typeof p === 'string' ? p : p?.path ?? p?.location ?? ''))
    .filter(Boolean);
  const frameNo = (path: string) => {
    const m = path.match(/_(\d+)\.jpg/i);
    return m ? parseInt(m[1], 10) : 9999;
  };
  return [...new Set(raw)]
    .sort((a, b) => frameNo(a) - frameNo(b))
    .slice(0, limit)
    .map((path) => (path.startsWith('http') ? path : PHOTO_CDN + path));
}

async function fetchRecord(id: string, vehicleNo: string): Promise<AccidentRecord | null> {
  try {
    const no = encodeURIComponent(String(vehicleNo).replace(/\s+/g, ''));
    const res = await fetch(`${DETAIL}/record/vehicle/${id}/open?vehicleNo=${no}`, {
      headers: HEADERS,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const d = await res.json();
    return { myAccidentCnt: d.myAccidentCnt ?? 0, ownerChangeCnt: d.ownerChangeCnt ?? 0 };
  } catch {
    return null;
  }
}

async function fetchInspection(id: string): Promise<Inspection | null> {
  try {
    const res = await fetch(`${DETAIL}/inspection/vehicle/${id}`, {
      headers: HEADERS,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const d = await res.json();
    const master = d.master;
    if (!master) return null;
    // master.accdient (sic — опечатка в API Encar) присутствует даже когда
    // master.detail пустой, поэтому это наш основной флаг ДТП.
    const detail = master.detail ?? {};
    const hasSeriousDamage = (d.outers ?? []).some((o: any) =>
      (o.attributes ?? []).includes('RANK_ONE'),
    );
    return {
      accident: master.accdient ?? detail.accident ?? false,
      waterlog: detail.waterlog ?? false,
      hasSeriousDamage,
    };
  } catch {
    return null;
  }
}

/** Тянет фото + историю + диагностику для одного авто. */
export async function fetchDetail(id: string, photoLimit: number): Promise<EncarDetail | null> {
  const vehicle = await fetchVehicleData(id).catch(() => null);
  if (!vehicle) return null;
  const photos = extractPhotos(vehicle, photoLimit);
  const optionCodes = extractOptionCodes(vehicle);
  const [record, inspection] = await Promise.all([
    fetchRecord(id, vehicle.vehicleNo ?? ''),
    fetchInspection(id),
  ]);
  return { photos, optionCodes, record, inspection };
}

/** Ссылка на карточку авто в магазине KMotors (catalog/[id] рендерит любой encar id). */
export function kmotorsUrl(id: string): string {
  return `https://www.kmotors.shop/en/catalog/${id}`;
}
