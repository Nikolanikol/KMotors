import type { Metadata } from "next";
import BlogTagClientPage from "./BlogTagClientPage";

interface Props {
  params: Promise<{ lang: string; tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const title = `${decodedTag} — статьи и обзоры | KMotors`;
  const description = `Все статьи по теме "${decodedTag}": сравнения, обзоры, гайды по корейским автомобилям.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://kmotors.shop/${lang}/blog/tag/${tag}`,
      images: [{ url: "https://kmotors.shop/preview/preview.png" }],
    },
    alternates: {
      canonical: `https://kmotors.shop/${lang}/blog/tag/${tag}`,
    },
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  return <BlogTagClientPage tag={decodedTag} />;
}
