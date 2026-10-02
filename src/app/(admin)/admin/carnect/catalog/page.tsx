// Каталог carnect в админке: один фильтр по всем аукционам и HeyDealer.
//
//   /admin/carnect/catalog?make=Hyundai&model=Grandeur&year_min=2019&src=glovis,lotte
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

import { requireAdmin } from "../../auction/shell";
import { HEY_TYPES } from "@/lib/carnect/heydealer";
import { HOUSES, type CarnectHouse } from "@/lib/carnect/houses";
import { FUELS, PAGE_SIZE, readFilter, searchCatalog, type CatalogRow, type SourceCount } from "@/lib/carnect/query";

import { C, Page, Panel, km, krw } from "../ui";

import AutoSubmitSelect from "./AutoSubmitSelect";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Адрес каталога с изменёнными параметрами; пустые выкидываются, page сбрасывается. */
function withParams(sp: SP, patch: Record<string, string | undefined>): string {
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
  return `/admin/carnect/catalog?${q.toString()}`;
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
 * Autobell и типы HeyDealer — мелкие внутри. Клик переключает источник в
 * фильтре; выбранные подсвечены. Числа — под ВСЕ условия, кроме самих
 * источников, поэтому выбор Lotte не обнуляет остальных.
 */
function SourceBar({ sp, counts, selected }: { sp: SP; counts: SourceCount[]; selected: string[] }) {
  const order = [...Object.keys(HOUSES), "heydealer"];
  const byHouse = new Map<string, SourceCount[]>();
  for (const c of counts) byHouse.set(c.house, [...(byHouse.get(c.house) ?? []), c]);
  const toggle = (key: string) => {
    const next = selected.includes(key) ? selected.filter((s) => s !== key) : [...selected, key];
    return withParams(sp, { src: next.join(",") || undefined });
  };
  const chip = (key: string, label: string, n: number, big: boolean, hint?: string) => {
    const on = selected.includes(key);
    return (
      <Link
        key={key}
        href={toggle(key)}
        aria-pressed={on}
        title={hint}
        className={big ? "rounded-lg px-3 py-1.5 text-sm font-semibold" : "rounded-full px-2.5 py-0.5 text-xs"}
        style={{
          border: `1px solid ${on ? C.accent : C.line}`,
          color: on ? C.accent : n ? C.text : C.muted,
          backgroundColor: big ? C.card : "transparent",
        }}
      >
        {label} <span style={{ color: C.muted }}>{n.toLocaleString("ru-RU")}</span>
      </Link>
    );
  };

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
              {chip(house, sourceLabel(house), total, true)}
              <div className="flex flex-wrap gap-1">
                {HEY_TYPES.map((t) =>
                  chip(
                    `${house}:${t.type}`,
                    t.label,
                    parts.find((p) => p.hey_type === t.type)?.n ?? 0,
                    false,
                    t.hint,
                  ),
                )}
              </div>
            </div>
          );
        }
        return (
          <div key={house} className="flex flex-col gap-1">
            {chip(house, sourceLabel(house), total, true)}
            {subs.length > 1 && (
              <div className="flex flex-wrap gap-1">
                {subs.map((p) =>
                  chip(`${house}:${p.hey_type ?? p.venue_code}`, sourceLabel(house, p), p.n, false),
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

function priceText(r: CatalogRow): string {
  if (r.price_kind === "fixed") return `${krw(r.price_krw)} фикс`;
  if (r.price_kind === "start") return `старт ${krw(r.price_krw)}`;
  return r.house === "heydealer" ? "ставки" : "цена на торгах";
}

function Tile({ r }: { r: CatalogRow }) {
  const when = r.auction_date ?? (r.end_at ? `до ${r.end_at.slice(0, 16).replace("T", " ")}` : null);
  return (
    <Link
      href={`/admin/carnect/${r.house}/${encodeURIComponent(r.external_id)}`}
      className="block overflow-hidden rounded-xl transition-opacity hover:opacity-90"
      style={{ backgroundColor: C.card, border: `1px solid ${C.line}` }}
    >
      <div className="relative aspect-[4/3] w-full" style={{ backgroundColor: "#1E1E1E" }}>
        {r.photo_url && (
          // Фото на CDN площадки / S3 HeyDealer, не у нас и не у carnect.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.photo_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <span
          className="absolute left-2 top-2 rounded px-1.5 py-0.5 text-[11px] font-semibold"
          style={{
            backgroundColor: "rgba(0,0,0,0.7)",
            // Тип HeyDealer различим цветом рамки: торги у них устроены по-разному.
            border: r.hey_type ? `1px solid ${HEY_COLORS[r.hey_type] ?? C.line}` : undefined,
          }}
          title={r.hey_type ? HEY_TYPES.find((t) => t.type === r.hey_type)?.hint : undefined}
        >
          {sourceLabel(r.house)}
          {r.venue || r.hey_type ? ` · ${sourceLabel(r.house, r)}` : ""}
        </span>
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
            {priceText(r)}
          </span>
          <span className="text-xs" style={{ color: C.muted }}>
            {km(r.km)}
          </span>
        </div>
        <div className="mt-1 text-[11px]" style={{ color: C.muted }}>
          {[FUELS.find((f) => f.v === r.fuel)?.label, when, r.insp_grade].filter(Boolean).join(" · ")}
        </div>
      </div>
    </Link>
  );
}

const inputCls = "rounded-lg px-2 py-1.5 text-sm";
const inputStyle = { backgroundColor: "#1E1E1E", border: `1px solid ${C.line}`, color: C.text };

export default async function CarnectCatalog({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;

  // Смена марки сбрасывает модель: prev_make — марка, с которой форма
  // отправлялась прошлый раз. Не совпала — модель прежней марки выкидываем.
  const prevMake = first(sp.prev_make);
  const sp2: SP = prevMake && prevMake !== first(sp.make) ? { ...sp, model: undefined } : sp;

  const filter = readFilter(sp2);
  const pageRaw = Number(first(sp.page) || 1);
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const res = await searchCatalog(filter, page);
  const pages = res.ok ? Math.max(1, Math.ceil(res.total / PAGE_SIZE)) : 1;
  const years = Array.from({ length: 2027 - 2005 }, (_, i) => 2026 - i);

  return (
    <Page>
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Каталог аукционов</h1>
          <p className="mt-1 text-xs" style={{ color: C.muted }}>
            Все аукционы и HeyDealer одним фильтром. Данные из нашей базы (крон дважды в сутки), а не с carnect
            напрямую.
          </p>
        </div>
        <Link href="/admin/carnect" className="text-sm" style={{ color: C.accent }}>
          источник напрямую →
        </Link>
      </header>

      {/* GET-форма: состояние фильтра живёт в адресе. */}
      <form method="get" action="/admin/carnect/catalog" className="mb-4 flex flex-wrap items-end gap-2">
        <input type="hidden" name="prev_make" value={filter.make ?? ""} />
        {filter.src?.length ? <input type="hidden" name="src" value={filter.src.join(",")} /> : null}
        <label className="flex flex-col text-[11px]" style={{ color: C.muted }}>
          марка
          {/* Выбор марки сразу отправляет форму: список моделей строится на
              сервере по марке, без отправки он остался бы выключенным. */}
          <AutoSubmitSelect name="make" defaultValue={filter.make ?? ""} className={inputCls} style={inputStyle}>
            <option value="">любая</option>
            {res.ok &&
              res.makes.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.v} ({m.n})
                </option>
              ))}
          </AutoSubmitSelect>
        </label>
        <label className="flex flex-col text-[11px]" style={{ color: C.muted }}>
          модель
          {/* Видна всегда, отключена без марки — приём фильтра Encar: вёрстка не прыгает. */}
          <AutoSubmitSelect
            name="model"
            defaultValue={filter.model_group ?? ""}
            disabled={!filter.make}
            className={inputCls}
            style={inputStyle}
          >
            <option value="">{filter.make ? "любая" : "сначала марка"}</option>
            {res.ok &&
              res.models.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.v} ({m.n})
                </option>
              ))}
          </AutoSubmitSelect>
        </label>
        <label className="flex flex-col text-[11px]" style={{ color: C.muted }}>
          год от
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
          год до
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
          пробег до, км
          <input name="km_max" inputMode="numeric" defaultValue={filter.km_max ?? ""} placeholder="150000" className={`${inputCls} w-28`} style={inputStyle} />
        </label>
        <label className="flex flex-col text-[11px]" style={{ color: C.muted }}>
          цена до, млн ₩
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
          сортировка
          <select name="sort" defaultValue={filter.sort ?? "new"} className={inputCls} style={inputStyle}>
            <option value="new">новые</option>
            <option value="price">дешевле</option>
            <option value="year">моложе</option>
            <option value="km">меньше пробег</option>
          </select>
        </label>
        <fieldset className="flex flex-wrap items-center gap-2 text-xs">
          {FUELS.map((f) => (
            <label key={f.v} className="flex items-center gap-1">
              <input type="checkbox" name="fuel" value={f.v} defaultChecked={filter.fuel?.includes(f.v)} />
              {f.label}
            </label>
          ))}
          {/* Снятая галочка = no_price=0. Отмеченная не шлёт ничего — значение по умолчанию. */}
          <label className="flex items-center gap-1" title="Lotte и HeyDealer Self/Zero не публикуют цену">
            <input type="checkbox" name="no_price" value="0" defaultChecked={filter.include_no_price === false} />
            скрыть лоты без цены
          </label>
        </fieldset>
        <button
          type="submit"
          className="rounded-lg px-4 py-1.5 text-sm font-semibold"
          style={{ backgroundColor: "var(--axis-bronze-deep, #9D5E34)", color: "#fff" }}
        >
          Показать
        </button>
        <Link href="/admin/carnect/catalog" className="py-1.5 text-sm" style={{ color: C.muted }}>
          сбросить
        </Link>
      </form>

      {!res.ok ? (
        <Panel title="База не ответила">
          <p className="text-sm" style={{ color: C.bad }}>
            {res.error}
          </p>
          <p className="mt-2 text-xs" style={{ color: C.muted }}>
            Если сказано, что функции carnect_search или таблицы carnect_lots нет, — не выполнена миграция
            sql/042_carnect_lots.sql. Если таблица пустая — крон ещё ни разу не отработал.
          </p>
        </Panel>
      ) : (
        <>
          <SourceBar sp={sp2} counts={res.bySource} selected={filter.src ?? []} />

          <p className="mb-3 text-sm" style={{ color: C.muted }}>
            Найдено <b style={{ color: C.text }}>{res.total.toLocaleString("ru-RU")}</b>
            {res.total > PAGE_SIZE ? ` · страница ${page} из ${pages}` : ""}
          </p>

          {res.rows.length === 0 ? (
            <Panel title="Ничего не нашлось">
              <p className="text-sm" style={{ color: C.muted }}>
                Под фильтр ничего не подошло. Ослабьте условия или снимите выбор источников.
              </p>
            </Panel>
          ) : (
            <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {res.rows.map((r) => (
                <Tile key={`${r.house}/${r.external_id}`} r={r} />
              ))}
            </section>
          )}

          {pages > 1 && (
            <nav className="mb-6 flex items-center justify-center gap-3 text-sm">
              {page > 1 && (
                <Link href={withParams(sp2, { page: String(page - 1) })} style={{ color: C.accent }}>
                  ← назад
                </Link>
              )}
              <span style={{ color: C.muted }}>
                {page} из {pages}
              </span>
              {page < pages && (
                <Link href={withParams(sp2, { page: String(page + 1) })} style={{ color: C.accent }}>
                  дальше →
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </Page>
  );
}
