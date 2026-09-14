"use client";

// Фильтры витрины лотов. URL — источник правды: страница рендерится на
// сервере из searchParams, поэтому здесь router.push, а не replaceState.
// (В каталоге запчастей наоборот — там выборка идёт клиентским fetch'ем и
// push был бы переплатой; разница описана в CLAUDE.md.)
//
// ⚠️ Поиск отправляется ЯВНО — кнопкой или Enter. Дебаунса нет и не должно
// быть: каждый символ здесь стоил бы запроса к базе и перерисовки сетки.
// Та же причина, что в каталоге запчастей.

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * Подписи приходят пропом по той же причине, что у карточки: фильтры стоят и
 * на служебной странице под /admin, где инстанса i18next нет, и на публичной
 * витрине. Значения по умолчанию — русские, ими пользуется админка.
 */
export type LotFilterLabels = {
  search: string;
  find: string;
  reset: string;
  allMakers: string;
  sortLot: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  sortYear: string;
  sortMileage: string;
  showPast: string;
};

export const RU_FILTER_LABELS: LotFilterLabels = {
  search: "модель, марка или номер лота",
  find: "Найти",
  reset: "Сброс",
  allMakers: "все марки",
  sortLot: "по номеру лота",
  sortPriceAsc: "цена ↑",
  sortPriceDesc: "цена ↓",
  sortYear: "год ↓",
  sortMileage: "пробег ↑",
  showPast: "показывать прошедшие торги",
};

const control: React.CSSProperties = {
  backgroundColor: "var(--axis-charcoal)",
  border: "1px solid rgba(74,74,74,0.35)",
  color: "var(--axis-cream, #F5F0EB)",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
};

export default function LotFilters({
  makers,
  showUpcomingToggle = true,
  labels: L = RU_FILTER_LABELS,
}: {
  makers: { maker: string; count: number }[];
  /** У Lotte даты торгов нет вовсе — переключатель там обманывал бы. */
  showUpcomingToggle?: boolean;
  labels?: LotFilterLabels;
}) {
  const SORTS = [
    { value: "lot", label: L.sortLot },
    { value: "price_asc", label: L.sortPriceAsc },
    { value: "price_desc", label: L.sortPriceDesc },
    { value: "year_desc", label: L.sortYear },
    { value: "mileage_asc", label: L.sortMileage },
  ] as const;
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState(params.get("q") ?? "");

  // ⚠️ page снимается ВСЕГДА: заход на ?page=5 с новым фильтром иначе
  // показал бы пустую пятую страницу отфильтрованной выдачи.
  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    startTransition(() => router.push(`?${next.toString()}`, { scroll: false }));
  };

  const maker = params.get("maker") ?? "";
  const sort = params.get("sort") ?? "lot";
  const showAll = params.get("upcoming") === "0";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${pending ? "opacity-50" : ""}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: draft.trim() || null });
        }}
        className="flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={L.search}
          style={{ ...control, minWidth: 220 }}
        />
        <button
          type="submit"
          style={{ ...control, backgroundColor: "var(--axis-bronze-deep)", borderColor: "transparent", color: "#fff", cursor: "pointer" }}
        >
          {L.find}
        </button>
        {params.get("q") && (
          <button
            type="button"
            onClick={() => { setDraft(""); update({ q: null }); }}
            style={{ ...control, cursor: "pointer", color: "var(--axis-gray)" }}
          >
            {L.reset}
          </button>
        )}
      </form>

      <select value={maker} onChange={(e) => update({ maker: e.target.value || null })} style={control}>
        <option value="">{L.allMakers}</option>
        {makers.map((m) => (
          <option key={m.maker} value={m.maker}>
            {m.maker} ({m.count})
          </option>
        ))}
      </select>

      <select value={sort} onChange={(e) => update({ sort: e.target.value })} style={control}>
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {showUpcomingToggle && (
      <label className="flex cursor-pointer items-center gap-2 text-xs" style={{ color: "var(--axis-gray)" }}>
        <input
          type="checkbox"
          checked={showAll}
          onChange={(e) => update({ upcoming: e.target.checked ? "0" : null })}
        />
        {L.showPast}
      </label>
      )}
    </div>
  );
}
