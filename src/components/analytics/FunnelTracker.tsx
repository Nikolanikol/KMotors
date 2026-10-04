"use client";

// Шаги воронки на странице — без превращения серверных страниц в клиентские.
//
// Зачем. Владелец видит, что машины смотрят, а заявок нет, и хочет понять, на
// каком шаге человек уходит (05.10.2026). Одного view_item → generate_lead для
// этого мало: нужно знать, долистал ли он до цены, истории, опций, формы, и
// что нажимал. Страницы машин серверные, поэтому разметка шагов — атрибутами,
// а слушает их один клиентский компонент на странице:
//
//   data-track-block="price"     — блок попал в экран (≥ 40%) → view_block
//   data-track-click="gallery_open" — клик по элементу → событие с этим именем
//   data-track-label="whatsapp"  — уточнение к клику (параметр label)
//
// Каждый блок и каждый клик-шаг считается ОДИН раз за просмотр страницы
// (trackOnce): воронке нужны люди, а не число прокруток. Раздел (section)
// trackEvent проставляет сам по адресу.
//
// Блоки за Suspense приходят позже первого рендера — их подхватывает
// MutationObserver, иначе «история машины» не попала бы в отчёт никогда.

import { useEffect } from "react";

import { trackOnce } from "@/utils/gtag";

type Params = Record<string, string | number | boolean | undefined>;

export default function FunnelTracker({
  view,
  itemId,
  itemName,
}: {
  /** Событие просмотра страницы: view_item / view_item_list / calc_view… */
  view?: { event: string; params?: Params };
  itemId?: string;
  itemName?: string;
}) {
  useEffect(() => {
    if (view) trackOnce(`view:${view.event}`, view.event, { item_id: itemId, item_name: itemName, ...view.params });

    const base = { item_id: itemId, item_name: itemName };
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const block = (e.target as HTMLElement).dataset.trackBlock;
          if (block) trackOnce(`block:${block}`, "view_block", { ...base, block });
          io.unobserve(e.target);
        }
      },
      { threshold: 0.4 },
    );
    const scan = () =>
      document.querySelectorAll("[data-track-block]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    // Клики — делегированием на документ: элементы внутри серверной разметки.
    const onClick = (ev: MouseEvent) => {
      const el = (ev.target as HTMLElement | null)?.closest<HTMLElement>("[data-track-click]");
      if (!el) return;
      const name = el.dataset.trackClick!;
      const label = el.dataset.trackLabel;
      trackOnce(`click:${name}:${label ?? ""}`, name, { ...base, label });
    };
    document.addEventListener("click", onClick, true);

    return () => {
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("click", onClick, true);
    };
  }, [view?.event, itemId, itemName]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
