"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { BlogPost } from "@/types/blog";
import { ArrowLeft, Calendar, Tag, ChevronDown, ChevronUp } from "lucide-react";
import CarRequestForm from "@/components/Catalog/CarDetail/CarRequestForm";
import Breadcrumb from "@/components/Breadcrumb";

interface Props {
  initialPost?: BlogPost | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  news: "blog.news",
  guide: "blog.guides",
  review: "blog.reviews",
  other: "blog.other",
};

function formatDate(iso: string, lang: string) {
  try {
    return new Date(iso).toLocaleDateString(
      lang === "ko" ? "ko-KR" : lang === "en" ? "en-US" : "ru-RU",
      { day: "numeric", month: "long", year: "numeric" }
    );
  } catch {
    return iso;
  }
}

export default function BlogPostPage({ initialPost }: Props) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "ru" | "en" | "ko";

  const [post, setPost] = useState<BlogPost | null>(initialPost ?? null);
  const [loading, setLoading] = useState(!initialPost);
  const [notFound, setNotFound] = useState(false);
  const [ctaOpen, setCtaOpen] = useState(false);

  useEffect(() => {
    if (initialPost) return;
    if (!slug) return;
    setLoading(true);
    fetch(`/api/blog/${slug}?lang=${lang}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setPost(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, lang, initialPost]);

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-6">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-xl style="color:var(--axis-white)" font-semibold">404</p>
        <p className="style="color:var(--axis-gray)"">{t("blog.notFound", "Статья не найдена")}</p>
        <Link
          href={`/${lang}/blog`}
          className="mt-2 inline-flex items-center gap-2 text-sm style="color:var(--axis-orange)"  font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("blog.backToBlog")}
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Breadcrumb */}
      <div className="glass-effect px-4 pt-4 pb-3">
        <div className="max-w-3xl mx-auto">
          <Breadcrumb items={[
            { label: "K-Axis", href: `/${lang}/` },
            { label: t("blog.backToBlog"), href: `/${lang}/blog` },
            { label: post.title },
          ]} />
        </div>
      </div>
      {/* Cover */}
      {post.cover_url ? (
        <div className="w-full h-64 md:h-80 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-16 glass-effect" />
      )}

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back link */}
        <Link
          href={`/${lang}/blog`}
          className="inline-flex items-center gap-1.5 text-sm style="color:var(--axis-orange)"  font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("blog.backToBlog")}
        </Link>

        {/* Article header */}
        <article className="rounded-2xl overflow-hidden" style="background-color:var(--axis-charcoal);border:1px solid rgba(74,74,74,0.3)">
          <div className="p-6 md:p-10 space-y-6">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm style="color:var(--axis-gray)"">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 style="color:var(--axis-orange)"" />
                {formatDate(post.published_at, lang)}
              </span>
              <span className="px-3 py-0.5 rounded-full bg-[#BB162B]/10 style="color:var(--axis-orange)" font-medium text-xs">
                {t(CATEGORY_LABELS[post.category] || "blog.other")}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold style="color:var(--axis-white)" leading-snug">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="style="color:var(--axis-gray)" text-base leading-relaxed border-l-4 border-[#BB162B] pl-4 italic">
                {post.excerpt}
              </p>
            )}

            {/* Divider */}
            <hr className="style="border-color:rgba(74,74,74,0.2)"" />

            {/* Markdown content */}
            {post.content ? (
              <div className="prose prose-slate max-w-none prose-headings:style="color:var(--axis-white)" prose-a:style="color:var(--axis-orange)" prose-a:no-underline hover:prose-a:underline prose-strong:style="color:var(--axis-white)" prose-blockquote:border-l-[#BB162B] prose-blockquote:style="color:var(--axis-gray)"">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {post.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="style="color:var(--axis-gray-dim)" text-sm italic">
                {t("blog.noContent", "Содержимое статьи недоступно")}
              </p>
            )}

            {/* CTA — призыв к действию после статьи */}
            <div className="mt-2 p-6 rounded-2xl" style="background:rgba(255,69,0,0.08);border:1px solid rgba(255,69,0,0.25)">
              <h3 className="text-lg font-bold style="color:var(--axis-white)" mb-1">
                Готовы выбрать автомобиль?
              </h3>
              <p className="text-sm style="color:var(--axis-gray)" mb-4">
                Более 10 000 автомобилей из Кореи в каталоге. Бесплатная консультация по подбору и таможне.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/${lang}/catalog`}
                  className="flex-1 text-center px-5 py-3 font-semibold rounded-xl text-white" style="background-color:var(--axis-orange) transition-colors"
                >
                  Смотреть каталог
                </Link>
                <button
                  onClick={() => setCtaOpen((v) => !v)}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 font-semibold rounded-xl" style="border:1px solid var(--axis-orange);color:var(--axis-orange) transition-colors"
                >
                  Получить консультацию
                  {ctaOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              {ctaOpen && (
                <div className="mt-4">
                  <CarRequestForm carId="" carName="Блог" source="blog" />
                </div>
              )}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="pt-4 border-t style="border-color:rgba(74,74,74,0.2)"">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="w-4 h-4 style="color:var(--axis-gray-dim)"" />
                  {post.tags.map((tag) => (
                    <a
                      key={tag}
                      href={`/${lang}/blog/tag/${encodeURIComponent(tag)}`}
                      className="text-xs px-2.5 py-1 rounded-full bg-[#002C5F]/5 style="color:var(--axis-white)" hover:bg-[#BB162B]/10 hover:style="color:var(--axis-orange)" transition-colors"
                    >
                      #{tag}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Back button bottom */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white" style="background-color:var(--axis-orange) transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("blog.backToBlog")}
          </button>
        </div>
      </div>
    </main>
  );
}
