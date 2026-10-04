// Каталог carnect: один фильтр по всем аукционам и HeyDealer. Общий для
// витрины (/[lang]/auction, по-английски, с кешем выборки) и админки
// (/admin/carnect/catalog, по-русски, без кеша). Отличаются они только
// пропсами: язык, базовые адреса, кеш, шапка.
//
//   /en/auction?make=Hyundai&model=Grandeur&year_min=2019&src=glovis,lotte
//
// Читает НАШУ базу (carnect_lots, заполняется кроном), а не carnect — поэтому
// отвечает мгновенно и не нагружает источник. Просмотрщик /admin/carnect
// остаётся для проверки того, что прямо сейчас лежит у carnect.
//
// Устройство:
//   • форма — обычный GET без клиентского JS: адрес и есть состояние фильтра,
//     его можно скопировать и переслать, «назад» в браузере работает;
//   • плашки источников с числами под текущий фильтр — ссылки, клик
//     добавляет/убирает источник. Числа считает та же SQL-функция, что и
//     выдачу (carnect_search), — разойтись им не с чего;
//   • смена марки сбрасывает модель (prev_make в форме) — тот же resetChain,
//     что у фильтров Encar и аукционов: модель прежней марки дала бы пустую
//     выдачу при живом списке.
//
// Объём первой версии согласован с владельцем 02.10.2026: марка, модель, год,
// пробег, цена, топливо, источники. Комплектация, цвет, коробка, ДТП —
// позже: у источников они записаны по-разному или есть не у всех.

import Link from "next/link";
import type { ReactNode } from "react";

import { heyGradeLabel } from "@/lib/carnect/card";
import { gradeInfo } from "@/lib/carnect/grades";
import { HEY_TYPES } from "@/lib/carnect/heydealer";
import { HOUSES, type CarnectHouse } from "@/lib/carnect/houses";
import type { CardLang } from "@/lib/carnect/lang";
import {
  FUELS,
  PAGE_SIZE,
  readFilter,
  searchCatalog,
  searchCatalogCached,
  type CatalogRow,
  type SourceCount,
} from "@/lib/carnect/query";

import { getCarRates } from "@/lib/kbFx";

import AuctionHeart from "./AuctionHeart";
import AutoSubmitSelect from "./AutoSubmitSelect";
import LotTimer from "./LotTimer";
import { fmt, koreanTimeUtc, tx, usd, won, type TextKey } from "./text";
import TiltCard from "./TiltCard";
import { C, Page, Panel } from "./ui";

export type SP = Record<string, string | string[] | undefined>;

/** Что отличает витрину от админки. Передаётся вниз одним объектом. */
export interface Ctx {
  lang: CardLang;
  /** Адрес самого каталога: «/en/auction» или «/admin/carnect/catalog». */
  base: string;
  /** Префикс страницы машины: «/en/auction/lot» или «/admin/carnect». */
  lotBase: string;
  /** Курс для справки в $ под ценой (getCarRates, Кукмин-банк). */
  krwToUsd?: number;
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Адрес каталога с изменёнными параметрами; пустые выкидываются, page сбрасывается. */
function withParams(ctx: Ctx, sp: SP, patch: Record<string, string | undefined>): string {
  const q = paramsOf(sp, patch).toString();
  return q ? `${ctx.base}?${q}` : ctx.base;
}

function paramsOf(sp: SP, patch: Record<string, string | undefined>): URLSearchParams {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "page" || k === "prev_make") continue;
    // Повторяющиеся параметры (форма шлёт fuel=gasoline&fuel=diesel) — через
    // запятую: readFilter их так и читает. first() потерял бы все, кроме первого.
    const s = Array.isArray(v) ? v.join(",") : v;
    if (s) q.set(k, s);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v) q.set(k, v);
    else q.delete(k);
  }
  return q;
}

/** Подпись источника для плашки. */
function sourceLabel(house: string, sub?: { venue?: string | null; hey_type?: string | null }): string {
  if (house === "heydealer") {
    return sub?.hey_type ? HEY_TYPES.find((t) => t.type === sub.hey_type)?.label ?? sub.hey_type : "HeyDealer";
  }
  if (sub?.venue) return sub.venue;
  return HOUSES[house as CarnectHouse]?.name.replace(/ \(.*\)$/, "") ?? house;
}

/**
 * Ряд плашек «где сколько». Площадка — крупная плашка с суммой; дома
 * Autobell и типы HeyDealer — мелкие под ней. Числа — под ВСЕ условия, кроме
 * самих источников, поэтому выбор Lotte не обнуляет остальных.
 *
 * Мелкие плашки кликабельны, ТОЛЬКО когда выбрана их площадка (решение
 * владельца 04.10.2026). Раньше они переключались независимо, а carnect_search
 * объединяет ключи через ИЛИ: «glovis» + «glovis:1100» давали весь Autobell, и
 * клик по дому не менял выдачу — было непонятно, включён он или нет. Теперь:
 *   • площадка не выбрана — мелкие плашки серым текстом, только справка;
 *   • клик по дому ЗАМЕНЯЕТ площадку целиком на этот дом (можно добавить ещё);
 *   • снят последний дом — снова вся площадка;
 *   • клик по выбранной площадке снимает её вместе со всеми домами.
 */
function SourceBar({ ctx, sp, counts, selected }: { ctx: Ctx; sp: SP; counts: SourceCount[]; selected: string[] }) {
  const n = (v: number) => fmt(ctx.lang, v);
  const order = [...Object.keys(HOUSES), "heydealer"];
  const byHouse = new Map<string, SourceCount[]>();
  for (const c of counts) byHouse.set(c.house, [...(byHouse.get(c.house) ?? []), c]);
  const href = (next: string[]) => withParams(ctx, sp, { src: next.join(",") || undefined });
  const ofHouse = (house: string) => selected.filter((s) => s === house || s.startsWith(`${house}:`));
  const toggleHouse = (house: string) =>
    ofHouse(house).length ? href(selected.filter((s) => !ofHouse(house).includes(s))) : href([...selected, house]);
  const toggleSub = (house: string, key: string) => {
    if (selected.includes(key)) {
      const next = selected.filter((s) => s !== key);
      return href(next.some((s) => s.startsWith(`${house}:`)) ? next : [...next, house]);
    }
    return href([...selected.filter((s) => s !== house), key]);
  };

  const chip = (key: string, label: string, cnt: number, on: boolean, link: string) => (
    <Link
      key={key}
      href={link}
      aria-pressed={on}
      className="rounded-lg px-3 py-1.5 text-sm font-semibold"
      style={{
        border: `1px solid ${on ? C.accent : C.line}`,
        color: on ? C.accent : cnt ? C.text : C.muted,
        backgroundColor: C.card,
      }}
    >
      {label} <span style={{ color: C.muted }}>{n(cnt)}</span>
    </Link>
  );
  const sub = (house: string, key: string, label: string, cnt: number, hint?: string) => {
    const enabled = ofHouse(house).length > 0;
    if (!enabled) {
      return (
        <span key={key} title={hint} className="px-1 py-0.5 text-xs" style={{ color: C.muted }}>
          {label} {n(cnt)}
        </span>
      );
    }
    const on = selected.includes(key);
    return (
      <Link
        key={key}
        href={toggleSub(house, key)}
        aria-pressed={on}
        title={hint}
        className="rounded-full px-2.5 py-0.5 text-xs"
        style={{ border: `1px solid ${on ? C.accent : C.line}`, color: on ? C.accent : cnt ? C.text : C.muted }}
      >
        {label} <span style={{ color: C.muted }}>{n(cnt)}</span>
      </Link>
    );
  };
  const houseChip = (house: string, n: number) =>
    chip(house, sourceLabel(house), n, ofHouse(house).length > 0, toggleHouse(house));

  return (
    <section className="mb-4 flex flex-wrap items-start gap-3">
      {order.map((house) => {
        const parts = byHouse.get(house) ?? [];
        const total = parts.reduce((s, p) => s + p.n, 0);
        // Внутренние плашки — только где деление реально есть: дома Autobell
        // (venue_code) и типы HeyDealer. У Lotte, SK и т.п. одна часть без кода.
        const subs = parts.filter((p) => p.venue_code || p.hey_type);
        // ⚠️ Типы HeyDealer показываем ВСЕГДА, все три, даже с нулём: механика
        // у них разная (ставки без осмотра / ставки с осмотром / фикс-цена), и
        // по плашке должно быть видно, какой тип ещё не загружен, — иначе при
        // одном загруженном типе деления не видно вовсе (порог «больше одной»).
        if (house === "heydealer") {
          return (
            <div key={house} className="flex flex-col gap-1">
              {houseChip(house, total)}
              <div className="flex flex-wrap gap-1">
                {HEY_TYPES.map((t) =>
                  sub(
                    house,
                    `${house}:${t.type}`,
                    t.label,
                    parts.find((p) => p.hey_type === t.type)?.n ?? 0,
                    ctx.lang === "en" ? t.hintEn : t.hint,
                  ),
                )}
              </div>
            </div>
          );
        }
        return (
          <div key={house} className="flex flex-col gap-1">
            {houseChip(house, total)}
            {subs.length > 1 && (
              <div className="flex flex-wrap gap-1">
                {subs.map((p) =>
                  sub(house, `${house}:${p.hey_type ?? p.venue_code}`, sourceLabel(house, p), p.n),
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

/**
 * Цвет рамки бейджа по типу HeyDealer. Self — без осмотра (серый, «на свой
 * риск»), Zero — с осмотром (синий), Instant — фикс-цена (зелёный).
 */
const HEY_COLORS: Record<string, string> = {
  self: "#9CA3AF",
  customer_zero: "#60A5FA",
  fixed_price_zero: "#4ADE80",
};

function priceText(r: CatalogRow, lang: CardLang): string {
  const t = (k: TextKey) => tx(lang, k);
  if (r.price_kind === "fixed") return `${won(lang, r.price_krw) ?? "—"} ${t("fixed")}`;
  if (r.price_kind === "start") return `${t("start")} ${won(lang, r.price_krw) ?? "—"}`;
  return t(r.house === "heydealer" ? "byBidding" : "priceAtAuction");
}

export function Tile({ ctx, r }: { ctx: Ctx; r: CatalogRow }) {
  const { lang } = ctx;
  // Подпись до старта таймера (сервер, первый кадр): точное время по Корее или день торгов.
  const when = r.end_at
    ? `${tx(lang, r.house === "heydealer" ? "auctionUntil" : "auctionOn")} ${koreanTimeUtc(lang, r.end_at)}`
    : r.auction_date
      ? `${tx(lang, "auctionOn")} ${r.auction_date}`
      : null;
  const fuel = FUELS.find((f) => f.v === r.fuel);
  const heyType = r.hey_type ? HEY_TYPES.find((x) => x.type === r.hey_type) : undefined;
  const grade = r.house === "heydealer" ? null : gradeInfo(r.house as CarnectHouse, r.insp_grade, lang, sourceLabel(r.house));
  const gradeHint = grade?.parts.map((p) => `${p.letter} — ${p.label}: ${p.text}`).join("\n");
  const source = [sourceLabel(r.house), r.venue || r.hey_type ? sourceLabel(r.house, r) : null].filter(Boolean).join(" · ");
  return (
    <TiltCard>
      {/* ♥ — вне ссылки, поверх фото справа (слева уже бейдж площадки). */}
      <AuctionHeart
        className="absolute right-2 top-2 z-30"
        lang={lang}
        lot={{
          key: `${r.house}/${r.external_id}`,
          house: r.house,
          externalId: r.external_id,
          title: [r.year, r.make, r.model_group].filter(Boolean).join(" ") || r.title || r.external_id,
          source,
          photo: r.photo_url,
          priceKrw: r.price_krw,
          priceKind: r.price_kind,
          auctionDate: r.auction_date,
          endAt: r.end_at,
          make: r.make,
          modelGroup: r.model_group,
        }}
      />
      <Link
        href={`${ctx.lotBase}/${r.house}/${encodeURIComponent(r.external_id)}`}
        className="block overflow-hidden"
        style={{ backgroundColor: C.card }}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ backgroundColor: "#1E1E1E" }}>
          {r.photo_url && (
            // Фото на CDN площадки / S3 HeyDealer, не у нас и не у carnect.
            // Приближение при наведении — как у карточек Encar.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={r.photo_url}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
            />
          )}
          <span
            className="absolute left-2 top-2 rounded px-1.5 py-0.5 text-[11px] font-semibold"
            style={{
              backgroundColor: "rgba(0,0,0,0.7)",
              // Тип HeyDealer различим цветом рамки: торги у них устроены по-разному.
              border: r.hey_type ? `1px solid ${HEY_COLORS[r.hey_type] ?? C.line}` : undefined,
            }}
            title={heyType && (lang === "en" ? heyType.hintEn : heyType.hint)}
          >
            {sourceLabel(r.house)}
            {r.venue || r.hey_type ? ` · ${sourceLabel(r.house, r)}` : ""}
          </span>
          {/* Таймер — полосой по низу снимка, как у прежней витрины: угловых
              ярлыков на фото уже хватает, а градиент читается и на светлом
              полу павильона, и на тёмной тени. */}
          {when && (
            <div
              className="absolute inset-x-0 bottom-0 px-2.5 pb-1.5 pt-5 text-xs font-semibold"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)", color: "var(--axis-cream, #F5F0EB)" }}
            >
              <LotTimer
                at={r.end_at}
                date={r.auction_date}
                kind={r.house === "heydealer" ? "ends" : "starts"}
                lang={lang}
                fallback={when}
              />
            </div>
          )}
        </div>
        <div className="p-3">
          <div className="text-sm font-semibold leading-tight">
            {r.year ?? "—"} {r.make ?? ""} {r.model_group ?? ""}
          </div>
          <div className="mt-0.5 truncate text-xs" style={{ color: C.muted }}>
            {r.title ?? ""}
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm font-semibold" style={{ color: C.accent }}>
              {priceText(r, lang)}
            </span>
            <span className="text-xs" style={{ color: C.muted }}>
              {r.km ? `${fmt(lang, r.km)} ${tx(lang, "km")}` : "—"}
            </span>
          </div>
          {r.price_kind !== "none" && usd(lang, r.price_krw, ctx.krwToUsd) && (
            <div className="text-xs" style={{ color: C.muted }}>
              {usd(lang, r.price_krw, ctx.krwToUsd)}
            </div>
          )}
          {/* Расшифровка оценки — подсказкой; целиком она на странице машины. */}
          <div className="mt-1 text-[11px]" style={{ color: C.muted }} title={gradeHint}>
            {[
              fuel && (lang === "en" ? fuel.en : fuel.label),
              r.insp_grade &&
                (r.house === "heydealer"
                  ? heyGradeLabel(r.insp_grade, lang)
                  : `${tx(lang, "grade")} ${r.insp_grade}`),
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
      </Link>
    </TiltCard>
  );
}

/**
 * Номера страниц: первая, последняя и окно ±2 вокруг текущей, разрывы — «…».
 * При ~100 страницах «назад / дальше» по одной не годились (запрос владельца
 * 04.10.2026). Плюс поле «на страницу» — GET-форма с текущим фильтром в
 * скрытых полях, без клиентского JS, как и весь каталог.
 */
function Pager({ ctx, sp, page, pages }: { ctx: Ctx; sp: SP; page: number; pages: number }) {
  const nums = new Set([1, pages]);
  for (let p = page - 2; p <= page + 2; p++) if (p >= 1 && p <= pages) nums.add(p);
  const list = [...nums].sort((a, b) => a - b);
  const cell = "min-w-9 rounded-lg px-2.5 py-1.5 text-center text-sm";
  const go = (p: number, label: string, key: string) => (
    <Link
      key={key}
      href={withParams(ctx, sp, { page: p > 1 ? String(p) : undefined })}
      aria-current={p === page && label === String(p) ? "page" : undefined}
      className={cell}
      style={
        p === page && label === String(p)
          ? { backgroundColor: "var(--axis-bronze-deep, #9D5E34)", color: "#fff" }
          : { border: `1px solid ${C.line}`, color: C.text }
      }
    >
      {label}
    </Link>
  );
  const hidden = [...paramsOf(sp, { page: undefined }).entries()];

  return (
    <nav className="mb-6 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? go(page - 1, "←", "prev") : null}
      {list.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - list[i - 1] > 1 && (
            <span className="px-1 text-sm" style={{ color: C.muted }}>
              …
            </span>
          )}
          {go(p, String(p), `p${p}`)}
        </span>
      ))}
      {page < pages ? go(page + 1, "→", "next") : null}
      <form method="get" action={ctx.base} className="ml-3 flex items-center gap-1.5 text-sm">
        {hidden.map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <label htmlFor="pager-page" style={{ color: C.muted }}>
          {tx(ctx.lang, "goToPage")}
        </label>
        <input
          id="pager-page"
          name="page"
          type="number"
          min={1}
          max={pages}
          defaultValue={page}
          className="w-20 rounded-lg px-2 py-1.5 text-sm"
          style={inputStyle}
        />
        <button type="submit" className={cell} style={{ border: `1px solid ${C.line}`, color: C.text }}>
          {tx(ctx.lang, "go")}
        </button>
      </form>
    </nav>
  );
}

const inputCls = "rounded-lg px-2 py-1.5 text-sm";
const inputStyle = { backgroundColor: "#1E1E1E", border: `1px solid ${C.line}`, color: C.text };

/**
 * Каталог целиком. Серверный: форма — обычный GET, без клиентского JS.
 *
 * `cached` — витрина: выборка из кеша на 10 минут (query.ts). Админке нужна
 * свежесть сразу после синка, она идёт в базу напрямую.
 * `showReason` — причина сбоя базы видна только на служебном хосте: клиенту
 * нужно «временно недоступно», а не внутренности.
 */
export default async function CatalogView({
  searchParams: sp,
  lang,
  base,
  lotBase,
  cached,
  showReason,
  withHeader = false,
  intro,
}: {
  searchParams: SP;
  lang: CardLang;
  base: string;
  lotBase: string;
  cached: boolean;
  showReason: boolean;
  withHeader?: boolean;
  /** Шапка над фильтром: заголовок и оговорки, у витрины и админки свои. */
  intro: ReactNode;
}) {
  const t = (k: TextKey) => tx(lang, k);

  // Смена марки сбрасывает модель: prev_make — марка, с которой форма
  // отправлялась прошлый раз. Не совпала — модель прежней марки выкидываем.
  const prevMake = first(sp.prev_make);
  const sp2: SP = prevMake && prevMake !== first(sp.make) ? { ...sp, model: undefined } : sp;

  const filter = readFilter(sp2);
  const pageRaw = Number(first(sp.page) || 1);
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  // Курс читается из кеша данных (fetch с revalidate в kbFx.ts), а не из сети на запрос.
  const [res, rates] = await Promise.all([(cached ? searchCatalogCached : searchCatalog)(filter, page), getCarRates()]);
  const ctx: Ctx = { lang, base, lotBase, krwToUsd: rates.krwToUsd };
  const pages = res.ok ? Math.max(1, Math.ceil(res.total / PAGE_SIZE)) : 1;
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear + 2 - 2005 }, (_, i) => thisYear + 1 - i);

  return (
    <Page withHeader={withHeader}>
      {intro}

      {/* GET-форма: состояние фильтра живёт в адресе. */}
      <form method="get" action={base} className="mb-4 flex flex-wrap items-end gap-2">
        <input type="hidden" name="prev_make" value={filter.make ?? ""} />
        {filter.src?.length ? <input type="hidden" name="src" value={filter.src.join(",")} /> : null}
        <label className="flex flex-col text-[11px]" style={{ color: C.muted }}>
          {t("make")}
          {/* Выбор марки сразу отправляет форму: список моделей строится на
              сервере по марке, без отправки он остался бы выключенным. */}
          <AutoSubmitSelect name="make" defaultValue={filter.make ?? ""} className={inputCls} style={inputStyle}>
            <option value="">{t("any")}</option>
            {res.ok &&
              res.makes.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.v} ({m.n})
                </option>
              ))}
          </AutoSubmitSelect>
        </label>
        <label className="flex flex-col text-[11px]" style={{ color: C.muted }}>
          {t("model")}
          {/* Видна всегда, отключена без марки — приём фильтра Encar: вёрстка не прыгает. */}
          <AutoSubmitSelect
            name="model"
            defaultValue={filter.model_group ?? ""}
            disabled={!filter.make}
            className={inputCls}
            style={inputStyle}
          >
            <option value="">{filter.make ? t("any") : t("makeFirst")}</option>
            {res.ok &&
              res.models.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.v} ({m.n})
                </option>
              ))}
          </AutoSubmitSelect>
        </label>
        <label className="flex flex-col text-[11px]" style={{ color: C.muted }}>
          {t("yearFrom")}
          <select name="year_min" defaultValue={filter.year_min ?? ""} className={inputCls} style={inputStyle}>
            <option value="">—</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-[11px]" style={{ color: C.muted }}>
          {t("yearTo")}
          <select name="year_max" defaultValue={filter.year_max ?? ""} className={inputCls} style={inputStyle}>
            <option value="">—</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-[11px]" style={{ color: C.muted }}>
          {t("kmMax")}
          <input
            name="km_max"
            inputMode="numeric"
            defaultValue={filter.km_max ?? ""}
            placeholder="150000"
            className={`${inputCls} w-28`}
            style={inputStyle}
          />
        </label>
        <label className="flex flex-col text-[11px]" style={{ color: C.muted }}>
          {t("priceMax")}
          <input
            name="price_max"
            inputMode="numeric"
            defaultValue={filter.price_max ? filter.price_max / 1_000_000 : ""}
            placeholder="20"
            className={`${inputCls} w-24`}
            style={inputStyle}
          />
        </label>
        <label className="flex flex-col text-[11px]" style={{ color: C.muted }}>
          {t("sort")}
          <select name="sort" defaultValue={filter.sort ?? "new"} className={inputCls} style={inputStyle}>
            <option value="new">{t("sortNew")}</option>
            <option value="soon">{t("sortSoon")}</option>
            <option value="price">{t("sortPrice")}</option>
            <option value="year">{t("sortYear")}</option>
            <option value="km">{t("sortKm")}</option>
          </select>
        </label>
        <fieldset className="flex flex-wrap items-center gap-2 text-xs">
          {FUELS.map((f) => (
            <label key={f.v} className="flex items-center gap-1">
              <input type="checkbox" name="fuel" value={f.v} defaultChecked={filter.fuel?.includes(f.v)} />
              {lang === "en" ? f.en : f.label}
            </label>
          ))}
          {/* Снятая галочка = no_price=0. Отмеченная не шлёт ничего — значение по умолчанию. */}
          <label className="flex items-center gap-1" title={t("hideNoPriceHint")}>
            <input type="checkbox" name="no_price" value="0" defaultChecked={filter.include_no_price === false} />
            {t("hideNoPrice")}
          </label>
        </fieldset>
        <button
          type="submit"
          className="rounded-lg px-4 py-1.5 text-sm font-semibold"
          style={{ backgroundColor: "var(--axis-bronze-deep, #9D5E34)", color: "#fff" }}
        >
          {t("show")}
        </button>
        <Link href={base} className="py-1.5 text-sm" style={{ color: C.muted }}>
          {t("reset")}
        </Link>
      </form>

      {!res.ok ? (
        <Panel title={t("catalogDown")}>
          <p className="text-sm" style={{ color: C.muted }}>
            {t("catalogDownText")}
          </p>
          {/* Причина — только нам, на служебном хосте. */}
          {showReason && (
            <p className="mt-2 text-xs" style={{ color: C.bad }}>
              {res.error} · Если нет carnect_search / carnect_lots — не выполнена миграция
              sql/042_carnect_lots.sql; если таблица пустая — крон ещё не отработал.
            </p>
          )}
        </Panel>
      ) : (
        <>
          <SourceBar ctx={ctx} sp={sp2} counts={res.bySource} selected={filter.src ?? []} />

          <p className="mb-3 text-sm" style={{ color: C.muted }}>
            {t("found")} <b style={{ color: C.text }}>{fmt(lang, res.total)}</b>
            {res.total > PAGE_SIZE ? ` · ${t("pageOf").replace("{p}", String(page)).replace("{n}", String(pages))}` : ""}
          </p>

          {res.rows.length === 0 ? (
            <Panel title={t("nothing")}>
              <p className="text-sm" style={{ color: C.muted }}>
                {t("nothingText")}
              </p>
            </Panel>
          ) : (
            <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {res.rows.map((r) => (
                <Tile key={`${r.house}/${r.external_id}`} ctx={ctx} r={r} />
              ))}
            </section>
          )}

          {pages > 1 && <Pager ctx={ctx} sp={sp2} page={page} pages={pages} />}
        </>
      )}
    </Page>
  );
}
