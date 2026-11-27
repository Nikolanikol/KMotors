// Единый фетчер данных авто по id: прямой Encar API + фолбэк на прокси, кэш 1 час.
// Используется и на странице детали, и в блоке «Рекомендуемые авто».

import { isEncarBlockBody } from "@/lib/vehicleStatus";

/**
 * ⚠️ Мобильный User-Agent обязателен: Encar отдаёт 404 с HTML-блокировкой на UA серверного
 * fetch (`node`) — для ЛЮБОГО id, и живого тоже (замер 27.11.2026, как и у vehicleRecord.ts).
 * Без него основной путь всегда уходил в `isEncarBlockPage` и каждая карточка ходила через
 * прокси на Render (холодный старт — десятки секунд).
 */
const ENCAR_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

// Без таймаута зависший апстрим держит рендер карточки до упора.
const PRIMARY_TIMEOUT_MS = 8000;
// Прокси на free-tier Render: холодный старт занимает десятки секунд.
const FALLBACK_TIMEOUT_MS = 20000;

/**
 * Оба источника недоступны. Отдельный класс, потому что вызывающий код обязан
 * отличать «машина продана» (null) от «апстрим лежит»: в первом случае страницу
 * надо закрыть от индексации, во втором — ни в коем случае, иначе живые карточки
 * получают noindex на время аварии и выпадают из индекса.
 */
export class VehicleUpstreamError extends Error {
  constructor(id: string) {
    super(`vehicle ${id}: upstream unavailable`);
    this.name = "VehicleUpstreamError";
  }
}

/** Страница блокировки Encar: HTML вместо JSON и ссылка на has_been_cr_blocked. */
function isEncarBlockPage(res: Response, body: string): boolean {
  return isEncarBlockBody(res.headers.get("content-type"), body);
}

/**
 * Сырой JSON объявления Encar. Схему задаёт внешний API и она не гарантирована
 * (см. CLAUDE.md: «Фото — только Photos?.[0]?.location», vin и пробег бывают пустыми),
 * поэтому тип намеренно свободный — единственное разрешённое `any` на весь разбор Encar.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EncarRaw = Record<string, any>;

export async function fetchVehicleData(id: string): Promise<EncarRaw | null> {
  // Основной источник — прямой Encar API, кэш 1 час
  try {
    const res = await fetch(`https://api.encar.com/v1/readside/vehicle/${id}`, {
      headers: { "user-agent": ENCAR_UA },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(PRIMARY_TIMEOUT_MS),
    });
    // 404 от Encar = машина продана/удалена — это настоящий notFound.
    // Но блокировка по IP тоже приходит как 404 — HTML-страница от CloudFront с
    // переадресацией на has_been_cr_blocked_*.html. Это не «продана»: идём в прокси.
    if (res.status === 404) {
      const body = await res.text();
      if (isEncarBlockPage(res, body)) throw new Error("Encar blocked");
      return null;
    }
    if (!res.ok) throw new Error(`Encar ${res.status}`);
    return await res.json();
  } catch {
    // Fallback: тот же прокси что использует каталог
    try {
      const res = await fetch(
        `https://encar-proxy-main.onrender.com/api/vehicle/${id}`,
        {
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(FALLBACK_TIMEOUT_MS),
        },
      );
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`proxy ${res.status}`);
      return await res.json();
    } catch {
      throw new VehicleUpstreamError(id);
    }
  }
}
