// Единый фетчер данных авто по id: прямой Encar API + фолбэк на прокси, кэш 1 час.
// Используется и на странице детали, и в блоке «Рекомендуемые авто».
export async function fetchVehicleData(id: string): Promise<any> {
  // Основной источник — прямой Encar API, кэш 1 час
  try {
    const res = await fetch(`https://api.encar.com/v1/readside/vehicle/${id}`, {
      next: { revalidate: 3600 },
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
        { next: { revalidate: 3600 } },
      );
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`proxy ${res.status}`);
      return await res.json();
    } catch {
      // Оба источника недоступны — это сбой апстрима, а не отсутствие машины.
      // Отдаём 5xx вместо 404, чтобы Google не выкидывал живые страницы из индекса.
      throw new Error(`vehicle ${id}: upstream unavailable`);
    }
  }
}
