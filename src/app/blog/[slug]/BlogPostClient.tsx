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
      <main className="min-h-screen" style={{ backgroundColor: "var(--axis-black)" }}>
        <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-6">
          {[32, 64, 48, 32].map((h, i) => (
            <div key={i} className={`h-${h} rounded-2xl`} style={{ backgroundColor: "var(--axis-charcoal)" }} />
          ))}
        </div>
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4"
        style={{ backgroundColor: "var(--axis-black)" }}>
        <p className="text-xl font-semibold" style={{ color: "var(--axis-white)" }}>404</p>
        <p style={{ color: "var(--axis-gray)" }}>{t("blog.notFound", "Статья не найдена")}</p>
        <Link href={`/${lang}/blog`}
          className="mt-2 inline-flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--axis-orange)" }}>
          <ArrowLeft className="w-4 h-4" />
          {t("blog.backToBlog")}
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--axis-black)" }}>
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
          <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" width="1200" height="630" />
        </div>
      ) : (
        <div className="w-full h-16 glass-effect" />
      )}

      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href={`/${lang}/blog`}
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors"
          style={{ color: "var(--axis-orange)" }}>
          <ArrowLeft className="w-4 h-4" />
          {t("blog.backToBlog")}
        </Link>

        <article className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: "var(--axis-charcoal)", border: "1px solid rgba(74,74,74,0.3)" }}>
          <div className="p-6 md:p-10 space-y-6">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: "var(--axis-gray)" }}>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" style={{ color: "var(--axis-orange)" }} />
                {formatDate(post.published_at, lang)}
              </span>
              <span className="px-3 py-0.5 rounded-full font-medium text-xs"
                style={{ backgroundColor: "rgba(255,69,0,0.1)", color: "var(--axis-orange)" }}>
                {t(CATEGORY_LABELS[post.category] || "blog.other")}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold leading-snug" style={{ color: "var(--axis-white)" }}>
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-base leading-relaxed pl-4 italic"
                style={{ color: "var(--axis-gray)", borderLeft: "3px solid var(--axis-orange)" }}>
                {post.excerpt}
              </p>
            )}

            <hr style={{ borderColor: "rgba(74,74,74,0.3)" }} />

            {post.content ? (
              <div className="prose prose-invert max-w-none prose-a:text-orange-400 prose-headings:text-white prose-strong:text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm italic" style={{ color: "var(--axis-gray)" }}>
                {t("blog.noContent", "Содержимое статьи недоступно")}
              </p>
            )}

            {/* CTA */}
            <div className="mt-2 p-6 rounded-2xl"
              style={{ background: "rgba(255,69,0,0.08)", border: "1px solid rgba(255,69,0,0.25)" }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: "var(--axis-white)" }}>
                Готовы выбрать автомобиль?
              </h3>
              <p className="text-sm mb-4" style={{ color: "var(--axis-gray)" }}>
                Более 10 000 автомобилей из Кореи в каталоге. Бесплатная консультация по подбору и таможне.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/${lang}/catalog`}
                  className="flex-1 text-center px-5 py-3 font-semibold rounded-xl text-white transition-colors"
                  style={{ backgroundColor: "var(--axis-orange)" }}>
                  Смотреть каталог
                </Link>
                <button
                  onClick={() => setCtaOpen((v) => !v)}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 font-semibold rounded-xl transition-colors"
                  style={{ border: "1px solid var(--axis-orange)", color: "var(--axis-orange)" }}>
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
              <div className="pt-4 border-t" style={{ borderColor: "rgba(74,74,74,0.2)" }}>
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="w-4 h-4" style={{ color: "var(--axis-gray)" }} />
                  {post.tags.map((tag) => (
                    <a key={tag} href={`/${lang}/blog/tag/${encodeURIComponent(tag)}`}
                      className="text-xs px-2.5 py-1 rounded-full transition-colors"
                      style={{ backgroundColor: "rgba(255,69,0,0.08)", color: "var(--axis-gray)" }}>
                      #{tag}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        <div className="mt-8 text-center">
          <button onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-colors"
            style={{ backgroundColor: "var(--axis-orange)" }}>
            <ArrowLeft className="w-4 h-4" />
            {t("blog.backToBlog")}
          </button>
        </div>
      </div>
    </main>
  );
}
