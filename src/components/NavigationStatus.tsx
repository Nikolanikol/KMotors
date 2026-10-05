"use client";

// Индикатор перехода: после КАЖДОГО клика, ведущего на другую страницу, человек
// видит, что клик принят (требование владельца 05.10.2026). Аукционы и их
// каталоги рендерятся на сервере секунды — без отклика нельзя понять, зависла
// страница или клик не прошёл.
//
// Заменил next-nprogress-bar: тот ловил только клики по ссылкам, а фильтр
// каталога аукционов — это GET-форма, и её отправка не давала НИКАКОГО сигнала.
// К тому же полоска была 3px в старом красном #BB162B — на чёрном не видна.
//
// Что делает, три сигнала сразу:
//   1. бронзовая полоса сверху экрана — появляется мгновенно, ползёт до 90%;
//   2. нажатая ссылка/кнопка пульсирует (атрибут data-nav-target, стиль в
//      globals.css) — видно, ЧТО именно нажато;
//   3. блоки с атрибутом data-nav-dim приглушаются — старые результаты не
//      выглядят как новые (сетка лотов каталога).
// Состояние — атрибут <html data-nav="busy">, поэтому реагировать на него
// может любой серверный компонент одним CSS-селектором, без клиентского кода.
//
// Конец перехода — смена адреса (pathname или query). Ответ, который адреса не
// сменил (ошибка, редирект на ту же страницу), гасит страховочный таймер.
//
// ⚠️ Формы с атрибутом data-nav-form отправляются КЛИЕНТСКОЙ навигацией, а не
// перезагрузкой: адрес тот же (= состояние фильтра), но не перекачивается весь
// JS страницы и шапка. Только GET-формы и только по атрибуту — чужие формы
// (заявки, вход) этот компонент не трогает.

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { NAV_START_EVENT } from "@/lib/navStatus";

const SAFETY_MS = 20_000;

function isPlainLeftClick(e: MouseEvent) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

export default function NavigationStatus() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [progress, setProgress] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const target = useRef<Element | null>(null);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const stop = () => {
    clearTimers();
    document.documentElement.removeAttribute("data-nav");
    target.current?.removeAttribute("data-nav-target");
    target.current = null;
    setProgress((p) => (p === null ? null : 100));
    timers.current.push(window.setTimeout(() => setProgress(null), 250));
  };

  const start = (el: Element | null) => {
    clearTimers();
    target.current?.removeAttribute("data-nav-target");
    target.current = el;
    el?.setAttribute("data-nav-target", "");
    document.documentElement.setAttribute("data-nav", "busy");
    setProgress(8);
    // Ползём к 90% всё медленнее: сколько ждать сервер, заранее не известно.
    [[150, 30], [600, 55], [1500, 72], [3500, 84], [7000, 90]].forEach(([ms, p]) =>
      timers.current.push(window.setTimeout(() => setProgress((cur) => (cur === null ? null : Math.max(cur, p))), ms)),
    );
    timers.current.push(window.setTimeout(stop, SAFETY_MS));
  };

  // Адрес сменился — переход завершён.
  useEffect(() => {
    if (document.documentElement.hasAttribute("data-nav")) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!isPlainLeftClick(e)) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.closest("[data-nav-ignore]")) return;
      // Кнопка ВНУТРИ ссылки (сердечко избранного на карточке) переходом не
      // является: она сама отменяет переход ссылки.
      const btn = (e.target as Element).closest("button, [role='button']");
      if (btn && a.contains(btn)) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      // Якорь на той же странице и ссылка на текущий адрес — перехода не будет.
      if (url.pathname === location.pathname && url.search === location.search) return;
      start(a);
    };

    // Всплытие до window: обработчики React уже отработали, и если форма
    // отправляется своим кодом (preventDefault), сюда она придёт отменённой.
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (e.defaultPrevented || (form.method || "get").toLowerCase() !== "get") return;
      const action = new URL(form.action || location.href, location.href);
      if (action.origin !== location.origin) return;
      const submitter = e.submitter ?? form.querySelector('[type="submit"]');
      if (!form.hasAttribute("data-nav-form")) {
        start(submitter); // обычная GET-форма: перезагрузка, но отклик всё равно нужен
        return;
      }
      e.preventDefault();
      const params = new URLSearchParams();
      new FormData(form, e.submitter ?? undefined).forEach((v, k) => {
        if (typeof v === "string") params.append(k, v);
      });
      const qs = params.toString();
      const next = `${action.pathname}${qs ? `?${qs}` : ""}`;
      if (next === `${location.pathname}${location.search}`) return;
      start(submitter);
      router.push(next, { scroll: false });
    };

    // ⚠️ Назад/вперёд (popstate) НЕ ловим: Next меняет адрес раньше, чем доходит
    // до нашего слушателя, и индикатор оставался висеть до страховочного таймера
    // (поймано проверкой 05.10.2026). Возврат и так отдаётся из кеша роутера.
    // router.push из кода (lib/navStatus.ts) — нажатый элемент неизвестен.
    const onNavStart = () => start(null);

    // ⚠️ Перехват (capture), и defaultPrevented НЕ проверяется: <Link> из Next
    // САМ зовёт preventDefault, чтобы перейти клиентской навигацией, — проверка
    // отсекала бы каждую ссылку сайта (так и было в первой версии). Ссылка,
    // которая открывает панель вместо перехода, помечается data-nav-ignore.
    document.addEventListener("click", onClick, true);
    window.addEventListener("submit", onSubmit);
    window.addEventListener(NAV_START_EVENT, onNavStart);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("submit", onSubmit);
      window.removeEventListener(NAV_START_EVENT, onNavStart);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px]"
      style={{ opacity: progress === null ? 0 : 1, transition: "opacity 200ms" }}
    >
      <div
        className="h-full"
        style={{
          width: `${progress ?? 0}%`,
          transition: progress === null ? "none" : "width 400ms ease-out",
          background: "linear-gradient(90deg, var(--axis-bronze-deep), var(--axis-bronze-bright))",
          boxShadow: "0 0 10px rgba(200,136,88,0.9), 0 0 4px rgba(200,136,88,0.7)",
        }}
      />
    </div>
  );
}
