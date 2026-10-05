// Страница машины carnect — общая для витрины (/[lang]/auction/lot/…) и админки.
//
// Устроена по образцу карточки Encar (`[lang]/catalog/[id]`): заголовок над
// галереей, под ней «главное» плашкой и характеристики, справа липкая колонка
// с ценой. Компоненты те же, что у страниц лотов аукциона: Carousel (галерея с
// лайтбоксом), SpecCard / SpecRows, OverviewStrip, AuctionCountdown.
//
// Всё, что на странице, видит клиент. Служебное — слотом `internal` внизу:
// что туда положить, решает маршрут. Админка рисует InternalPanel сразу, витрина
// — InternalPanelLoader, который подтягивает панель только на служебном хосте и
// держит её вне общего кеша страницы (см. InternalPanelLoader.tsx).
//
// Язык — пропом `lang` (text.ts): витрина на английском, админка на русском.
// Отметки «видит клиент» / «только мы» у блоков были макетом для владельца
// (02.10.2026) и сняты перед выкладкой (04.10.2026).

import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowLeftRight, Calendar, Car, Fuel, Gauge, Settings2 } from "lucide-react";

import FunnelTracker from "@/components/analytics/FunnelTracker";
import OverviewStrip from "@/components/Auction/OverviewStrip";
import { SpecCard, SpecRows } from "@/components/Auction/SpecCard";
import { yearWithAge } from "@/components/Auction/carAge";
import PriceLock from "@/components/Auth/PriceLock";
import Carousel from "@/components/Catalog/CarDetail/Carousel/Carousel";
import type { CarCard } from "@/lib/carnect/card";
import { gradeInfo } from "@/lib/carnect/grades";
import type { CardLang } from "@/lib/carnect/lang";
import { kstIso } from "@/lib/carnect/time";
import { waHref } from "@/lib/contact";

import AuctionHeart from "./AuctionHeart";
import BodyDiagram from "./BodyDiagram";
import LotRequestCard from "./LotRequestCard";
import LotShare from "./LotShare";
import LotStickyBar, { REQUEST_ANCHOR } from "./LotStickyBar";
import LotTimer from "./LotTimer";
import { fmt, koreanTime, tx, usd, won, yearAgeEn, type TextKey } from "./text";
import { pad } from "./ui";

/** `track` — имя блока для воронки (FunnelTracker: «блок попал в экран»). */
function Block({ title, children, track }: { title: string; children: ReactNode; track?: string }) {
  return (
    <div data-track-block={track}>
      <SpecCard title={title}>{children}</SpecCard>
    </div>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm" style={{ color: "var(--axis-gray)" }}>
      {children}
    </p>
  );
}

const PRICE_LABEL: Record<CarCard["price"]["kind"], TextKey> = {
  start: "priceStart",
  fixed: "priceFixed",
  none: "price",
};

/**
 * Оценка площадки с расшифровкой (grades.ts). У площадок без подтверждённой
 * шкалы (SK, K Car) — только буква: выдуманная легенда хуже никакой.
 */
function GradeBlock({ card, lang }: { card: CarCard; lang: CardLang }) {
  const info = gradeInfo(card.house, card.inspGrade, lang, card.sourceLabel);
  return (
    <div className="mt-4 text-sm" style={{ color: "var(--axis-gray)" }}>
      <p>
        {tx(lang, "grade")}:{" "}
        <span className="font-semibold" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
          {card.inspGrade}
        </span>
      </p>
      {info && (
        <>
          <ul className="mt-1.5 space-y-1">
            {info.parts.map((p) => (
              <li key={p.label}>
                <span className="font-semibold" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
                  {p.letter}
                </span>{" "}
                — {p.label.toLowerCase()}: {p.text}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[11px]">{info.note}</p>
        </>
      )}
    </div>
  );
}

/** Главная цена строкой — и для блока цены, и для мобильной плашки. */
function mainPrice(card: CarCard, lang: CardLang): string {
  return won(lang, card.price.krw) ?? tx(lang, card.house === "heydealer" ? "byBidding" : "atAuction");
}

function PriceCard({
  card,
  lang,
  krwToUsd,
  priceLocked,
}: {
  card: CarCard;
  lang: CardLang;
  krwToUsd?: number;
  priceLocked: boolean;
}) {
  const t = (k: TextKey) => tx(lang, k);
  const hey = card.house === "heydealer";
  return (
    <section
      className="rounded-2xl p-5"
      style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(182,119,73,0.4)" }}
    >
      <div className="mb-2 text-[11px] uppercase tracking-wide" style={{ color: "var(--axis-gray)" }}>
        {t(PRICE_LABEL[card.price.kind])}
      </div>
      {/* Гостю — замок: цены в данных нет вовсе (страница вычистила card.price.krw). */}
      {priceLocked ? (
        <PriceLock lang={lang} className="mt-1" />
      ) : (
        <div className="text-3xl font-bold" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
          {mainPrice(card, lang)}
        </div>
      )}
      {/* Справка в $ — курс Кукмин-банка, как у Encar (text.ts, usd). */}
      {usd(lang, card.price.krw, krwToUsd) && (
        <div className="mt-0.5 text-base font-semibold" style={{ color: "var(--axis-gray)" }}>
          {usd(lang, card.price.krw, krwToUsd)}
        </div>
      )}
      {card.price.kind === "start" && (
        <p className="mt-1 text-xs" style={{ color: "var(--axis-gray)" }}>
          {t("startNote")}
        </p>
      )}
      {card.price.kind === "none" && hey && (
        <p className="mt-1 text-xs" style={{ color: "var(--axis-gray)" }}>
          {t("noPriceHey")}
        </p>
      )}
      {card.newPriceKrw && (
        <p className="mt-2 text-sm" style={{ color: "var(--axis-gray)" }}>
          {t("newPrice")} {won(lang, card.newPriceKrw)}
        </p>
      )}

      {card.auctionDate && (
        <div className="mt-4 rounded-xl px-3 py-2" style={{ border: "1px solid var(--axis-bronze)" }}>
          <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--axis-gray)" }}>
            {t("auctionOn")} {card.auctionDate}
            {card.startAt ? ` ${t("at")} ${card.startAt.slice(11, 16)}` : ""}
          </div>
          <LotTimer
            at={card.startAt}
            date={card.auctionDate}
            kind="starts"
            lang={lang}
            fallback={card.auctionDate}
            className="block text-xl font-bold leading-tight"
            style={{ color: "var(--axis-bronze)" }}
          />
        </div>
      )}
      {card.endAt && (
        <div className="mt-4 rounded-xl px-3 py-2" style={{ border: "1px solid var(--axis-bronze)" }}>
          <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--axis-gray)" }}>
            {t("auctionUntil")}
          </div>
          <div className="text-sm font-semibold" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
            {koreanTime(lang, card.endAt)}
          </div>
          <LotTimer
            at={card.endAt}
            kind="ends"
            lang={lang}
            fallback=""
            className="block text-xl font-bold leading-tight"
            style={{ color: "var(--axis-bronze)" }}
          />
        </div>
      )}

      {card.inspGrade && <GradeBlock card={card} lang={lang} />}
    </section>
  );
}

/**
 * Правая колонка: цена и под ней плашка заявки. Одна и та же на узком экране
 * (под фото) и на широком (липкая справа) — разойтись им не с чего.
 */
/** «K Car · Sejong, лот 1234, торги 2026-10-06» — по нему менеджер найдёт машину. */
function lotRefOf(card: CarCard, id: string, lang: CardLang): string {
  const t = (k: TextKey) => tx(lang, k);
  const where = [card.sourceLabel, card.typeLabel, card.venue].filter(Boolean).join(" · ");
  const when = card.auctionDate
    ? `${t("auctionOn")} ${card.auctionDate}`
    : card.endAt
      ? `${t("auctionUntil")} ${koreanTime(lang, card.endAt)}`
      : null;
  return [where, `${t("lot")} ${card.lotNo ?? id}`, when].filter(Boolean).join(", ");
}

function Side({
  card,
  id,
  lang,
  pageUrl,
  krwToUsd,
  priceLocked,
}: {
  card: CarCard;
  id: string;
  lang: CardLang;
  pageUrl?: string;
  krwToUsd?: number;
  priceLocked: boolean;
}) {
  return (
    <div className="space-y-4">
      <div data-track-block="price">
        <PriceCard card={card} lang={lang} krwToUsd={krwToUsd} priceLocked={priceLocked} />
      </div>
      <LotRequestCard
        carId={`${card.house}/${id}`}
        carName={card.title}
        lotRef={lotRefOf(card, id, lang)}
        // ⚠️ Менеджер читает заявку в Telegram по-русски, на каком бы языке ни
        // была витрина: строка лота для него собирается отдельно.
        lotRefRu={lotRefOf(card, id, "ru")}
        fixedPrice={card.price.kind === "fixed"}
        lang={lang}
        pageUrl={pageUrl}
      />
    </div>
  );
}

export default function CarCardView({
  card,
  backHref,
  id,
  lang,
  pageUrl,
  internal,
  withHeader = false,
  krwToUsd,
  similar,
  priceLocked = false,
}: {
  card: CarCard;
  backHref: string;
  /** Id машины у источника (лот или HeyDealer). */
  id: string;
  lang: CardLang;
  /** НАШ абсолютный адрес страницы — уходит в текст WhatsApp (contact.ts). */
  pageUrl?: string;
  /** Служебная панель внизу: что положить, решает маршрут. */
  internal?: ReactNode;
  /** Витрина: над страницей шапка сайта, нужен отступ сверху. */
  withHeader?: boolean;
  /** Курс для справки в $ (getCarRates). Нет — справка не показывается. */
  krwToUsd?: number;
  /** Блок «Похожие машины» (SimilarCars) — внизу, перед звуком двигателя. */
  similar?: ReactNode;
  /**
   * Гость на витрине: вместо цены — замок «войдите, чтобы увидеть цену».
   * Саму цену маршрут уже вычистил из card (см. страницу лота), флаг только
   * рисует. Админка не передаёт — там false.
   */
  priceLocked?: boolean;
}) {
  const t = (k: TextKey) => tx(lang, k);
  const n = (v: number | null | undefined) => (v == null ? null : fmt(lang, v));
  const kmText = (v: number | null | undefined) => (v ? `${fmt(lang, v)} ${t("km")}` : null);
  const yesNo = (v: number | null | undefined, extra?: string) =>
    v ? `${t("yes")} (${v})${extra ?? ""}` : v === 0 ? t("no") : null;
  const h = card.history;
  const hey = card.house === "heydealer";
  const selfType = hey && !card.hasBodyData && !card.checks.length;

  return (
    <main className={`min-h-screen ${pad(withHeader)}`} style={{ backgroundColor: "var(--background, #0A0A0A)" }}>
      <div className="mx-auto max-w-7xl">
        <Link href={backHref} className="text-sm" style={{ color: "var(--axis-bronze)" }}>
          {t("backToCatalog")}
        </Link>

        <div className="mt-3 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          {/* ─── Главная колонка ─── */}
          <div className="min-w-0 space-y-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold leading-tight lg:text-3xl" style={{ color: "var(--axis-white)" }}>
                  {card.title}
                </h1>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <LotShare title={card.title} lang={lang} />
                  <AuctionHeart
                    size="md"
                    lang={lang}
                    lot={{
                      key: `${card.house}/${id}`,
                      house: card.house,
                      externalId: id,
                      title: card.title,
                      source: [card.sourceLabel, card.typeLabel, card.venue].filter(Boolean).join(" · "),
                      photo: card.photos[0] ?? null,
                      priceKrw: card.price.krw,
                      priceKind: card.price.kind,
                      auctionDate: card.auctionDate ?? null,
                      // У аукционов точное время — startAt (бывает без зоны, LotTimer/kstIso
                      // разбирают его как корейское), у HeyDealer — endAt.
                      endAt: kstIso(card.endAt ?? card.startAt),
                      make: card.make,
                      modelGroup: card.modelGroup,
                    }}
                  />
                </div>
              </div>
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
              </div>
            </div>

            <Block title={`${t("photos")} — ${card.photos.length}`} track="gallery">
              {card.photos.length ? (
                // ⚠️ imageSource="raw": фото на CDN площадки / HeyDealer, параметры
                // Encar с водяным знаком им дописывать нельзя. labels обязательны —
                // в админке нет i18next, без них в aria-label ушли бы сырые ключи.
                <Carousel
                  photos={card.photos}
                  mode="static"
                  imageSource="raw"
                  carName={card.title}
                  photoLabel={t("photoWord")}
                  labels={{ open: t("galleryOpen"), prev: t("galleryPrev"), next: t("galleryNext"), close: t("galleryClose") }}
                />
              ) : (
                <Muted>{t("noPhotos")}</Muted>
              )}
            </Block>

            {/* Цена на узком экране — сразу под фото, как у карточки Encar. */}
            {/* id — цель мобильной плашки: её кнопка прокручивает сюда. */}
            <div className="scroll-mt-24 lg:hidden" id={REQUEST_ANCHOR}>
              <Side card={card} id={id} lang={lang} pageUrl={pageUrl} krwToUsd={krwToUsd} priceLocked={priceLocked} />
            </div>

            <OverviewStrip
              items={[
                { icon: <Car size={20} />, label: t("model"), value: card.model },
                { icon: <Calendar size={20} />, label: t("year"), value: lang === "en" ? yearAgeEn(card.year) : yearWithAge(card.year) },
                { icon: <Gauge size={20} />, label: t("mileage"), value: kmText(card.km) },
                { icon: <Fuel size={20} />, label: t("fuel"), value: card.fuel },
                { icon: <Settings2 size={20} />, label: t("gearbox"), value: card.trans },
                { icon: <ArrowLeftRight size={20} />, label: t("engine"), value: card.cc ? `${n(card.cc)} ${t("cc")}` : null },
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <Block title={t("specs")} track="specs">
                <SpecRows
                  rows={[
                    { label: t("make"), value: card.make },
                    { label: t("trim"), value: card.grade },
                    { label: t("body"), value: card.body },
                    { label: t("color"), value: card.color },
                    { label: t("interior"), value: card.interior },
                    { label: t("seats"), value: card.seats },
                    { label: t("usage"), value: card.usage },
                    { label: t("manufactured"), value: card.manufactured },
                    { label: t("firstReg"), value: card.firstRegistration },
                    { label: t("engineCode"), value: card.engineCode, mono: true },
                  ]}
                />
              </Block>
              <Block title={t("docs")} track="docs">
                <SpecRows
                  rows={[
                    { label: "VIN", value: card.vin, mono: true },
                    { label: t("plate"), value: card.plate, mono: true },
                    { label: t("lotNo"), value: card.lotNo },
                    { label: t("inspectionAct"), value: card.inspectionAct },
                    { label: t("keys"), value: card.keys },
                    { label: t("venue"), value: card.venue ?? (hey ? null : card.sourceLabel) },
                    { label: t("source"), value: card.sourceLabel + (card.typeLabel ? ` · ${card.typeLabel}` : "") },
                  ]}
                />
                {hey && card.vin && (
                  <p className="mt-2 text-[11px]" style={{ color: "var(--axis-gray)" }}>
                    {t("vinCut")}
                  </p>
                )}
              </Block>
            </div>

            <Block title={t("bodyTitle")} track="body">
              {card.bodyMarks.length ? (
                <BodyDiagram marks={card.bodyMarks} lang={lang} />
              ) : card.hasBodyData ? (
                <Muted>{t("bodyClean")}</Muted>
              ) : selfType ? (
                <Muted>{t("bodySelf")}</Muted>
              ) : card.inspectionSheet ? (
                <Muted>{t("bodySheet")}</Muted>
              ) : (
                <Muted>{t("bodyNone")}</Muted>
              )}
            </Block>

            {card.inspectionSheet && (
              <Block title={t("sheet")} track="inspection_sheet">
                {/* Скан площадки: на белом фоне, как напечатан, — иначе тёмная
                    тема съедает тонкие линии схемы. Клик открывает оригинал. */}
                <a href={card.inspectionSheet} target="_blank" rel="noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.inspectionSheet}
                    alt={t("sheet")}
                    loading="lazy"
                    className="mx-auto w-full max-w-3xl rounded-lg bg-white p-2"
                  />
                </a>
                <p className="mt-2 text-center text-xs" style={{ color: "var(--axis-gray)" }}>
                  {t("sheetNote")}
                </p>
              </Block>
            )}

            {card.defects.length > 0 && (
              <Block title={t("defects")} track="defects">
                {/* Что нашла площадка при осмотре — дословно, только переведено.
                    Юридический текст площадки отсечён в defects.ts. */}
                <ul className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                  {card.defects.map((d) => (
                    <li key={d} className="flex gap-2" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
                      <span aria-hidden style={{ color: "#E5484D" }}>
                        •
                      </span>
                      {d}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs" style={{ color: "var(--axis-gray)" }}>
                  {t("defectsNote")}
                </p>
              </Block>
            )}

            {card.sellerSays.length > 0 && (
              <Block title={t("sellerSays")} track="seller_says">
                <ul className="space-y-1.5 text-sm" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
                  {card.sellerSays.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs" style={{ color: "var(--axis-gray)" }}>
                  {t("sellerNote")}
                </p>
              </Block>
            )}

            {card.checks.length > 0 && (
              <Block title={t("checks")} track="checks">
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
                  <Block title={t("history")} track="history">
                    <SpecRows
                      rows={[
                        { label: t("owners"), value: n(h.owners) },
                        { label: t("plateChanges"), value: n(h.plateChanges) },
                        {
                          label: t("myClaims"),
                          value: h.myClaims != null ? `${h.myClaims}${h.myClaimsKrw ? ` · ${won(lang, h.myClaimsKrw)}` : ""}` : null,
                        },
                        {
                          label: t("otherClaims"),
                          value:
                            h.otherClaims != null
                              ? `${h.otherClaims}${h.otherClaimsKrw ? ` · ${won(lang, h.otherClaimsKrw)}` : ""}`
                              : null,
                        },
                        { label: t("damage"), value: h.damageRange },
                        { label: t("totalLoss"), value: yesNo(h.totalLoss), accent: !!h.totalLoss },
                        { label: t("flood"), value: yesNo(h.flood), accent: !!h.flood },
                        { label: t("theft"), value: yesNo(h.theft), accent: !!h.theft },
                        {
                          label: t("uninsured"),
                          value: h.uninsured ? `${h.uninsured} — ${t("uninsuredNote")}` : h.uninsured === 0 ? t("no") : null,
                          accent: !!h.uninsured,
                        },
                      ]}
                    />
                  </Block>
                )}
                {card.legal && (
                  <Block title={t("legal")} track="legal">
                    <SpecRows
                      rows={[
                        {
                          label: t("seizures"),
                          value: card.legal.seizures ? `${t("present")} (${card.legal.seizures})` : t("no"),
                          accent: !!card.legal.seizures,
                        },
                        {
                          label: t("mortgages"),
                          value: card.legal.mortgages ? `${t("present")} (${card.legal.mortgages})` : t("no"),
                          accent: !!card.legal.mortgages,
                        },
                      ]}
                    />
                  </Block>
                )}
              </div>
            )}

            {card.options.length > 0 && (
              <Block title={`${t("options")} — ${card.options.length}`} track="options">
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
            {similar && <div data-track-block="similar">{similar}</div>}
            {card.engineSound && (
              <Block title={t("engineSound")} track="engine_sound">
                {/* Внизу страницы и preload="none": ролик весит мегабайты, а
                    смотрят его немногие (решение владельца 04.10.2026). До
                    нажатия «play» браузер не скачивает ничего — ни файла, ни
                    первого кадра. Высота задана заранее, иначе плеер без
                    метаданных схлопнулся бы в полоску. Ролик с телефона, обычно
                    вертикальный; горизонтальный встанет с полями. */}
                <video
                  src={card.engineSound}
                  controls
                  playsInline
                  preload="none"
                  className="mx-auto block aspect-[9/16] h-[70vh] max-h-[640px] w-auto max-w-full rounded-xl bg-black object-contain"
                />
                <p className="mt-2 text-xs" style={{ color: "var(--axis-gray)" }}>
                  {t("engineSoundNote")}
                </p>
              </Block>
            )}
          </div>

          {/* ─── Правая колонка: цена и заявка (липкая) ─── */}
          <div className="hidden h-fit min-w-0 lg:sticky lg:top-6 lg:block">
            <Side card={card} id={id} lang={lang} pageUrl={pageUrl} krwToUsd={krwToUsd} priceLocked={priceLocked} />
          </div>
        </div>

        {/* ─── Только для нас: слот, наполняет маршрут (только служебный хост) ─── */}
        {internal}

        {/* Шаги воронки: просмотр машины, какие блоки увидел, что нажимал. */}
        <FunnelTracker
          view={{
            event: "view_item",
            params: { item_category: "auction", house: card.house, value: card.price.krw ?? undefined, price_kind: card.price.kind },
          }}
          itemId={`${card.house}/${id}`}
          itemName={card.title}
        />

        {/* Место под мобильную плашку: иначе она закрывает низ страницы. */}
        <div className="h-20 lg:hidden" aria-hidden />
        <LotStickyBar
          price={priceLocked ? t("priceLockedShort") : mainPrice(card, lang)}
          priceUsd={usd(lang, card.price.krw, krwToUsd)}
          label={t("wantCar")}
          waHref={waHref(`${t("wantCar")}: ${card.title} (${lotRefOf(card, id, lang)})${pageUrl ? ` — ${pageUrl}` : ""}`)}
        />
      </div>
    </main>
  );
}
