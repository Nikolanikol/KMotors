// app/sitemap-new-[page].xml/route.ts

import { getCars } from "@/components/Catalog/Row/utils/service";
import { NextResponse } from "next/server";

export async function GET({ params }: { params: { page: string } }) {
  const page = Number(params.page) || 1;
  const { data } = await getCars("", page); // получаем новые авто на странице

  const urls = data.map(car => ({
    loc: `https://kmotors.shop/catalog/${car.Id}`,
    lastmod: car.LastModified || new Date().toISOString(),
  }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map(u => `<url>
      <loc>${u.loc}</loc>
      <lastmod>${u.lastmod}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.9</priority>
    </url>`).join("")}
  </urlset>`;

  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
}
