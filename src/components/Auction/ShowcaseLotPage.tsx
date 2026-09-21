// Детальная страница лота витрины-агрегатора (Lotte, SK — любая, кроме K Car:
// у той лоты приходят из собственного API и карточка своя).
//
// Общий компонент, а не страница: площадок три, и третья копия разошлась бы с
// первыми двумя на первой же правке.
//
// По наполнению повторяет карточку витрины-источника: сводка, галерея,
// спецификация, VIN, диаграмма кузова, похожие лоты. Базовые поля берутся из
// auction_lots (их кладёт списочный обход), остальное догружается с витрины В
// МОМЕНТ ПОКАЗА и кешируется на час — массовый обход 1401 лота занял бы час
// ради карточек, которые почти никто не откроет.
//
// ⚠️ Диаграмма кузова — это КАРТИНКА, а не данные. Витрина рисует её заранее
// и кладёт на свой CDN, панельной структуры наружу не отдаёт (её поле reports
// у лотов Lotte пустое — проверено на 33 лотах). Поэтому состояние кузова
// здесь можно посмотреть, но нельзя ни отфильтровать, ни посчитать — в
// отличие от KCar, где панели приходят списком в defect_parts.
//
// ⚠️ Похожие лоты считаются ПО СВОЕЙ базе. У площадки этот блок сравнивает
// лот с машинами розничного раздела: на лоте за $9 857 висит Kia K7 за
// $74 478 и подпись «$64,621 pricier». Сравнивать лот с не-лотом бессмысленно.

import Link from "next/link";

import AuctionCountdown from "@/components/Auction/AuctionCountdown";
import { notFound } from "next/navigation";

import { ArrowLeftRight, Calendar, Car, Fuel, Gauge, Settings2 } from "lucide-react";

import OverviewStrip from "@/components/Auction/OverviewStrip";
import { SpecCard, SpecRows } from "@/components/Auction/SpecCard";
import { yearWithAge } from "@/components/Auction/carAge";
import Carousel from "@/components/Catalog/CarDetail/Carousel/Carousel";
import { getLot, type LotRow } from "@/lib/kcar/query";
import { getShowcaseDetail, getSimilarLots } from "@/lib/showcase/query";

const krw = (v: number | null | undefined) => (v == null ? "—" : `${v.toLocaleString("ru-RU")} ₩`);
const km = (v: number | null | undefined) => (v == null ? "—" : `${v.toLocaleString("ru-RU")} км`);

/** Подпись отличия похожего лота от текущего: «дороже на $1 200». */
function delta(
  value: number | null,
  base: number | null,
  unit: "krw" | "km",
  T: Record<string, string>,
  locale: string,
): string | null {
  if (value == null || base == null || value === base) return null;
  const up = value > base;
  const abs = Math.abs(value - base);
  if (unit === "krw") return `${up ? T.pricier : T.cheaper} ${abs.toLocaleString(locale)} ₩`;
  return `${up ? T.kmMore : T.kmLess} ${Math.round(abs / 1000)} ${T.thouKm}`;
}

function SimilarTile({
  lot,
  base,
  source,
  labels: T,
  hrefBase,
  locale,
}: {
  lot: LotRow;
  base: { price: number | null; mileage: number | null };
  source: string;
  labels: Record<string, string>;
  hrefBase: string;
  locale: string;
}) {
  const title = [lot.maker, lot.model].filter(Boolean).join(" ") || lot.external_id;
  const notes = [
    delta(lot.start_price_krw, base.price, "krw", T, locale),
    delta(lot.mileage_km, base.mileage, "km", T, locale),
  ].filter(Boolean);

  return (
    <Link
      href={`${hrefBase}/${source === "kcar" ? "" : `${source}/`}${lot.external_id}`}
      className="flex flex-col overflow-hidden rounded-lg transition-colors"
      style={{ backgroundColor: "var(--axis-graphite)", border: "1px solid rgba(74,74,74,0.25)" }}
    >
      {lot.thumb_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={lot.thumb_url} alt={title} loading="lazy" className="aspect-[16/10] w-full object-cover" />
      )}
      <div className="p-2">
        <div className="truncate text-xs font-semibold" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
          {title}
        </div>
        <div className="mt-0.5 text-xs" style={{ color: "var(--axis-bronze)" }}>
          {krw(lot.start_price_krw)}
        </div>
        {notes.map((n) => (
          <div key={n} className="text-[11px]" style={{ color: "var(--axis-gray)" }}>
            {n}
          </div>
        ))}
      </div>
    </Link>
  );
}

export default async function ShowcaseLotPage({
  id,
  source,
  labels: T,
  hrefBase = "/admin/auction",
  lang = "ru",
  contactHref,
}: {
  id: string;
  source: string;
  /** Подписи страницы. Служебная витрина отдаёт русские, публичная — словарь. */
  labels: Record<string, string>;
  hrefBase?: string;
  lang?: string;
  /** Кнопка действия. Нужна только публичной витрине. */
  contactHref?: string;
}) {
  const lot = await getLot(id);
  if (!lot || lot.source !== source) notFound();

  const [detail, similar] = await Promise.all([
    getShowcaseDetail(id),
    getSimilarLots({ source: lot.source, externalId: id, maker: lot.maker, priceKrw: lot.start_price_krw }),
  ]);

  const locale = lang === "ru" ? "ru-RU" : "en-US";
  const title = detail?.name ?? [lot.maker, lot.model].filter(Boolean).join(" ") ?? lot.external_id;
  const gallery = detail?.photos?.length ? detail.photos : lot.thumb_url ? [lot.thumb_url] : [];

  return (
    <main className="min-h-screen px-4 py-6" style={{ backgroundColor: "var(--background, #0A0A0A)" }}>
      <div className="mx-auto max-w-6xl">
        <Link href={`${hrefBase}/${source === "kcar" ? "" : source}`} className="text-xs" style={{ color: "var(--axis-bronze)" }}>
          ← {T.back}
        </Link>

        <header className="mb-5 mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
              {title}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--axis-gray)" }}>
              {detail?.summary ??
                [detail?.year, detail?.transmission, km(lot.mileage_km), detail?.fuel]
                  .filter(Boolean)
                  .join(" · ")}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--axis-gray)" }}>
              {T.lot} {lot.external_id}
              {detail?.adNumber ? ` · объявление ${detail.adNumber}` : ""}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--axis-gray)" }}>
              {T.startLabel}
            </div>
            <div className="text-2xl font-semibold" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
              {krw(lot.start_price_krw ?? detail?.priceKrw)}
            </div>
            {/*
              ⚠️ Дедлайн берётся из ДАТЫ ЛОТА, а не из общей на раздел: у
              площадок разные расписания торгов (замер 21.09.2026 — Lotte 21-го,
              SK и K Car 22-го). Время окончания добавляет auctionTime.
            */}
            {(lot.auction_date ?? detail?.auctionEnd) && (
              <AuctionCountdown
                date={lot.auction_date ?? detail?.auctionEnd}
                fallback={`${T.until} ${lot.auction_date ?? detail?.auctionEnd}`}
                labels={{ h: T.tH ?? "h", m: T.tM ?? "m", s: T.tS ?? "s", over: T.over ?? "" }}
                className="mt-1 block text-sm font-semibold"
                style={{ color: "var(--axis-bronze)" }}
              />
            )}
          </div>
        </header>

        {!detail && (
          <p
            className="mb-4 rounded-xl p-3 text-xs"
            style={{ backgroundColor: "var(--axis-charcoal)", color: "var(--axis-bronze)" }}
          >
            {T.noDetail}
          </p>
        )}

        {gallery.length > 0 && (
          <div className="mb-3">
            <SpecCard title={`${T.gallery} — ${gallery.length}`}>
              {/*
                Та же галерея, что на карточке авто: лента миниатюр, свайп,
                стрелки, лайтбокс с зумом. Лайтбокс грузится только по клику,
                поэтому 37 полноразмерных снимков не едут в первую отрисовку.

                ⚠️ imageSource="raw" обязателен: по умолчанию компонент
                дописывает к адресам параметры Encar с водяным знаком, а тут
                картинки с CDN аукциона Lotte.

                ⚠️ labels тоже обязательны: страница лежит вне [lang], инстанса
                i18next здесь нет, и без них в aria-label ушли бы сырые ключи.
              */}
              <Carousel
                photos={gallery}
                mode="static"
                imageSource="raw"
                carName={title}
                photoLabel={T.gallery}
                labels={{
                  open: T.openGallery,
                  prev: T.prevPhoto,
                  next: T.nextPhoto,
                  close: T.closeGallery,
                }}
              />
            </SpecCard>
          </div>
        )}

        <div className="mb-3">
          <OverviewStrip
            items={[
              { icon: <Car size={20} />, label: T.model, value: lot.model },
              { icon: <Fuel size={20} />, label: T.fuelL, value: detail?.fuel },
              { icon: <Calendar size={20} />, label: T.yearL, value: yearWithAge(detail?.year) },
              { icon: <Settings2 size={20} />, label: T.gear, value: detail?.transmission },
              { icon: <Gauge size={20} />, label: T.mileageL, value: km(lot.mileage_km) },
              { icon: <ArrowLeftRight size={20} />, label: T.drive, value: detail?.drivetrain },
            ]}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {/* Содержимое разложено поровну: модель, год, пробег, топливо,
              коробка и привод стоят выше в плашке, а из оставшегося восьми
              полей две карточки по четыре смотрятся ровно — при делении
              «по смыслу» левая пустовала на две строки. */}
          <SpecCard title={T.spec}>
            <SpecRows
              rows={[
                { label: T.make, value: lot.maker },
                { label: T.trimL, value: detail?.trim },
                {
                  label: T.engine,
                  value: detail?.engineCc ? `${detail.engineCc.toLocaleString("ru-RU")} см³` : null,
                },
                { label: T.bodyType, value: detail?.bodyType },
              ]}
            />
          </SpecCard>

          <SpecCard title={T.docs}>
            <SpecRows
              rows={[
                { label: T.seats, value: detail?.seats },
                { label: T.color, value: detail?.color },
                { label: T.vin, value: detail?.vin, mono: true },
                { label: T.adNo, value: detail?.adNumber },
              ]}
            />
          </SpecCard>
        </div>

        {detail?.statusImageUrl && (
          <div className="mt-3">
            <SpecCard title={T.body}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={detail.statusImageUrl}
                alt={T.body}
                loading="lazy"
                className="mx-auto w-full max-w-2xl rounded-lg bg-white p-2"
              />
              <p
                className="mx-auto mt-3 max-w-2xl text-center text-xs leading-relaxed"
                style={{ color: "var(--axis-gray)" }}
              >
                {T.bodyHint}
              </p>
            </SpecCard>
          </div>
        )}

        {similar.length > 0 && (
          <div className="mt-3">
            <SpecCard title={`${T.similar} ${lot.maker ?? ""} — ${similar.length}`}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {similar.map((s) => (
                  <SimilarTile
                    key={s.external_id}
                    lot={s}
                    base={{ price: lot.start_price_krw, mileage: lot.mileage_km }}
                    source={source}
                    labels={T}
                    hrefBase={hrefBase}
                    locale={locale}
                  />
                ))}
              </div>
            </SpecCard>
          </div>
        )}

        {/*
          ⚠️ Кнопка ведёт в WhatsApp с готовым текстом, а не в форму: лот живёт
          дни, и разговор о нём нужен сейчас, а не после ответа на письмо. Номер
          тот же, что на карточках авто.
        */}
        {contactHref && (
          <div className="mt-5">
            <a
              href={contactHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold"
              style={{
                backgroundImage: "var(--axis-bronze-fill)",
                backgroundColor: "var(--axis-bronze-deep)",
                color: "#fff",
              }}
            >
              {T.ask}
            </a>
          </div>
        )}

        {/*
          ⚠️ Ссылка на витрину-источник показывается ТОЛЬКО служебной странице.
          На публичной она отправляла бы клиента прямиком к посреднику, где он
          купит мимо нас: это не утечка данных, а утечка сделки. Признак —
          отсутствие contactHref: он есть только у публичной витрины.
        */}
        {!contactHref && lot.source_url && (
          <p className="mt-4 text-xs">
            <a href={lot.source_url} target="_blank" rel="noreferrer" style={{ color: "var(--axis-bronze)" }}>
              открыть лот на витрине-источнике →
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
