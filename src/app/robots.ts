import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: [
      "https://kmotors.shop/sitemap.xml",
      "https://kmotors.shop/sitemap-main.xml",
      "https://kmotors.shop/sitemap-blog.xml",
      "https://kmotors.shop/sitemap-catalog/0",
    ],
  };
}
