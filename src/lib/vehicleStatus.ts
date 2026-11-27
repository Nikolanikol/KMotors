// Вердикт «жива / продана / битая» по ответу Encar и код, который из него следует.
// Чистые функции без Node-API (edge-safe): ими пользуются и middleware, и страница
// карточки — одно определение «продана» на обоих.
//
// ⚠️ Зачем это в middleware, а не в странице. У `catalog/[id]` (и у `catalog/`) есть
// loading.tsx: оболочка со скелетоном уходит клиенту ДО того, как страница узнала
// ответ Encar, поэтому `notFound()` и любая ветка рендера не меняют HTTP-статус —
// он уже 200. Проверено сборкой: статус не меняется ни без [id]/loading.tsx, ни с
// not-found.tsx; а `NextResponse.rewrite(url, { status })` из middleware применяется.

import { isLang } from "@/lib/lang";

/**
 * - `live` — Encar отдал объявление, его можно показывать;
 * - `sold` — строгий 404 Encar: объявления нет (продана/снята);
 * - `invalid` — 200, но без марки или цены: страница сама зовёт `notFound()`;
 * - `unknown` — авария: таймаут, 5xx, страница блокировки Encar, не-JSON. НЕ «продана».
 */
export type VehicleVerdict = "live" | "sold" | "invalid" | "unknown";

/**
 * Блокировка по IP приходит от Encar как 404 с HTML (ссылка на has_been_cr_blocked_*).
 * Это авария, а не продажа: 13.11.2026 именно такая блокировка сутки метила живые
 * машины проданными ([docs/postmortems.md]). Настоящий 404 Encar — пустой, без HTML.
 */
export function isEncarBlockBody(contentType: string | null | undefined, body: string): boolean {
  return body.includes("has_been_cr_blocked") || (contentType ?? "").includes("text/html");
}

/** Объявление пригодно к показу: есть марка и цена. Ровно то условие, по которому страница зовёт notFound(). */
export function isRenderableVehicle<T>(data: T | null | undefined): data is T {
  const d = data as { category?: { manufacturerEnglishName?: unknown }; advertisement?: { price?: unknown } } | null | undefined;
  return !!d && !!d.category?.manufacturerEnglishName && !!d.advertisement?.price;
}

export function classifyVehicleResponse(res: {
  status: number;
  contentType: string | null | undefined;
  body: string;
}): VehicleVerdict {
  if (res.status === 404) {
    return isEncarBlockBody(res.contentType, res.body) ? "unknown" : "sold";
  }
  if (res.status === 200) {
    if (isEncarBlockBody(res.contentType, res.body)) return "unknown";
    let json: unknown;
    try {
      json = JSON.parse(res.body);
    } catch {
      return "unknown";
    }
    if (json === null || typeof json !== "object") return "unknown";
    return isRenderableVehicle(json) ? "live" : "invalid";
  }
  return "unknown";
}

/** HTTP-статус для вердикта. null — не вмешиваемся, статус отдаст сама страница. */
export function verdictHttpStatus(verdict: VehicleVerdict): 410 | 404 | null {
  if (verdict === "sold") return 410;
  if (verdict === "invalid") return 404;
  return null;
}

/** `/ru/catalog/43179799` → `{ lang: "ru", id: "43179799" }`; всё остальное (og-картинка, листинг, мусор) — null. */
export function carPageTarget(path: string): { lang: string; id: string } | null {
  const m = /^\/([^/]+)\/catalog\/(\d{6,10})$/.exec(path);
  if (!m || !isLang(m[1])) return null;
  return { lang: m[1], id: m[2] };
}
