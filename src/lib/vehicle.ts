// Единый фетчер данных авто по id: прямой Encar API + фолбэк на прокси, кэш 1 час.
// Используется и на странице детали, и в блоке «Рекомендуемые авто».

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

export async function fetchVehicleData(id: string): Promise<any> {
  // Основной источник — прямой Encar API, кэш 1 час
  try {
    const res = await fetch(`https://api.encar.com/v1/readside/vehicle/${id}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(PRIMARY_TIMEOUT_MS),
    });
    // 404 от Encar = машина продана/удалена — это настоящий notFound
    if (res.status === 404) return null;
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
