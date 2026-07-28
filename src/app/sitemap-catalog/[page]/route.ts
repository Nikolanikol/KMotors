// app/sitemap-catalog/[page]/route.ts
import { NextResponse } from "next/server";

const BASE = "https://www.kmotors.shop";
const LANGS = ["ru", "en", "ka", "ar"];
// Прокси отдаёт максимум 20 записей за запрос, поэтому один sitemap-файл
// собирается из нескольких параллельных запросов по 20 машин
const CHUNK_SIZE = 20;
const CHUNKS_PER_PAGE = 10;
const PAGE_SIZE = CHUNK_SIZE * CHUNKS_PER_PAGE; // 200 URL на файл
// Потолок Encar — ~10 000, глубже пустая выдача. Свой лимит держим
// НАМЕРЕННО ниже: 2 000 машин = 10 файлов вместо 50. Причина — краул-бюджет.
// Выдача Encar сортируется по ModifiedDate, то есть пересобирается при каждом
// переподнятии объявления: страница N каждый час держит другие машины, все
// файлы каталога вечно «изменены» и переобходятся, вытесняя 48 тысяч URL
// запчастей. Машины при этом одноразовые (продалась → Encar 404 → noindex),
// запчасти вечные. Не поднимать обратно до 10_000, не заменив offset-пагинацию
// по живой выдаче на стабильный источник (см. sitemap.xml/route.ts).
const MAX_OFFSET = 2_000;
const PROXY = "https://encar-proxy-main.onrender.com/api/catalog";
const QUERY = "(And.Hidden.N._.CarType.Y.)";

interface CatalogCar {
  Id: string;
  Manufacturer?: string;
  Price?: string;
  Photo?: string;
}

async function fetchChunk(offset: number): Promise<CatalogCar[]> {
  try {
    const url = `${PROXY}?count=true&q=${QUERY}&sr=%7CModifiedDate%7C${offset}%7C${CHUNK_SIZE}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`proxy status ${res.status}`);
    const json = await res.json();
    return (json.SearchResults as CatalogCar[]) ?? [];
  } catch {
    // Упавший чанк не должен ронять весь sitemap-файл
    return [];
  }
}

async function fetchCars(baseOffset: number): Promise<CatalogCar[]> {
  const offsets = Array.from(
    { length: CHUNKS_PER_PAGE },
    (_, i) => baseOffset + i * CHUNK_SIZE
  ).filter((o) => o < MAX_OFFSET);

  const chunks = await Promise.all(offsets.map(fetchChunk));
  return chunks.flat();
}

function alternates(id: string) {
  return [
    ...LANGS.map(
      (lang) =>
        `    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE}/${lang}/catalog/${id}"/>`
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/ru/catalog/${id}"/>`,
  ].join("\n");
}

const EMPTY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ page: string }> }
) {
  const { page: pageParam } = await params;
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  try {
    const cars = await fetchCars(offset);

    if (!cars || cars.length === 0) {
      return new NextResponse(EMPTY_XML, {
        headers: { "Content-Type": "application/xml" },
      });
    }

    const urlBlocks: string[] = [];

    for (const car of cars) {
      if (!car.Price || !car.Manufacturer) continue;
      const id = String(car.Id);

      // Намеренно без <lastmod> и <changefreq>. ModifiedDate у Encar — дата
      // переподнятия объявления, а не изменения страницы; отдавать её значило
      // каждый час просить переобход всех URL каталога. Тег необязательный, без
      // него Google планирует обход сам. priority ниже запчастей (0.7):
      // машина живёт недели, карточка детали — годы.
      urlBlocks.push(`  <url>
    <loc>${BASE}/ru/catalog/${id}</loc>
    <priority>0.5</priority>
${alternates(id)}
  </url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlBlocks.join("\n")}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new NextResponse(EMPTY_XML, {
      headers: { "Content-Type": "application/xml" },
    });
  }
}
