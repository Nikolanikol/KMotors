import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kmotors.shop";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    // sitemap.xml is the master index — it includes all sub-sitemaps
    sitemap: [`${BASE}/sitemap.xml`],
  };
}
