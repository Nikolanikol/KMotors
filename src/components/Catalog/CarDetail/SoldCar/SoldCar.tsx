"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ArrowRight, Tag } from "lucide-react";
import CarCard from "@/components/Catalog/Row/CarCard";
import { encarLoader } from "@/utils/encarLoader";
import { convertNumber, convertNumberKm } from "@/utils/splitNumber";
import { translateGenerationRow } from "@/utils/translateGenerationRow";
import type { CarSnapshot } from "@/lib/carsSeen";
import SoldCarCta from "./SoldCarCta";

interface Props {
  lang: string;
  carId: string;
  /** null — машина продалась раньше, чем мы начали писать снимки. */
  snapshot: CarSnapshot | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  similar: any[];
  rates: { krwToRub: number; krwToUsd: number } | null;
  carName: string;
}

/**
 * Страница проданной машины.
 *
 * Раньше здесь стоял notFound(): Encar отдаёт 404, и показывать было нечего.
 * Но URL остаётся в индексе, и человек, искавший конкретную модель, приходил в
 * пустую 404 — самый квалифицированный посетитель из возможных, потерянный
 * на ровном месте. Теперь его встречает снимок из cars_seen и три пути в личку.
 *
 * ⚠️ Страница остаётся под noindex (выставляется в generateMetadata). Она живёт
 * ради людей, уже пришедших из индекса, а не ради ранжирования: вернём
 * индексацию — вернутся сотни «дубликатов без канонического» в GSC.
 *
 * Клиентский компонент целиком — весь текст идёт через useTranslation, а данные
 * (снимок, похожие, курсы) приходят пропсами уже загруженными на сервере.
 */
export default function SoldCar({ lang, carId, snapshot, similar, rates, carName }: Props) {
  const { t } = useTranslation(["common", "cars"]);

  const priceKrw = snapshot?.price_manwon ? snapshot.price_manwon * 10000 : null;
  const photo = snapshot?.photo_path ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-3xl overflow-hidden"
          style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(255,69,0,0.25)" }}
        >
          {photo && (
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/10]">
              <Image
                loader={encarLoader}
                src={photo}
                alt={carName}
                fill
                sizes="(max-width: 640px) 100vw, 672px"
                className="object-cover"
                // Фото проданной машины — приглушено: это уже не предложение,
                // а подтверждение «вы пришли по адресу».
                style={{ filter: "grayscale(0.55) brightness(0.75)" }}
              />
              <div
                className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide"
                style={{ backgroundColor: "rgba(0,0,0,0.72)", color: "var(--axis-orange)" }}
              >
                <Tag className="w-3.5 h-3.5" />
                {t("catalog.sold.badge")}
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8">
            <h1
              className="text-2xl sm:text-3xl font-bold leading-tight"
              style={{ color: "var(--axis-white)" }}
            >
              {carName || t("catalog.sold.titleUnknown")}
            </h1>
            <p className="mt-3 text-sm sm:text-base" style={{ color: "var(--axis-gray)" }}>
              {t("catalog.sold.lead")}
            </p>

            {snapshot && (
              <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {snapshot.mileage != null && (
                  <Row label={t("car.mileage")} value={convertNumberKm(String(snapshot.mileage))} />
                )}
                {snapshot.fuel_ko && (
                  <Row label={t("car.fuel")} value={translateGenerationRow(snapshot.fuel_ko, t)} />
                )}
                {snapshot.transmission_ko && (
                  <Row
                    label={t("car.transmission")}
                    value={translateGenerationRow(snapshot.transmission_ko, t)}
                  />
                )}
                {priceKrw && (
                  <Row
                    label={t("catalog.sold.wasPrice")}
                    value={
                      <span style={{ textDecoration: "line-through", opacity: 0.75 }}>
                        {convertNumber(String(priceKrw))} ₩
                        {rates && (
                          <span className="ml-2 text-xs" style={{ textDecoration: "none" }}>
                            ≈{" "}
                            {lang === "ru"
                              ? `${Math.round(priceKrw * rates.krwToRub).toLocaleString("ru-RU")} ₽`
                              : `$${Math.round(priceKrw * rates.krwToUsd).toLocaleString("en-US")}`}
                          </span>
                        )}
                      </span>
                    }
                  />
                )}
              </div>
            )}

            <SoldCarCta carId={carId} carName={carName} />
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-14">
          <h2
            className="text-xl sm:text-2xl font-bold mb-6"
            style={{ color: "var(--axis-white)" }}
          >
            {t("catalog.sold.similar")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {similar.map((item, index) => (
              <CarCard
                key={item.Id}
                id={item.Id}
                photo={item.Photos?.[0]?.location}
                model={item.Model}
                manufacture={item.Manufacturer}
                year={item.Year}
                mileage={item.Mileage}
                transmission={item.Transmission}
                fuel={item.FuelType}
                price={item.Price}
                krwToRub={rates?.krwToRub}
                krwToUsd={rates?.krwToUsd}
                priority={index < 2}
              />
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 text-center">
        <Link
          href={`/${lang}/catalog`}
          className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ color: "var(--axis-orange)" }}
        >
          {t("catalog.sold.toCatalog")}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide" style={{ color: "var(--axis-gray)" }}>
        {label}
      </div>
      <div className="mt-0.5 font-semibold" style={{ color: "var(--axis-white)" }}>
        {value}
      </div>
    </div>
  );
}
