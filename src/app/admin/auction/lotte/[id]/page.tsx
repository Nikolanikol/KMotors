// Детальная страница лота Lotte.
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
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { ArrowLeftRight, Calendar, Car, Fuel, Gauge, Settings2 } from "lucide-react";

import OverviewStrip from "@/components/Auction/OverviewStrip";
import { SpecCard, SpecRows } from "@/components/Auction/SpecCard";
import { yearWithAge } from "@/components/Auction/carAge";
import Carousel from "@/components/Catalog/CarDetail/Carousel/Carousel";
import { getLot, type LotRow } from "@/lib/kcar/query";
import { getLotteDetail, getSimilarLotte } from "@/lib/lotte/query";

export const dynamic = "force-dynamic";

const krw = (v: number | null | undefined) => (v == null ? "—" : `${v.toLocaleString("ru-RU")} ₩`);
const km = (v: number | null | undefined) => (v == null ? "—" : `${v.toLocaleString("ru-RU")} км`);

/** Подпись отличия похожего лота от текущего: «дороже на $1 200». */
function delta(value: number | null, base: number | null, unit: "krw" | "km" | "year"): string | null {
  if (value == null || base == null || value === base) return null;
  const d = value - base;
  const up = d > 0;
  const abs = Math.abs(d);
  if (unit === "krw") return `${up ? "дороже" : "дешевле"} на ${abs.toLocaleString("ru-RU")} ₩`;
  if (unit === "km") return `${up ? "пробег больше" : "пробег меньше"} на ${Math.round(abs / 1000)} тыс. км`;
  return `${up ? "новее" : "старше"} на ${abs} г.`;
}

function SimilarTile({ lot, base }: { lot: LotRow; base: { price: number | null; mileage: number | null } }) {
  const title = [lot.maker, lot.model].filter(Boolean).join(" ") || lot.external_id;
  const notes = [
    delta(lot.start_price_krw, base.price, "krw"),
    delta(lot.mileage_km, base.mileage, "km"),
  ].filter(Boolean);

  return (
    <Link
      href={`/admin/auction/lotte/${lot.external_id}`}
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

export default async function LotteLotPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "1") redirect("/admin/login");

  const { id } = await params;
  const lot = await getLot(id);
  if (!lot || lot.source !== "lotte") notFound();

  const [detail, similar] = await Promise.all([
    getLotteDetail(id),
    getSimilarLotte({ externalId: id, maker: lot.maker, priceKrw: lot.start_price_krw }),
  ]);

  const title = detail?.name ?? [lot.maker, lot.model].filter(Boolean).join(" ") ?? lot.external_id;
  const gallery = detail?.photos?.length ? detail.photos : lot.thumb_url ? [lot.thumb_url] : [];

  return (
    <main className="min-h-screen px-4 py-6" style={{ backgroundColor: "var(--background, #0A0A0A)" }}>
      <div className="mx-auto max-w-6xl">
        <Link href="/admin/auction/lotte" className="text-xs" style={{ color: "var(--axis-bronze)" }}>
          ← к каталогу Lotte
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
              лот {lot.external_id}
              {detail?.adNumber ? ` · объявление ${detail.adNumber}` : ""}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--axis-gray)" }}>
              старт, ₩
            </div>
            <div className="text-2xl font-semibold" style={{ color: "var(--axis-cream, #F5F0EB)" }}>
              {krw(lot.start_price_krw ?? detail?.priceKrw)}
            </div>
            {detail?.auctionEnd && (
              <div className="mt-1 text-xs" style={{ color: "var(--axis-bronze)" }}>
                торги до {detail.auctionEnd}
              </div>
            )}
          </div>
        </header>

        {!detail && (
          <p
            className="mb-4 rounded-xl p-3 text-xs"
            style={{ backgroundColor: "var(--axis-charcoal)", color: "var(--axis-bronze)" }}
          >
            Витрина не ответила — показаны только те данные, что лежат у нас. Спецификация,
            галерея и диаграмма кузова берутся с неё в момент показа.
          </p>
        )}

        {gallery.length > 0 && (
          <div className="mb-3">
            <SpecCard title={`Фотографии — ${gallery.length}`}>
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
                photoLabel="фото"
                labels={{
                  open: "Открыть галерею",
                  prev: "Предыдущее фото",
                  next: "Следующее фото",
                  close: "Закрыть галерею",
                }}
              />
            </SpecCard>
          </div>
        )}

        <div className="mb-3">
          <OverviewStrip
            items={[
              { icon: <Car size={20} />, label: "Модель", value: lot.model },
              { icon: <Fuel size={20} />, label: "Топливо", value: detail?.fuel },
              { icon: <Calendar size={20} />, label: "Год", value: yearWithAge(detail?.year) },
              { icon: <Settings2 size={20} />, label: "Коробка", value: detail?.transmission },
              { icon: <Gauge size={20} />, label: "Пробег", value: km(lot.mileage_km) },
              { icon: <ArrowLeftRight size={20} />, label: "Привод", value: detail?.drivetrain },
            ]}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {/* Содержимое разложено поровну: модель, год, пробег, топливо,
              коробка и привод стоят выше в плашке, а из оставшегося восьми
              полей две карточки по четыре смотрятся ровно — при делении
              «по смыслу» левая пустовала на две строки. */}
          <SpecCard title="Спецификация">
            <SpecRows
              rows={[
                { label: "Марка", value: lot.maker },
                { label: "Комплектация", value: detail?.trim },
                {
                  label: "Объём двигателя",
                  value: detail?.engineCc ? `${detail.engineCc.toLocaleString("ru-RU")} см³` : null,
                },
                { label: "Тип кузова", value: detail?.bodyType },
              ]}
            />
          </SpecCard>

          <SpecCard title="Кузов и документы">
            <SpecRows
              rows={[
                { label: "Мест", value: detail?.seats },
                { label: "Цвет", value: detail?.color },
                { label: "VIN", value: detail?.vin, mono: true },
                { label: "Номер объявления", value: detail?.adNumber },
              ]}
            />
          </SpecCard>
        </div>

        {detail?.statusImageUrl && (
          <div className="mt-3">
            <SpecCard title="Состояние кузова">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={detail.statusImageUrl}
                alt="Диаграмма состояния кузова"
                loading="lazy"
                className="mx-auto w-full max-w-2xl rounded-lg bg-white p-2"
              />
              {/*
                ⚠️ Подпись красится --axis-gray, а НЕ --axis-gray-dim. Тот даёт
                на карточке контраст 2.08:1 при норме AA в 4.5 — текст был
                физически нечитаем. У --axis-gray 5.34:1.
              */}
              <p
                className="mx-auto mt-3 max-w-2xl text-center text-xs leading-relaxed"
                style={{ color: "var(--axis-gray)" }}
              >
                <span style={{ color: "var(--axis-white)" }}>X</span> — замена,{" "}
                <span style={{ color: "var(--axis-white)" }}>W</span> — покраска,{" "}
                <span style={{ color: "var(--axis-white)" }}>R</span> — работы у дилера.
                <br />
                Диаграмму площадка отдаёт картинкой, без панельных данных, — отфильтровать
                каталог по состоянию нельзя.
              </p>
            </SpecCard>
          </div>
        )}

        {similar.length > 0 && (
          <div className="mt-3">
            <SpecCard title={`Похожие лоты ${lot.maker ?? ""} — ${similar.length}`}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {similar.map((s) => (
                  <SimilarTile
                    key={s.external_id}
                    lot={s}
                    base={{ price: lot.start_price_krw, mileage: lot.mileage_km }}
                  />
                ))}
              </div>
            </SpecCard>
          </div>
        )}

        {lot.source_url && (
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
