// Запуск индикатора перехода из кода (components/NavigationStatus.tsx).
//
// Клики по ссылкам и отправку форм индикатор ловит сам. А router.push из
// обработчика — кнопка «Показать» фильтра, выпадашка — снаружи не виден, его
// место нужно пометить вызовом navStart(href) рядом с push.
//
// href обязателен: если он совпадает с текущим адресом, перехода не будет, адрес
// не сменится — и полоса висела бы до страховочного таймера.

export const NAV_START_EVENT = "kaxis:nav-start";

export function navStart(href: string) {
  if (typeof window === "undefined") return;
  const url = new URL(href, window.location.href);
  if (url.pathname === window.location.pathname && url.search === window.location.search) return;
  window.dispatchEvent(new Event(NAV_START_EVENT));
}
