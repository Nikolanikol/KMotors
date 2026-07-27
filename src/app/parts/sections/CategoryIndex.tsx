// CategoryIndex — видимый индекс категорий на /parts.
//
// Это крауловый путь, которого у каталога не было: на 48 689 товаров со
// страницы /parts вело 64 ссылки, пагинация каталога отдаёт noindex, и
// единственным способом добраться до карточек оставался сайтмап. Отсюда
// ссылки идут на ~99 категорийных страниц, а уже с них — на сами товары.
//
// Блок именно видимый: скрытая PartsTopLinks рядом решает ту же задачу
// спрятанными ссылками, но как сигнал они слабее и граничат с клоакингом.
import Link from "next/link";
import { getPartsCategories, indexCategories, localizedName } from "@/lib/partsCategories";

const HEADING: Record<string, string> = {
  ru: "Запчасти по категориям",
  en: "Parts by category",
  ka: "ნაწილები კატეგორიების მიხედვით",
  ar: "قطع الغيار حسب الفئة",
};

export async function CategoryIndex({ lang }: { lang: string }) {
  const rows = await getPartsCategories();
  const { roots } = indexCategories(rows);
  if (!roots.length) return null;

  return (
    <section className="py-16 bg-[var(--pn-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--pn-text)] mb-8">
          {HEADING[lang] ?? HEADING.ru}
        </h2>

        {/* Многоколоночный поток, а не grid: у корней очень разное число детей
            (от 6 до 46), и в grid высота ряда равнялась бы самому длинному
            столбцу — блок раздувался до 2100px с пустотами. */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-8">
          {roots.map((root) => (
            <div key={root.id} className="break-inside-avoid mb-8">
              <h3 className="text-base font-bold text-[var(--pn-text)] mb-3">
                <Link
                  href={`/${lang}/parts/category/${root.slug}`}
                  className="hover:text-[var(--pn-orange)] transition-colors"
                >
                  {localizedName(root, lang)}
                </Link>
              </h3>
              <ul className="space-y-1.5">
                {root.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/${lang}/parts/category/${child.slug}`}
                      className="text-sm text-[var(--pn-text-muted)] hover:text-[var(--pn-orange)] transition-colors"
                    >
                      {localizedName(child, lang)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
