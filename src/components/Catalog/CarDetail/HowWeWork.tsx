// Блок доверия на карточке авто: «Как мы работаем». Цель карточки — заявка, а
// человек перед ней спрашивает «что дальше, сколько вносить, можно ли верить».
//
// Ничего не выдумано, всё берётся из существующих источников:
//   • названия шагов и сумма задатка — ключи `buy.steps.*` словаря страницы
//     «Как купить» (/buy). Сумма живёт только внутри строки
//     `buy.steps.step2.description` («2 000 000 вон»), отдельной константы в коде
//     нет — поэтому строка выводится целиком, а не вырезается;
//   • отзывы — скриншоты переписок из `src/data/reviews.ts` (тот же источник, что
//     блок на главной). Текстовых отзывов в проекте нет, только картинки;
//   • ссылки — /buy, /about, /terms.
//
// Блок серверный: `buy` — маршрутный раздел словаря (ROUTE_SECTIONS), а тащить его
// в RSC-payload каждой карточки ради четырёх строк не нужно, поэтому тексты
// читаются getServerT прямо на сервере и сырых ключей быть не может.
//
// ⚠️ Обещание «средства застрахованы и вернутся» (`buy.steps.step2.highlight`) сюда
// НЕ вынесено сознательно: на карточке с ценой это юридическое утверждение, а не
// описание процесса. Решение о нём за владельцем.

import Image from "next/image";
import Link from "next/link";
import { getServerT } from "@/lib/serverT";
import { langOrDefault } from "@/lib/lang";
import { REVIEW_SHOTS, reviewLang } from "@/data/reviews";

// Шаги — из восьми этапов /buy: задаток → проверка → оплата остатка → доставка.
// Первый этап (выбор авто) посетитель уже проходит, последние (таможня, выдача)
// есть на странице «Как купить» по ссылке.
const STEP_NUMBERS = [2, 3, 4, 6] as const;

// Три первых скриншота подписаны «Отзыв ·» во всех языках.
const REVIEW_COUNT = 3;

const LINK_CLASS =
  "inline-flex items-center px-4 py-2 rounded-full text-xs font-medium transition-colors duration-200 cursor-pointer hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]";

export default function HowWeWork({ lang: rawLang }: { lang: string }) {
  const lang = langOrDefault(rawLang);
  const t = getServerT(lang);
  const rl = reviewLang(lang);
  const shots = REVIEW_SHOTS.slice(0, REVIEW_COUNT);

  return (
    <section
      data-track-block="trust"
      aria-labelledby="car-trust-title"
      className="max-w-7xl mx-auto px-4 sm:px-6 pb-8"
    >
      <div
        className="rounded-2xl p-5 md:p-6"
        style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}
      >
        <h2
          id="car-trust-title"
          dir="auto"
          className="text-lg font-bold"
          style={{ color: "var(--axis-white)" }}
        >
          {t("car.trust.title")}
        </h2>
        <p dir="auto" className="text-sm mt-1 mb-5" style={{ color: "var(--axis-gray)" }}>
          {t("car.trust.subtitle")}
        </p>

        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEP_NUMBERS.map((n, i) => (
            <li
              key={n}
              className="flex items-center gap-3 rounded-xl p-3"
              style={{ backgroundColor: "var(--axis-graphite)" }}
            >
              <span
                aria-hidden="true"
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                style={{ backgroundColor: "var(--axis-bronze-deep)", backgroundImage: "var(--axis-bronze-fill)" }}
              >
                {i + 1}
              </span>
              <span dir="auto" className="text-sm font-medium min-w-0" style={{ color: "var(--axis-white)" }}>
                {t(`buy.steps.step${n}.title`)}
              </span>
            </li>
          ))}
        </ol>

        <div
          dir="auto"
          className="mt-4 p-3 rounded-lg border-l-2 text-sm leading-relaxed"
          style={{
            backgroundColor: "rgba(182,119,73,0.08)",
            borderColor: "var(--axis-orange)",
            color: "var(--axis-white)",
          }}
        >
          <span className="font-bold" style={{ color: "var(--axis-orange)" }}>
            {t("car.trust.depositTitle")}:{" "}
          </span>
          {t("buy.steps.step2.description")}
        </div>

        <div className="mt-6">
          <h3 dir="auto" className="text-sm font-semibold" style={{ color: "var(--axis-white)" }}>
            {t("car.trust.reviewsTitle")}
          </h3>
          <p dir="auto" className="text-xs mt-1 mb-3" style={{ color: "var(--axis-gray)" }}>
            {t("car.trust.reviewsNote")}
          </p>
          <ul className="grid grid-cols-3 gap-3 sm:max-w-lg">
            {shots.map((shot) => (
              <li key={shot.src}>
                <a
                  href={shot.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${t("car.trust.openReview")}: ${shot.caption[rl]}`}
                  className="block rounded-xl overflow-hidden transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:border-[rgba(182,119,73,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(182,119,73,0.6)]"
                  style={{ border: "1px solid rgba(182,119,73,0.2)", backgroundColor: "var(--axis-graphite)" }}
                >
                  {/* Скрин обрезан по верху (начало переписки) до 3:4: целиком он
                      вытянут 736×1600 и занял бы пол-экрана; полный размер — по клику. */}
                  <Image
                    src={shot.src}
                    alt={shot.caption[rl]}
                    width={shot.w}
                    height={shot.h}
                    sizes="(min-width: 640px) 160px, 30vw"
                    loading="lazy"
                    className="block w-full h-auto aspect-[3/4] object-cover object-top"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2" aria-label={t("car.trust.title")}>
          <Link
            href={`/${lang}/buy`}
            prefetch={false}
            className={LINK_CLASS}
            style={{
              backgroundColor: "rgba(182,119,73,0.08)",
              color: "var(--axis-orange)",
              border: "1px solid rgba(182,119,73,0.2)",
            }}
          >
            {t("car.trust.allSteps")}
          </Link>
          <Link
            href={`/${lang}/about`}
            prefetch={false}
            className={LINK_CLASS}
            style={{ color: "var(--axis-silver)", border: "1px solid rgba(74,74,74,0.5)" }}
          >
            {t("nav.about")}
          </Link>
          <Link
            href={`/${lang}/terms`}
            prefetch={false}
            className={LINK_CLASS}
            style={{ color: "var(--axis-silver)", border: "1px solid rgba(74,74,74,0.5)" }}
          >
            {t("footer.terms")}
          </Link>
        </nav>
      </div>
    </section>
  );
}
