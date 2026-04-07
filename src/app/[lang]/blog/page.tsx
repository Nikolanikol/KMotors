import type { Metadata } from "next";
import BlogClientPage from "@/app/blog/BlogClientPage";

const BLOG_META: Record<string, { title: string; description: string }> = {
  ru: {
    title: "Блог KMotors — авто из Кореи: советы, новости, обзоры",
    description: "Статьи от KMotors: как купить авто из Кореи, растаможка, доставка. Обзоры Hyundai, Kia, Genesis.",
  },
  en: {
    title: "KMotors Blog — Korean Cars: Tips, News, Reviews",
    description: "Articles from KMotors: how to buy cars from Korea, customs, delivery. Reviews of Hyundai, Kia, Genesis.",
  },
  ko: {
    title: "KMotors 블로그 — 한국 자동차: 팁, 뉴스, 리뷰",
    description: "KMotors의 기사: 한국에서 자동차를 구매하는 방법, 세관, 배송. Hyundai, Kia, Genesis 리뷰.",
  },
  ka: {
    title: "KMotors ბლოგი — კორეული ავტომობილები: რჩევები, სიახლეები",
    description: "KMotors-ის სტატიები: კორეიდან ავტომობილის შეძენა, საბაჟო, მიტანა. Hyundai, Kia, Genesis-ის მიმოხილვები.",
  },
  ar: {
    title: "مدونة KMotors — سيارات كورية: نصائح وأخبار ومراجعات",
    description: "مقالات KMotors: كيفية شراء سيارات من كوريا، الجمارك، التوصيل. مراجعات Hyundai وKia وGenesis.",
  },
};

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const meta = BLOG_META[lang] || BLOG_META.ru;

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://kmotors.shop/${lang}/blog`,
      images: [{ url: "https://kmotors.shop/preview/preview.png" }],
      type: "website",
    },
    alternates: {
      canonical: `https://kmotors.shop/${lang}/blog`,
      languages: {
        ru: "https://kmotors.shop/ru/blog",
        en: "https://kmotors.shop/en/blog",
        ko: "https://kmotors.shop/ko/blog",
        ka: "https://kmotors.shop/ka/blog",
        ar: "https://kmotors.shop/ar/blog",
        "x-default": "https://kmotors.shop/ru/blog",
      },
    },
  };
}

export default async function BlogPage({ params }: Props) {
  const { lang } = await params;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "KMotors", item: `https://kmotors.shop/${lang}/` },
      { "@type": "ListItem", position: 2, name: BLOG_META[lang]?.title.split("—")[0]?.trim() || "Blog", item: `https://kmotors.shop/${lang}/blog` },
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
