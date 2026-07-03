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
        disallow: ["/admin", "/admin/", "/api/", "/cdn-cgi/"],
      },
    ],
    // sitemap.xml is the master index — it includes all sub-sitemaps
    sitemap: [`${BASE}/sitemap.xml`],
  };
}
