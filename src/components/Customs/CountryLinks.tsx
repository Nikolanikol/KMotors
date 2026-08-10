import Link from "next/link";
import { COUNTRIES } from "@/lib/customs/core/registry";
import { customsText } from "@/lib/customs/serverDict";

/**
 * Перечень направлений на странице-хабе.
 *
 * Серверный компонент, и это существенно: ссылки должны присутствовать в HTML
 * первого ответа, иначе для краулера страниц стран просто не существует —
 * из хаба на них нет другого пути.
 *
 * Оформлен токенами axis-* остального сайта, а не calc-*: хаб пока живёт в
 * дизайне витрины, и вставлять в него чужую палитру было бы разнобоем.
 */
export default function CountryLinks({ lang }: { lang: string }) {
  const heading = customsText(lang, "hub.heading");
  // Пока язык не переведён, блок не рисуем: он состоял бы из сырых ключей.
  if (!heading) return null;

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <h2 className="text-xl font-bold text-[var(--axis-white)] sm:text-2xl">
        {heading}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--axis-gray)]">
        {customsText(lang, "hub.lead")}
      </p>

      <ul className="mt-6 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
        {COUNTRIES.map((country) => {
          const title = customsText(lang, `${country.id}.meta.title`);
          if (!title) return null;
          return (
            <li key={country.id}>
              <Link
                href={`/${lang}/calculator/${country.id}`}
                className="group flex h-full flex-col rounded-xl border border-[var(--axis-gray-dim)] bg-[var(--axis-charcoal)] p-4 transition-colors hover:border-[var(--axis-orange)]"
              >
                <span className="font-mono text-[10px] tracking-[0.14em] text-[var(--axis-gray)] uppercase">
                  {country.stampTop}
                </span>
                <span className="mt-1.5 font-semibold text-[var(--axis-white)] transition-colors group-hover:text-[var(--axis-orange)]">
                  {customsText(lang, `${country.id}.title`)}
                </span>
                <span className="mt-1.5 text-[13px] leading-snug text-[var(--axis-gray)]">
                  {customsText(lang, `${country.id}.meta.short`)}
                </span>
                <span className="mt-3 text-[13px] font-medium text-[var(--axis-orange)]">
                  {customsText(lang, "hub.open")} →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
