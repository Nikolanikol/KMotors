import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kmotors.shop";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /carpicture НЕ блокируем: middleware отдаёт для них 410,
        // Google должен это увидеть, чтобы навсегда выкинуть URL из индекса
        // /*/auction/lot/ — страницы машин аукционов: noindex, живут дни, а
        // каждый обход ботом — это запрос к carnect (docs/carnect.md).
        disallow: ["/admin", "/admin/", "/api/", "/cdn-cgi/", "/*/auction/lot/"],
      },
    ],
    // sitemap.xml is the master index — it includes all sub-sitemaps
    sitemap: [`${BASE}/sitemap.xml`],
  };
}
