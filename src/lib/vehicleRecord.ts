// Карточка истории авто с Encar (характеристики, ДТП, смены владельцев).
// Раньше эти данные тянулись из useEffect в браузере, поэтому весь блок —
// самый уникальный контент карточки — отсутствовал в HTML и не индексировался.
// Теперь фетч серверный и кэшируется на час.

const PRIMARY_TIMEOUT_MS = 8000;

/**
 * ⚠️ User-Agent ОБЯЗАТЕЛЕН. Endpoint истории (`/v1/readside/record/vehicle/…/open`) отдаёт 200
 * только браузерному UA; с UA серверного fetch (`node`) и без UA — 404. Без заголовка блок
 * «Характеристики и история ДТП» не показывался НИ НА ОДНОЙ карточке (проверено 27.11.2026:
 * 0 из 10, при том что у Encar история есть у 96% машин), а код молча возвращал null.
 * Тот же UA — в FilterService/index.ts.
 */
const ENCAR_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

export interface AccidentRecord {
  type?: string;
  date?: string;
  insuranceBenefit?: number;
  partCost?: number;
  laborCost?: number;
  paintingCost?: number;
}

export interface VehicleRecord {
  /**
   * ⚠️ НЕ дата регистрации машины: это время выгрузки отчёта Encar (`2026-11-16T14:18:39`
   * даже у авто 2015 года; не совпадает с `firstDate` в 77 записях из 77). Клиенту не показывать.
   */
  regDate?: string;
  /** Дата первой регистрации (`YYYY-MM-DD`). Её и показываем клиенту. */
  firstDate?: string;
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
        headers: { "user-agent": ENCAR_UA },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(PRIMARY_TIMEOUT_MS),
      },
    );
    if (!res.ok) {
      // ⚠️ Не молчим: «нет записи» и «Encar нас не пускает» выглядели одинаково (блок просто
      // исчезал), поэтому поломку с UA никто не видел. 404 бывает и законно — у ~4% машин
      // нет страховой записи, — но код сбоя должен оставаться в логе контейнера.
      console.warn(`[record] Encar ответил ${res.status} для ${id}`);
      return null;
    }
    const json = await res.json();
    return json && typeof json === "object" ? (json as VehicleRecord) : null;
  } catch (e) {
    console.warn(`[record] запрос истории для ${id} не удался:`, (e as Error)?.message);
    return null;
  }
}
