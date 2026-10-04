// Страница машины carnect — раскладка будущей публичной карточки, пока в админке.
//
// Устроена по образцу карточки Encar (`[lang]/catalog/[id]`): заголовок над
// галереей, под ней «главное» плашкой и характеристики, справа липкая колонка
// с ценой. Компоненты те же, что у страниц лотов аукциона: Carousel (галерея с
// лайтбоксом), SpecCard / SpecRows, OverviewStrip, AuctionCountdown.
//
// ⚠️ У КАЖДОГО блока отметка «видит клиент» / «только мы» — это требование
// владельца (02.10.2026): страница служит макетом, по которому решается, что
// уйдёт на витрину. Всё служебное собрано в одном свёрнутом блоке внизу и берётся
// из `card.internal` — разделение живёт в модели (card.ts), а не здесь.

import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowLeftRight, Calendar, Car, Fuel, Gauge, Settings2 } from "lucide-react";

import AuctionCountdown from "@/components/Auction/AuctionCountdown";
import OverviewStrip from "@/components/Auction/OverviewStrip";
import { SpecCard, SpecRows } from "@/components/Auction/SpecCard";
import { yearWithAge } from "@/components/Auction/carAge";
import Carousel from "@/components/Catalog/CarDetail/Carousel/Carousel";
import type { CarCard } from "@/lib/carnect/card";

import { FieldTable, ago } from "../../ui";
import BodyDiagram from "./BodyDiagram";
import LotRequestCard from "./LotRequestCard";

const krw = (v: number | null | undefined) => (v ? `₩${v.toLocaleString("ru-RU")}` : null);
const kmText = (v: number | null | undefined) => (v ? `${v.toLocaleString("ru-RU")} км` : null);
const n = (v: number | null | undefined) => (v == null ? null : v.toLocaleString("ru-RU"));

/** «2026-10-06T19:15:05+09:00» → «06.10 в 19:15 (Корея)». Время берём как есть, оно корейское. */
function koreanTime(iso: string | undefined): string | null {
  const m = iso && /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  return m ? `${m[3]}.${m[2]} в ${m[4]}:${m[5]} (Корея)` : null;
}

/** Отметка видимости блока. Зелёная — уйдёт на витрину, серая с замком — только нам. */
function Vis({ us }: { us?: boolean }) {
  return (
    <span
      className="whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={
        us
          ? { border: "1px solid rgba(138,138,138,0.5)", color: "var(--axis-gray)" }
          : { border: "1px solid rgba(63,185,80,0.5)", color: "#3FB950" }
      }
      title={us ? "Клиенту не показывается" : "Будет на публичной карточке"}
    >
      {us ? "🔒 только мы" : "👁 видит клиент"}
    </span>
  );
}

function Block({ title, us, children }: { title: string; us?: boolean; children: ReactNode }) {
  return (
    <SpecCard title={title} aside={<Vis us={us} />}>
      {children}
    </SpecCard>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm" style={{ color: "var(--axis-gray)" }}>
      {children}
    </p>
  );
}

const PRICE_LABEL: Record<CarCard["price"]["kind"], string> = {
  start: "Старт торгов",
  fixed: "Цена выкупа",
  none: "Цена",
};

function PriceCard({ card }: { card: CarCard }) {
  const hey = card.house === "heydealer";
  return (
    <section
      className="rounded-2xl p-5"
      style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(182,119,73,0.4)" }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--axis-gray)" }}>
          {PRICE_LABEL[card.price.kind]}
        </span>
        <Vis />
      </div>
      <div className="text-3xl font-bold" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
        {krw(card.price.krw) ?? (hey ? "ставками" : "на торгах")}
      </div>
      {card.price.kind === "start" && (
        <p className="mt-1 text-xs" style={{ color: "var(--axis-gray)" }}>
          Стартовая — итог торгов обычно выше; сверху сбор аукциона, доставка, растаможка.
        </p>
      )}
      {card.price.kind === "none" && hey && (
        <p className="mt-1 text-xs" style={{ color: "var(--axis-gray)" }}>
          Цены нет: дилеры делают ставки до окончания торгов.
        </p>
      )}
      {card.newPriceKrw && (
        <p className="mt-2 text-sm" style={{ color: "var(--axis-gray)" }}>
          Новая стоила {krw(card.newPriceKrw)}
        </p>
      )}

      {card.auctionDate && (
        <div className="mt-4 rounded-xl px-3 py-2" style={{ border: "1px solid var(--axis-bronze)" }}>
          <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--axis-gray)" }}>
            торги {card.auctionDate}
            {card.startAt ? ` в ${card.startAt.slice(11, 16)}` : ""}
          </div>
          <AuctionCountdown
            date={card.auctionDate}
            fallback={`до ${card.auctionDate}`}
            labels={{ h: "ч", m: "м", s: "с", over: "торги прошли" }}
            className="block text-xl font-bold leading-tight"
            style={{ color: "var(--axis-bronze)" }}
          />
        </div>
      )}
      {card.endAt && (
        <div className="mt-4 rounded-xl px-3 py-2" style={{ border: "1px solid var(--axis-bronze)" }}>
          <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--axis-gray)" }}>
            торги до
          </div>
          <div className="text-lg font-bold" style={{ color: "var(--axis-bronze)" }}>
            {koreanTime(card.endAt)}
          </div>
        </div>
      )}

      {card.inspGrade && (
        <p className="mt-4 text-sm" style={{ color: "var(--axis-gray)" }}>
          Оценка площадки:{" "}
          <span className="font-semibold" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
            {card.inspGrade}
          </span>
          <span className="block text-[11px]">расшифровка шкалы — следующим шагом</span>
        </p>
      )}
    </section>
  );
}

/**
 * Правая колонка: цена и под ней плашка заявки. Одна и та же на узком экране
 * (под фото) и на широком (липкая справа) — разойтись им не с чего.
 */
function Side({ card, id }: { card: CarCard; id: string }) {
  const where = [card.sourceLabel, card.typeLabel, card.venue].filter(Boolean).join(" · ");
  const when = card.auctionDate ? `торги ${card.auctionDate}` : card.endAt ? `торги до ${koreanTime(card.endAt)}` : null;
  const lotRef = [where, `лот ${card.lotNo ?? id}`, when].filter(Boolean).join(", ");
  return (
    <div className="space-y-4">
      <PriceCard card={card} />
      <LotRequestCard carId={`${card.house}/${id}`} carName={card.title} lotRef={lotRef} fixedPrice={card.price.kind === "fixed"} />
    </div>
  );
}

export default function CarCardView({
  card,
  backHref,
  meta,
}: {
  card: CarCard;
  backHref: string;
  meta: { id: string; ms: number; fetchedAt?: string };
}) {
  const h = card.history;
  const hey = card.house === "heydealer";
  const selfType = hey && !card.hasBodyData && !card.checks.length;

  return (
    <main className="min-h-screen px-4 py-6" style={{ backgroundColor: "var(--background, #0A0A0A)" }}>
      <div className="mx-auto max-w-7xl">
        <Link href={backHref} className="text-sm" style={{ color: "var(--axis-bronze)" }}>
          ← каталог
        </Link>

        <div className="mt-3 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          {/* ─── Главная колонка ─── */}
          <div className="min-w-0 space-y-4">
            <div>
              <h1 className="text-2xl font-bold leading-tight lg:text-3xl" style={{ color: "var(--axis-white)" }}>
                {card.title}
              </h1>
              {card.grade && (
                <p className="mt-1 text-base" style={{ color: "var(--axis-gray)" }}>
                  {card.grade}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: "rgba(182,119,73,0.12)",
                    color: "var(--axis-bronze)",
                    border: "1px solid rgba(182,119,73,0.3)",
                  }}
                  title={card.typeHint}
                >
                  {card.sourceLabel}
                  {card.typeLabel ? ` · ${card.typeLabel}` : ""}
                  {card.venue ? ` · ${card.venue}` : ""}
                </span>
                {card.typeHint && (
                  <span className="text-xs" style={{ color: "var(--axis-gray)" }}>
                    {card.typeHint}
                  </span>
                )}
                {card.accident && (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ border: "1px solid rgba(74,74,74,0.5)", color: "var(--axis-cream, #F5F0EB)" }}
                  >
                    {card.accident}
                  </span>
                )}
                <Vis />
              </div>
            </div>

            <Block title={`Фото — ${card.photos.length}`}>
              {card.photos.length ? (
                // ⚠️ imageSource="raw": фото на CDN площадки / HeyDealer, параметры
                // Encar с водяным знаком им дописывать нельзя. labels обязательны —
                // в админке нет i18next, без них в aria-label ушли бы сырые ключи.
                <Carousel
                  photos={card.photos}
                  mode="static"
                  imageSource="raw"
                  carName={card.title}
                  photoLabel="фото"
                  labels={{ open: "Открыть галерею", prev: "Предыдущее фото", next: "Следующее фото", close: "Закрыть" }}
                />
              ) : (
                <Muted>Фото нет.</Muted>
              )}
            </Block>

            {card.engineSound && (
              <Block title="Звук двигателя">
                {/* Ролик с телефона инспектора/продавца, обычно вертикальный:
                    высоту ограничиваем, иначе он займёт два экрана. preload
                    metadata — без клика грузится только первый кадр, не весь файл. */}
                <video
                  src={card.engineSound}
                  controls
                  playsInline
                  preload="metadata"
                  className="mx-auto max-h-[70vh] w-full rounded-xl bg-black object-contain"
                />
                <p className="mt-2 text-xs" style={{ color: "var(--axis-gray)" }}>
                  Запись работающего двигателя. Включите звук.
                </p>
              </Block>
            )}

            {/* Цена на узком экране — сразу под фото, как у карточки Encar. */}
            <div className="lg:hidden">
              <Side card={card} id={meta.id} />
            </div>

            <OverviewStrip
              items={[
                { icon: <Car size={20} />, label: "Модель", value: card.model },
                { icon: <Calendar size={20} />, label: "Год", value: yearWithAge(card.year) },
                { icon: <Gauge size={20} />, label: "Пробег", value: kmText(card.km) },
                { icon: <Fuel size={20} />, label: "Топливо", value: card.fuel },
                { icon: <Settings2 size={20} />, label: "Коробка", value: card.trans },
                { icon: <ArrowLeftRight size={20} />, label: "Объём", value: card.cc ? `${n(card.cc)} см³` : null },
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <Block title="Характеристики">
                <SpecRows
                  rows={[
                    { label: "Марка", value: card.make },
                    { label: "Комплектация", value: card.grade },
                    { label: "Кузов", value: card.body },
                    { label: "Цвет", value: card.color },
                    { label: "Салон", value: card.interior },
                    { label: "Мест", value: card.seats },
                    { label: "Использование", value: card.usage },
                    { label: "Первая регистрация", value: card.firstRegistration },
                  ]}
                />
              </Block>
              <Block title="Документы и торги">
                <SpecRows
                  rows={[
                    { label: "VIN", value: card.vin, mono: true },
                    { label: "Госномер", value: card.plate, mono: true },
                    { label: "Номер лота", value: card.lotNo },
                    { label: "Аукционный дом", value: card.venue ?? (hey ? null : card.sourceLabel) },
                    { label: "Площадка", value: card.sourceLabel + (card.typeLabel ? ` · ${card.typeLabel}` : "") },
                  ]}
                />
                {hey && card.vin && (
                  <p className="mt-2 text-[11px]" style={{ color: "var(--axis-gray)" }}>
                    VIN у HeyDealer приходит обрезанным — так отдаёт источник.
                  </p>
                )}
              </Block>
            </div>

            <Block title="Кузов">
              {card.bodyMarks.length ? (
                <BodyDiagram marks={card.bodyMarks} />
              ) : card.hasBodyData ? (
                <Muted>Повреждений и следов ремонта кузова не отмечено.</Muted>
              ) : selfType ? (
                <Muted>Осмотра нет: тип Self — фото и описание делает сам продавец.</Muted>
              ) : card.inspectionSheet ? (
                <Muted>Площадка отдаёт схему кузова только картинкой — это лист осмотра ниже.</Muted>
              ) : (
                <Muted>Площадка не отдаёт сведений о кузове.</Muted>
              )}
            </Block>

            {card.inspectionSheet && (
              <Block title="Лист осмотра площадки">
                {/* Скан площадки: на белом фоне, как напечатан, — иначе тёмная
                    тема съедает тонкие линии схемы. Клик открывает оригинал. */}
                <a href={card.inspectionSheet} target="_blank" rel="noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.inspectionSheet}
                    alt="Лист осмотра площадки"
                    loading="lazy"
                    className="mx-auto w-full max-w-3xl rounded-lg bg-white p-2"
                  />
                </a>
                <p className="mt-2 text-center text-xs" style={{ color: "var(--axis-gray)" }}>
                  Оригинал листа осмотра аукциона. Нажмите, чтобы открыть в полном размере.
                </p>
              </Block>
            )}

            {card.checks.length > 0 && (
              <Block title="Состояние узлов">
                <div className="grid gap-4 sm:grid-cols-2">
                  {card.checks.map((g, gi) => (
                    <div key={g.title + gi}>
                      {card.checks.length > 1 && (
                        <div className="mb-1 text-xs font-semibold" style={{ color: "var(--axis-gray)" }}>
                          {g.title}
                        </div>
                      )}
                      <ul className="text-sm">
                        {g.items.map((it, i) => (
                          <li
                            key={it.name + i}
                            className="flex justify-between gap-3 py-1.5"
                            style={{ borderTop: i ? "1px solid rgba(74,74,74,0.2)" : undefined }}
                          >
                            <span style={{ color: "var(--axis-cream, #F5F0EB)" }}>{it.name}</span>
                            <span className="text-right" style={{ color: it.ok === false ? "#E5484D" : "var(--axis-gray)" }}>
                              {it.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Block>
            )}

            {(h || card.legal) && (
              <div className="grid gap-4 lg:grid-cols-2">
                {h && (
                  <Block title="Страховая история">
                    <SpecRows
                      rows={[
                        { label: "Смен владельцев", value: n(h.owners) },
                        { label: "Смен номеров", value: n(h.plateChanges) },
                        {
                          label: "ДТП по своей страховке",
                          value: h.myClaims != null ? `${h.myClaims}${h.myClaimsKrw ? ` · ${krw(h.myClaimsKrw)}` : ""}` : null,
                        },
                        {
                          label: "ДТП по чужой страховке",
                          value:
                            h.otherClaims != null ? `${h.otherClaims}${h.otherClaimsKrw ? ` · ${krw(h.otherClaimsKrw)}` : ""}` : null,
                        },
                        { label: "Ущерб по страховке", value: h.damageRange },
                        { label: "Тотал", value: h.totalLoss ? `да (${h.totalLoss})` : h.totalLoss === 0 ? "нет" : null, accent: !!h.totalLoss },
                        { label: "Утопленник", value: h.flood ? `да (${h.flood})` : h.flood === 0 ? "нет" : null, accent: !!h.flood },
                        { label: "Угон", value: h.theft ? `да (${h.theft})` : h.theft === 0 ? "нет" : null, accent: !!h.theft },
                      ]}
                    />
                  </Block>
                )}
                {card.legal && (
                  <Block title="Юридическая чистота">
                    <SpecRows
                      rows={[
                        { label: "Аресты", value: card.legal.seizures ? `есть (${card.legal.seizures})` : "нет", accent: !!card.legal.seizures },
                        { label: "Залоги", value: card.legal.mortgages ? `есть (${card.legal.mortgages})` : "нет", accent: !!card.legal.mortgages },
                      ]}
                    />
                  </Block>
                )}
              </div>
            )}

            {card.options.length > 0 && (
              <Block title={`Опции — ${card.options.length}`}>
                <div className="flex flex-wrap gap-1.5">
                  {card.options.map((o) => (
                    <span
                      key={o}
                      className="rounded-full px-2.5 py-1 text-xs"
                      style={{ border: "1px solid rgba(74,74,74,0.5)", color: "var(--axis-cream, #F5F0EB)" }}
                    >
                      {o}
                    </span>
                  ))}
                </div>
              </Block>
            )}
          </div>

          {/* ─── Правая колонка: цена и заявка (липкая) ─── */}
          <div className="hidden h-fit min-w-0 lg:sticky lg:top-6 lg:block">
            <Side card={card} id={meta.id} />
          </div>
        </div>

        {/* ─── Только для нас ─── */}
        <details className="mt-6 rounded-2xl p-5" style={{ backgroundColor: "#111", border: "1px dashed rgba(138,138,138,0.45)" }}>
          <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 text-base font-semibold" style={{ color: "var(--axis-white)" }}>
            Только для нас
            <Vis us />
            <span className="w-full text-xs font-normal sm:w-auto" style={{ color: "var(--axis-gray)" }}>
              техпаспорт, ставки, замечания, все поля, сырой JSON · id {meta.id} · ответ {meta.ms} мс · загружено {ago(meta.fetchedAt)}
            </span>
          </summary>

          <div className="mt-4 space-y-4">
            {card.internal.scans.length > 0 && (
              <Block title="Сканы документов" us>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {card.internal.scans.map((s) => (
                    <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="block text-xs" style={{ color: "var(--axis-gray)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.url} alt={s.label} loading="lazy" className="mb-1 w-full rounded-lg bg-white" />
                      {s.label}
                    </a>
                  ))}
                </div>
              </Block>
            )}

            <Block title="Торги и служебное" us>
              <SpecRows
                rows={[
                  { label: "Ставок", value: card.internal.bids },
                  { label: "Прошлые торги", value: card.internal.previousBids },
                  { label: "Цена после торгов", value: krw(card.internal.afterBidKrw) },
                  ...Object.entries(card.internal.facts).map(([label, v]) => ({
                    label,
                    value: v == null || v === "" ? null : typeof v === "object" ? JSON.stringify(v) : String(v),
                  })),
                ]}
              />
            </Block>

            {card.internal.notes.length > 0 && (
              <Block title="Замечания площадки, инспектора, продавца" us>
                <ul className="list-disc space-y-1 pl-5 text-sm" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
                  {card.internal.notes.map((t, i) => (
                    <li key={i} className="whitespace-pre-line">
                      {t}
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            <Block title="Все поля" us>
              <FieldTable data={card.raw} skip={["photos", "photoThumbs"]} />
            </Block>

            <Block title="Сырой JSON" us>
              <pre className="max-h-[600px] overflow-auto text-[11px]" style={{ color: "var(--axis-gray)" }}>
                {JSON.stringify(card.raw, null, 2)}
              </pre>
            </Block>
          </div>
        </details>
      </div>
    </main>
  );
}
