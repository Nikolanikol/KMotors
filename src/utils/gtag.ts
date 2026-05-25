/**
 * Утилита для безопасного вызова GA4 событий.
 * Не падает если gtag ещё не загружен или отключён.
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>
) {
  if (
    typeof window !== "undefined" &&
    typeof (window as { gtag?: (...args: unknown[]) => void }).gtag === "function"
  ) {
    (window as { gtag: (...args: unknown[]) => void }).gtag("event", eventName, params ?? {});
  }
}
