"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { convertedCarPrice, formatCarKrw } from "@/lib/carPricing";
import type { RecommendedCar } from "./getRecommended";

// Размерный URL encar напрямую. Запрашиваем 2x для ретины: карточка 240px → 480px, 16:10.
const WTM = "https://ci.encar.com/wt_mark/w_mark_04.png";
function encarUrl(path: string, w = 480): string {
  const h = Math.round(w * 0.625);
  return `https://ci.encar.com${path}?impolicy=heightRate&rh=${h}&cw=${w}&ch=${h}&cg=Center&wtmk=${WTM}`;
}

const TITLE: Record<string, string> = {
  ru: "Рекомендуемые авто",
  en: "Recommended cars",
  ka: "რეკომენდებული ავტომობილები",
  ar: "سيارات موصى بها",
};
const KM: Record<string, string> = { ru: "км", en: "km", ka: "კმ", ar: "كم" };
const WON: Record<string, string> = { ru: "вон", en: "won", ka: "ვონი", ar: "وون" };

// Ленивый блок: данные грузятся не при загрузке страницы, а когда пользователь
// долистывает до него (IntersectionObserver + fetch на /api/recommended).
// Поэтому страница авто рендерится мгновенно, а рекомендации не тормозят её.
export default function RecommendedCars({
  id,
  lang,
  krwToRub,
  krwToUsd,
}: {
  id: string;
  lang: string;
  /** Курс авто (KB) приходит с сервера пропсом, как у CarCard; клиент его не запрашивает. */
  krwToRub?: number;
  krwToUsd?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const started = useRef(false);
  const [cars, setCars] = useState<RecommendedCar[] | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        io.disconnect();
        fetch(`/api/recommended?id=${encodeURIComponent(id)}`)
          .then((r) => r.json())
          .then((d) => setCars(Array.isArray(d.cars) ? d.cars : []))
          .catch(() => setCars([]));
      },
      // Начинаем грузить за 500px до появления — к моменту долистывания уже готово.
      { rootMargin: "500px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [id]);

  // Загрузилось и пусто → блока нет.
  if (cars !== null && cars.length === 0) return null;

  const km = KM[lang] ?? KM.ru;
  const won = WON[lang] ?? WON.ru;
  const loading = cars === null;

  return (
    <section ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 mt-10">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-1 h-6 rounded-full"
          style={{
            background:
              "linear-gradient(to bottom, var(--axis-orange), var(--axis-amber))",
          }}
        />
        <h2 className="text-xl font-bold" style={{ color: "var(--axis-white)" }}>
          {TITLE[lang] ?? TITLE.ru}
        </h2>
      </div>

      <div
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[240px] rounded-2xl overflow-hidden animate-pulse"
                style={{ backgroundColor: "var(--axis-charcoal)" }}
              >
                <div
                  className="aspect-[16/10]"
                  style={{ backgroundColor: "var(--axis-graphite)" }}
                />
                <div className="p-4 space-y-2">
                  <div
                    className="h-4 rounded w-3/4"
                    style={{ backgroundColor: "var(--axis-graphite)" }}
                  />
                  <div
                    className="h-3 rounded w-1/2"
                    style={{ backgroundColor: "var(--axis-graphite)" }}
                  />
                  <div
                    className="h-5 rounded w-1/2 mt-2"
                    style={{ backgroundColor: "var(--axis-graphite)" }}
                  />
                </div>
              </div>
            ))
          : cars!.map((car) => {
              // Цена — как в каталоге (CarCard): воны с сбором + «≈ ₽/$» по курсу KB.
              // `price` нет у ответа, закешированного до выкладки, — тогда без цены.
              const hasPrice = Number.isFinite(car.price) && car.price > 0;
              const converted = hasPrice
                ? convertedCarPrice(car.price, lang, { krwToRub, krwToUsd })
                : null;
              return (
              <Link
                key={car.id}
                href={`/${lang}/catalog/${car.id}`}
                className="snap-start flex-shrink-0 w-[240px] rounded-2xl overflow-hidden group transition-shadow hover:shadow-[0_12px_32px_rgba(182,119,73,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
                style={{
                  backgroundColor: "var(--axis-charcoal)",
                  border: "1px solid rgba(74,74,74,0.25)",
                }}
              >
                <div
                  className="relative aspect-[16/10] overflow-hidden"
                  style={{ backgroundColor: "var(--axis-graphite)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={encarUrl(car.photo)}
                    alt={`${car.manufacturer} ${car.model} ${car.year}`}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <div>
                    <p
                      className="text-sm font-semibold line-clamp-1"
                      style={{ color: "var(--axis-white)" }}
                    >
                      {car.manufacturer} {car.model}
                    </p>
                    <p
                      className="text-xs line-clamp-1 mt-0.5"
                      style={{ color: "var(--axis-gray)" }}
                    >
                      {car.grade}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-2 text-xs"
                    style={{ color: "var(--axis-gray)" }}
                  >
                    <span>{car.year}</span>
                    <span>·</span>
                    <span>
                      {car.mileage.toLocaleString("ru-RU")} {km}
                    </span>
                  </div>
                  {hasPrice && (
                    <div className="pt-1">
                      <p
                        className="text-base font-bold"
                        style={{ color: "var(--axis-orange)" }}
                      >
                        {formatCarKrw(car.price)}{" "}
                        <span
                          className="text-xs font-normal"
                          style={{ color: "var(--axis-gray)" }}
                        >
                          {won}
                        </span>
                      </p>
                      {converted && (
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--axis-silver)" }}
                        >
                          ≈ {converted.value} {converted.symbol}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Link>
              );
            })}
      </div>
    </section>
  );
}
