// Карточка истории авто с Encar (характеристики, ДТП, смены владельцев).
// Раньше эти данные тянулись из useEffect в браузере, поэтому весь блок —
// самый уникальный контент карточки — отсутствовал в HTML и не индексировался.
// Теперь фетч серверный и кэшируется на час.

const PRIMARY_TIMEOUT_MS = 8000;

export interface AccidentRecord {
  type?: string;
  date?: string;
  insuranceBenefit?: number;
  partCost?: number;
  laborCost?: number;
  paintingCost?: number;
}

export interface VehicleRecord {
  regDate?: string;
  carNo?: string;
  year?: string;
  maker?: string;
  carShape?: string;
  displacement?: string;
  fuel?: string;
  model?: string | null;
  transmission?: string;
  myAccidentCnt?: number;
  otherAccidentCnt?: number;
  ownerChangeCnt?: number;
  robberCnt?: number;
  totalLossCnt?: number;
  floodTotalLossCnt?: number;
  floodPartLossCnt?: number | null;
  carNoChangeCnt?: number;
  carInfoChanges?: { date?: string; carNo?: string }[];
  accidents?: AccidentRecord[];
  vin?: string;
  vehicleNo?: string;
}

/**
 * Блок необязательный: при любой ошибке возвращаем null и просто не рендерим его.
 * Страница авто не должна падать из-за истории.
 */
export async function fetchVehicleRecord(
  id: string | number | undefined,
  vehicleNo: string | undefined,
): Promise<VehicleRecord | null> {
  if (!id || !vehicleNo) return null;

  try {
    const res = await fetch(
      `https://api.encar.com/v1/readside/record/vehicle/${id}/open?vehicleNo=${encodeURIComponent(vehicleNo)}`,
      {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(PRIMARY_TIMEOUT_MS),
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json && typeof json === "object" ? (json as VehicleRecord) : null;
  } catch {
    return null;
  }
}
