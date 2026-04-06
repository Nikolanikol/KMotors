import type { Metadata } from "next";
import BlogClientPage from "./BlogClientPage";

export const metadata: Metadata = {
  title: "Блог KMotors — авто из Кореи: советы, новости, обзоры",
  description:
    "Статьи и советы от KMotors (кмоторс): как купить авто из Кореи, растаможка, доставка в СНГ. Обзоры Hyundai, Kia, Genesis. Актуальные новости корейского автопрома.",
  keywords: [
    "блог авто из Кореи",
    "корейские авто советы",
    "купить авто из Кореи советы",
    "растаможка авто из Кореи",
    "кмоторс блог",
    "Hyundai Kia Genesis обзор",
  ],
  openGraph: {
    title: "Блог KMotors — авто из Кореи: советы, новости, обзоры",
    description:
      "Статьи и новости о корейских автомобилях. Советы по покупке и доставке авто из Кореи.",
    url: "https://kmotors.shop/blog",
    images: [{ url: "https://kmotors.shop/preview/preview.png" }],
    type: "website",
  },
  alternates: {
    canonical: "https://kmotors.shop/blog",
    languages: {
      ru: "https://kmotors.shop/blog",
      en: "https://kmotors.shop/blog",
      ko: "https://kmotors.shop/blog",
      ka: "https://kmotors.shop/blog",
      ar: "https://kmotors.shop/blog",
      "x-default": "https://kmotors.shop/blog",
    },
  },
};

export default function BlogPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: "https://kmotors.shop/" },
      { "@type": "ListItem", position: 2, name: "Блог", item: "https://kmotors.shop/blog" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BlogClientPage />
    </>
  );
}
