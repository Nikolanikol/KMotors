// Определение мобильного устройства по User-Agent (серверное).
// Регэксп согласован с middleware.ts, чтобы сайт классифицировал "мобилу" единообразно.
export function isMobileUA(ua: string | null | undefined): boolean {
  if (!ua) return false;
  return /mobile|android|iphone|ipad|ipod/i.test(ua);
}

// Размер страницы каталога: на мобиле меньше карточек — легче HTML/DOM/JS.
export function catalogPageSize(ua: string | null | undefined): number {
  return isMobileUA(ua) ? 10 : 20;
}
