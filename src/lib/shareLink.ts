// «Поделиться» / «скопировать ссылку» — одна логика для кнопок Encar (ShareCar)
// и аукциона (LotShare).
//
// ⚠️ Системное меню «поделиться» — ТОЛЬКО на сенсорных устройствах. На
// компьютере navigator.share тоже есть (Chrome, Safari, Edge), и кнопка
// открывала меню ОС вместо копирования — владелец 05.10.2026: «не могу
// нормально ничего скопировать». На компьютере ссылку копируем сразу.
//
// Копирование в три ступени, потому что у каждой своя причина отказа:
//   1. navigator.clipboard — нужен https и фокус окна;
//   2. execCommand("copy") через скрытое поле — работает там, где (1) запрещён;
//   3. prompt с выделенной ссылкой — человек копирует руками, но не застревает.

export type ShareOutcome = "shared" | "copied" | "manual" | "cancelled";

function copyViaTextarea(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

export async function shareLink(url: string, title: string): Promise<ShareOutcome> {
  const touch = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  if (touch && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (e) {
      // Закрыл меню — не ошибка; прочие отказы — падаем на копирование.
      if ((e as Error).name === "AbortError") return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    if (copyViaTextarea(url)) return "copied";
  }
  window.prompt("Copy the link:", url);
  return "manual";
}
