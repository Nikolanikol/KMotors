/**
 * Утилита для безопасного вызова GA4 событий.
 * Не падает если gtag ещё не загружен или отключён.
 *
 * ⚠️ Каждое событие получает параметр `section` — раздел сайта по адресу
 * страницы (encar / auction / parts / calculator / other). На нём держатся
 * четыре воронки в GA4 (решение владельца 05.10.2026): без него `view_item`
 * машины Encar, лота аукциона и запчасти неотличимы. Проставляется ЗДЕСЬ,
 * а не в местах вызова — так его не забудет ни одно событие, старое или новое.
 * Явно переданный `section` важнее вычисленного.
 *
 * В GA4 параметр нужно зарегистрировать (Admin → Custom definitions →
 * event-scoped dimension `section`), иначе в отчётах его не видно.
 */

export type SiteSection = "encar" | "auction" | "parts" | "calculator" | "other";

/** Раздел по пути: /ru/catalog/… → encar, /en/auction/… → auction и т.д. */
export function sectionFromPath(path: string): SiteSection {
  const seg = path.split("/").filter(Boolean);
  // Первый сегмент — язык, у служебных путей (/admin) его нет.
  const s = /^(ru|en|ka|ar|ko)$/.test(seg[0] ?? "") ? seg[1] : seg[0];
  if (s === "catalog" || s === "models") return "encar";
  if (s === "auction") return "auction";
  if (s === "parts" || s === "cart" || s === "fitment" || s === "tracking") return "parts";
  if (s === "calculator") return "calculator";
  return "other";
}

type Gtag = (...args: unknown[]) => void;
type Params = Record<string, string | number | boolean | undefined>;

const gtagFn = () => (window as unknown as { gtag?: Gtag }).gtag;

/**
 * ⚠️ Очередь до загрузки GA. Скрипт gtag грузится afterInteractive, а события
 * просмотра (view_item, view_item_list, calc_view) шлются из useEffect при
 * гидратации — то есть РАНЬШЕ. Прежде такие события молча терялись: воронка
 * начиналась бы с дыры на первом шаге (найдено 05.10.2026 на calc_view).
 * Теперь они ждут здесь и уходят, как только появится window.gtag. Раздел
 * считается в момент события, а не отправки, — адрес к тому времени может
 * смениться.
 */
const pending: [string, Params][] = [];
let flushTimer: number | null = null;

function flush() {
  const gtag = gtagFn();
  if (typeof gtag !== "function") return false;
  for (const [name, p] of pending.splice(0)) gtag("event", name, p);
  return true;
}

export function trackEvent(eventName: string, params?: Params) {
  if (typeof window === "undefined") return;
  const p = { section: sectionFromPath(window.location.pathname), ...(params ?? {}) };
  // То же событие — в Clarity: там по нему фильтруются записи сессий («смотрел
  // машину, но не начал заявку»). Clarity грузится lazyOnload и сам буферизует.
  try {
    (window as unknown as { clarity?: (...a: unknown[]) => void }).clarity?.("event", eventName);
  } catch {}
  const gtag = gtagFn();
  if (typeof gtag === "function") {
    gtag("event", eventName, p);
    return;
  }
  // GA ещё не загружен (или заблокирован блокировщиком): копим и пробуем
  // дослать полминуты. Не загрузился — события отбрасываются, страница не страдает.
  pending.push([eventName, p]);
  if (flushTimer !== null) return;
  let tries = 0;
  flushTimer = window.setInterval(() => {
    if (flush() || ++tries > 120) {
      window.clearInterval(flushTimer!);
      flushTimer = null;
      pending.length = 0;
    }
  }, 250);
}

/**
 * Событие не чаще раза за просмотр страницы: «открыл галерею», «увидел блок
 * цены», «начал заполнять форму». Иначе воронка считала бы клики, а не людей.
 * Ключ сбрасывается со сменой адреса — переход на другую машину считается заново.
 */
const fired = new Set<string>();
export function trackOnce(key: string, eventName: string, params?: Params) {
  if (typeof window === "undefined") return;
  // С query: вторая страница выдачи или другой фильтр — новый просмотр.
  const k = `${window.location.pathname}${window.location.search}|${key}`;
  if (fired.has(k)) return;
  fired.add(k);
  trackEvent(eventName, params);
}
