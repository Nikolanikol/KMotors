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
  allModels: string;
  /** «цена: любая» и т.д. — первый пункт каждой выпадашки-диапазона. */
  priceAny: string;
  yearAny: string;
  mileageAny: string;
  /** Склеиваются с числом: «до ₩5 млн», «от 2018», «до 50 тыс. км». */
  upTo: string;
  from: string;
  mlnWon: string;
  thsKm: string;
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
  allModels: "все модели",
  priceAny: "цена: любая",
  yearAny: "год: любой",
  mileageAny: "пробег: любой",
  upTo: "до",
  from: "от",
  mlnWon: " млн",
  thsKm: " тыс. км",
  sortLot: "по номеру лота",
  sortPriceAsc: "цена ↑",
  sortPriceDesc: "цена ↓",
  sortYear: "год ↓",
  sortMileage: "пробег ↑",
  showPast: "показывать прошедшие торги",
};

/**
 * Пороги диапазонов — КРУГЛЫЕ числа, а не перцентили выдачи.
 *
 * Ползунок здесь был бы дороже пользы: он требует клиентского состояния и
 * дебаунса, а сетка карточек серверная и без JS. Выпадашка с готовыми
 * ступенями ложится в тот же механизм, что уже работает у марки и сортировки,
 * и читается без подсказок.
 *
 * Пороги намеренно не подогнаны под текущее распределение цен: партия лотов
 * меняется дважды в неделю целиком, и ступени, снятые с одной партии, на
 * следующей были бы уже неверны. Круглые числа не устаревают.
 */
const PRICE_STEPS_MLN = [5, 10, 15, 20, 30];
const YEAR_STEPS = [2015, 2018, 2020, 2022];
const MILEAGE_STEPS_THS = [50, 100, 150, 200];

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
  models,
  showUpcomingToggle = true,
  labels: L = RU_FILTER_LABELS,
}: {
  makers: { maker: string; count: number }[];
  /** Модели выбранной марки. Пусто, пока марка не выбрана — так и задумано. */
  models: { model: string; count: number }[];
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
  const model = params.get("model") ?? "";
  const priceMax = params.get("priceMax") ?? "";
  const yearMin = params.get("yearMin") ?? "";
  const mileageMax = params.get("mileageMax") ?? "";
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

      {/*
        ⚠️ Смена марки ОБНУЛЯЕТ модель. Без этого после перехода с Kia на
        Hyundai в адресе оставалась бы модель прежнего бренда, выдача стала бы
        пустой, а выпадашка модели показывала бы значение, которого нет в
        списке. Ровно эти грабли описаны в постмортеме по фильтру каталога
        Encar (resetChain): сброс верхнего уровня обязан чистить цепочку вниз.
      */}
      <select
        value={maker}
        onChange={(e) => update({ maker: e.target.value || null, model: null })}
        style={control}
      >
        <option value="">{L.allMakers}</option>
        {makers.map((m) => (
          <option key={m.maker} value={m.maker}>
            {m.maker} ({m.count})
          </option>
        ))}
      </select>

      {/*
        Модель видна ВСЕГДА, но отключена, пока не выбрана марка — тот же приём,
        что у шести уровней фильтра каталога Encar (решение владельца: уровни не
        прячутся, иначе вёрстка прыгает на каждый выбор). Список моделей всех
        марок разом был бы бесполезен: модель без марки ничего не сужает.
      */}
      <select
        value={model}
        disabled={!maker || models.length === 0}
        onChange={(e) => update({ model: e.target.value || null })}
        style={{ ...control, opacity: maker && models.length ? 1 : 0.45 }}
      >
        <option value="">{L.allModels}</option>
        {models.map((m) => (
          <option key={m.model} value={m.model}>
            {m.model} ({m.count})
          </option>
        ))}
      </select>

      <select value={priceMax} onChange={(e) => update({ priceMax: e.target.value || null })} style={control}>
        <option value="">{L.priceAny}</option>
        {PRICE_STEPS_MLN.map((n) => (
          <option key={n} value={String(n * 1_000_000)}>
            {L.upTo} ₩{n}{L.mlnWon}
          </option>
        ))}
      </select>

      <select value={yearMin} onChange={(e) => update({ yearMin: e.target.value || null })} style={control}>
        <option value="">{L.yearAny}</option>
        {YEAR_STEPS.map((y) => (
          <option key={y} value={String(y)}>
            {L.from} {y}
          </option>
        ))}
      </select>

      <select value={mileageMax} onChange={(e) => update({ mileageMax: e.target.value || null })} style={control}>
        <option value="">{L.mileageAny}</option>
        {MILEAGE_STEPS_THS.map((n) => (
          <option key={n} value={String(n * 1000)}>
            {L.upTo} {n}{L.thsKm}
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
