"use client";

// Служебная панель на ВИТРИННОЙ странице машины — подгружается в браузере.
//
// Зачем так, а не сразу в разметке, как в админке. Витринная страница
// кешируется (ISR), а кеш Next один на www и служебный хост: проверь страница
// хост на сервере — закешированный на служебном хосте ответ со сканами
// техпаспорта ушёл бы клиентам на www. Поэтому страница от хоста не зависит,
// а панель приходит отдельным запросом в /api/carnect/internal, который сам
// проверяет хост и кешем не пользуется.
//
// На www запроса нет вовсе: хост проверяется здесь же, до похода. Это не
// защита (её держит ручка), а экономия — клиентские заходы не дёргают API.
// Определение служебного хоста — как в serviceHost.ts: всё, что не
// CANONICAL_HOST, localhost тоже служебный.

import { useEffect, useState } from "react";

import type { CarCard } from "@/lib/carnect/card";

import InternalPanel from "./InternalPanel";

const CANONICAL_HOST = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kmotors.shop").hostname;

type Loaded = { card: CarCard; meta: { id: string; ms: number; fetchedAt?: string } };

export default function InternalPanelLoader({ house, id }: { house: string; id: string }) {
  const [data, setData] = useState<Loaded | null>(null);

  useEffect(() => {
    if (window.location.hostname === CANONICAL_HOST) return;
    const ctl = new AbortController();
    fetch(`/api/carnect/internal?house=${encodeURIComponent(house)}&id=${encodeURIComponent(id)}`, { signal: ctl.signal })
      .then((r) => (r.ok ? (r.json() as Promise<Loaded>) : null))
      .then((d) => d && setData(d))
      .catch((e: unknown) => {
        if ((e as Error).name !== "AbortError") console.error("[carnect] служебная панель:", e);
      });
    return () => ctl.abort();
  }, [house, id]);

  return data ? <InternalPanel card={data.card} meta={data.meta} /> : null;
}
