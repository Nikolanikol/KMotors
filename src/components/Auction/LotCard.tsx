// Карточка лота аукциона.
//
// Почему не переиспользован CarCard: тот завязан на Encar по всем трём осям —
// собирает адрес фотографии как `https://ci.encar.com${photo}` через
// encarLoader, ведёт на /[lang]/catalog/${id} и считает цену через
// convertedCarPrice, то есть прибавляет стояночный сбор. Для лота аукциона
// неверно всё три. Переиспользован визуальный язык — токены, скругления,
// бронза на наведении — и Pagination из Catalog/Row.
//
// ⚠️ Цены здесь НЕ проходят через carPricing.ts. У авто с Encar цена =
// объявление + стояночный сбор; у запчастей KRW → USD с маржой из
// pricing.ts. Лот аукциона — третья модель: стартовая цена в вонах как есть
// плюс прогноз молотка. Что из этого показывать клиенту и с какой
// надбавкой — решение не принято, поэтому витрина служебная.
//
// ⚠️ Картинка идёт обычным <img>, а не next/image, СОЗНАТЕЛЬНО. Площадка
// отдаёт .JPG с content-type: image/gif (проверено curl'ом), оптимизатор
// Next на такой ответ полагаться не может. Плюс это честный хотлинк —
// трафик картинок идёт мимо нашего сервера, копию мы не храним.

import Link from "next/link";

import { daysUntilAuction, pluralDays } from "@/components/Auction/carAge";
import { readableKorean, specLabel } from "@/lib/kcar/dict";
import type { Estimate } from "@/lib/kcar/estimate";
import type { LotRow } from "@/lib/kcar/query";

/**
 * Подписи приходят ПРОПОМ, а не берутся из словаря внутри.
 *
 * ⚠️ Карточка живёт на двух разных страницах: служебной под /admin, где
 * инстанса i18next нет вовсе, и публичной под [lang], где он есть, но только
 * на клиенте. Компонент серверный и без состояния — вызвать t() он не может ни
 * там, ни там. Поэтому строки готовит вызывающая сторона: админка отдаёт
 * RU_LOT_LABELS, витрина — словарь языка через auctionLabels().
 */
export type LotCardLabels = Record<string, string>;

/** Подписи служебной витрины: она всегда русская и словаря не подключает. */
export const RU_LOT_LABELS: LotCardLabels = {
  noPhoto: "без фото",
  km: "км",
  body: "кузов",
  grade: "класс",
  defects: "дефектов",
  start: "старт",
  forecast: "прогноз молотка",
  noForecast: "прогноза нет",
  lane: "полоса",
  lot: "лот",
  exportBlocked: "экспорт запрещён",
  mortgage: "залог",
  seizure: "арест",
  won: "₩",
  today: "торги сегодня",
  tomorrow: "торги завтра",
  inDays: "через {{count}} дн.",
  past: "торги прошли",
  basisModel: "по {{count}} сделкам этой модели",
  basisGrade: "по классу, {{count}} сделок",
  basisMarket: "по рынку, {{count}} сделок",
};

const krw = (v: number | null | undefined, locale = "ru-RU") =>
  v == null ? "—" : v.toLocaleString(locale);

/** Оценка кузова у площадки 1–9: чем выше, тем лучше. Ниже 4 — тревога. */
function gradeTone(grade: string | null): string {
  const n = Number(grade);
  if (!Number.isFinite(n)) return "var(--axis-gray)";
  if (n >= 7) return "#5FA463";
  if (n >= 4) return "var(--axis-bronze)";
  return "#C4563F";
}

function basisLabel(e: Estimate, T: LotCardLabels): string {
  const key = e.basis === "model" ? "basisModel" : e.basis === "grade" ? "basisGrade" : "basisMarket";
  return (T[key] ?? "").replace(/\{\{count\}\}/g, String(e.sampleSize));
}

function Chip({ children, tone = "var(--axis-gray)" }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] leading-none"
      style={{ color: tone, border: `1px solid ${tone}`, opacity: 0.9 }}
    >
      {children}
    </span>
  );
}

export default function LotCard({
  lot,
  estimate,
  labels: T,
  hrefBase = "/admin/auction",
  lang = "ru",
}: {
  lot: LotRow;
  estimate: Estimate | null;
  labels: LotCardLabels;
  /** «/admin/auction» у служебной витрины, «/ru/auction» у публичной. */
  hrefBase?: string;
  /**
   * Язык витрины. Нужен не только подписям: числа и значения характеристик
   * тоже локальные — «153 267 km» против «153,267 km» и «Дизель» против
   * «Diesel».
   */
  lang?: string;
}) {
  const isLotte = lot.source === "lotte";
  // ⚠️ Комплектация у KCar приходит смешанной: «640d xDrive 그란쿠페».
  // Непереведённые корейские слова из ПОДПИСИ выбрасываем — здесь, в отличие
  // от описи состояния на детальной, фраза не техническая, и потеря слова не
  // искажает смысл. У Lotte строка уже латиницей, функция её не тронет.
  const trimLabel = readableKorean(lot.trim);
  const days = daysUntilAuction(lot.auction_date);
  const countdown =
    days == null
      ? null
      : {
          label:
            days < 0
              ? T.past
              : days === 0
                ? T.today
                : days === 1
                  ? T.tomorrow
                  // ⚠️ Склонение подставляется только в русскую подпись: в ней
                  // стоит «дн.» как заготовка, а у английской формы этой
                  // проблемы нет вовсе.
                  : (T.inDays ?? "").replace(/\{\{count\}\}/g, String(days)).replace("дн.", pluralDays(days)),
          soon: days >= 0 && days <= 3,
        };
  // ⚠️ Название прогоняется через словарь с ФОЛБЭКОМ на сырое значение.
  // Модель — это то, по чему лот вообще узнают: если словарь не знает ни
  // одного слова и вернёт пусто, лучше показать хангыль, чем голую марку.
  const modelLabel = readableKorean(lot.model) ?? lot.model;
  const title = [lot.maker, modelLabel].filter(Boolean).join(" ") || lot.external_id;
  // ⚠️ Локаль чисел берётся от языка страницы. Захардкоженная ru-RU ставила
  // узкий неразрывный пробел в разряды и на английской витрине — «153 267 km»
  // вместо «153,267 km».
  const numberLocale = lang === "ru" ? "ru-RU" : "en-US";
  const specs = [
    lot.mileage_km != null ? `${lot.mileage_km.toLocaleString(numberLocale)} ${T.km}` : null,
    specLabel(lot.fuel, lang),
    specLabel(lot.transmission, lang),
  ].filter(Boolean);

  const warnings: string[] = [];
  if (lot.blocked_export) warnings.push(T.exportBlocked);
  if (lot.mortgages) warnings.push(`${T.mortgage}: ${lot.mortgages}`);
  if (lot.seizures) warnings.push(`${T.seizure}: ${lot.seizures}`);

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300"
      style={{
        backgroundColor: "var(--axis-charcoal)",
        border: "1px solid rgba(74,74,74,0.25)",
      }}
    >
      <Link
        href={`${hrefBase}/${isLotte ? "lotte/" : ""}${lot.external_id}`}
        aria-label={title}
        className="relative block aspect-[16/10] overflow-hidden"
        style={{ backgroundColor: "var(--axis-graphite)" }}
      >
        {lot.thumb_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lot.thumb_url}
            alt={`${title} ${lot.year ?? ""}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-xs"
            style={{ color: "var(--axis-gray)" }}
          >
            {T.noPhoto}
          </div>
        )}

        <div className="absolute left-2 top-2 flex gap-1">
          {lot.grade_int && (
            <span
              className="rounded px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white"
              style={{ backgroundColor: "var(--axis-bronze-deep)" }}
            >
              {T.grade} {lot.grade_int}
            </span>
          )}
          {lot.grade_ext && (
            <span
              className="rounded px-1.5 py-0.5 text-[11px] font-semibold leading-none"
              style={{ backgroundColor: "rgba(0,0,0,0.65)", color: gradeTone(lot.grade_ext) }}
            >
              {T.body} {lot.grade_ext}
            </span>
          )}
        </div>

        {countdown && (
          // ⚠️ Бейдж внизу слева, а не в углу к остальным: сверху уже стоят
          // класс с оценкой (слева) и полоса с номером лота (справа), и третий
          // угловой ярлык превратил бы фото в доску объявлений.
          <span
            className="absolute bottom-2 left-2 rounded px-1.5 py-0.5 text-[11px] font-semibold leading-none"
            style={{
              backgroundColor: "rgba(0,0,0,0.65)",
              color: countdown.soon ? "var(--axis-bronze)" : "var(--axis-gray)",
            }}
          >
            {countdown.label}
          </span>
        )}

        {(lot.lane || lot.lot_no != null) && (
          <span
            className="absolute right-2 top-2 rounded px-1.5 py-0.5 text-[11px] leading-none"
            style={{ backgroundColor: "rgba(0,0,0,0.65)", color: "var(--axis-gray)" }}
          >
            {T.lane} {lot.lane ?? "—"} · {T.lot} {lot.lot_no ?? "—"}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <h3 className="text-sm font-semibold leading-tight" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
            <Link href={`${hrefBase}/${isLotte ? "lotte/" : ""}${lot.external_id}`} className="hover:underline">
              {title}
            </Link>{" "}
            {lot.year ? <span style={{ color: "var(--axis-gray)" }}>· {lot.year}</span> : null}
          </h3>
          {trimLabel && (
            <p className="mt-0.5 truncate text-xs" style={{ color: "var(--axis-gray)" }}>
              {trimLabel}
            </p>
          )}
        </div>

        {specs.length > 0 && (
          <p className="text-xs" style={{ color: "var(--axis-gray)" }}>
            {specs.join(" · ")}
          </p>
        )}

        <div className="flex flex-wrap gap-1">
          {lot.usage && <Chip>{specLabel(lot.usage, lang)}</Chip>}
          {!!lot.defect_count && (
            <Chip tone="#C4563F">
              {T.defects}: {lot.defect_count}
            </Chip>
          )}
          {warnings.map((w) => (
            <Chip key={w} tone="#C4563F">
              {w}
            </Chip>
          ))}
        </div>

        <div className="mt-auto pt-2" style={{ borderTop: "1px solid rgba(74,74,74,0.25)" }}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--axis-gray)" }}>
              {T.start}
            </span>
            <span className="text-base font-semibold" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
              {/*
                ⚠️ Обе площадки в ВОНАХ. У Lotte витрина умеет отдавать цену и
                в долларах, но это её собственный пересчёт по курсу, которого мы
                не знаем; вона у аукциона исходная. Прогноза молотка у Lotte
                по-прежнему нет и быть не может — истории торгов этой площадки
                у нас не существует, а премия KCar к чужому аукциону
                неприменима.
              */}
              {krw(lot.start_price_krw, numberLocale)} {T.won}
            </span>
          </div>

          {!isLotte && estimate ? (
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="text-[11px]" style={{ color: "var(--axis-gray)" }}>
                {T.forecast}
              </span>
              <span className="text-sm font-semibold" style={{ color: "var(--axis-bronze)" }}>
                {krw(estimate.hammerKrw, numberLocale)} {T.won}
                <span className="ml-1 text-[11px] font-normal">+{estimate.premiumPct}%</span>
              </span>
            </div>
          ) : isLotte ? null : (
            <p className="mt-1 text-[11px]" style={{ color: "var(--axis-gray)" }}>
              {T.noForecast}
            </p>
          )}

          {!isLotte && estimate && (
            <p className="mt-0.5 text-right text-[11px]" style={{ color: "var(--axis-gray)" }}>
              {basisLabel(estimate, T)}
            </p>
          )}
        </div>

        <p className="text-[11px]" style={{ color: "var(--axis-gray)" }}>
          {lot.external_id}
          {lot.auction_date ? ` · ${lot.auction_date}` : ""}
          {lot.site ? ` · ${lot.site}` : ""}
        </p>
      </div>
    </article>
  );
}
