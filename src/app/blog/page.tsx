import type { Metadata } from "next";
import BlogClientPage from "./BlogClientPage";

export const metadata: Metadata = {
  title: "Блог KMotors — новости о корейских автомобилях",
  description:
    "Статьи, новости и обзоры корейских автомобилей Hyundai, Kia, Genesis. Актуальные новости автопрома из Южной Кореи.",
  openGraph: {
    title: "Блог KMotors — корейские автомобили",
    description: "Статьи и новости о корейских автомобилях Hyundai, Kia, Genesis.",
    url: "https://kmotors.shop/blog",
    images: [{ url: "https://kmotors.shop/preview/preview.png" }],
    type: "website",
  },
  alternates: {
    canonical: "https://kmotors.shop/blog",
  },
};

export default function BlogPage() {
  return <BlogClientPage />;
}
