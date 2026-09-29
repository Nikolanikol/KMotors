"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Globe, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface Post {
  id: string;
  slug: string;
  title_ru: string;
  excerpt_ru: string;
  content_ru: string;
  cover_url: string | null;
  tags: string[];
  published: boolean;
  category: string;
}

interface Props {
  id: string;
}

export default function EditPostClient({ id }: Props) {
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "published" | "error">("idle");

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    fetch(`/api/admin/blog/${id}`)
      .then((r) => r.json())
      .then((data: Post) => {
        setPost(data);
        setTitle(data.title_ru || "");
        setExcerpt(data.excerpt_ru || "");
        setContent(data.content_ru || "");
        setCoverUrl(data.cover_url || "");
        setTagsInput((data.tags || []).join(", "));
      })
      .catch(() => setStatus("error"))
      .finally(() => setLoading(false));
  }, [id]);

  const parseTags = (input: string): string[] =>
    input.split(",").map((t) => t.trim()).filter(Boolean);

  const save = async (publish = false) => {
    publish ? setPublishing(true) : setSaving(true);
    setStatus("idle");

    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title_ru: title,
          excerpt_ru: excerpt,
          content_ru: content,
          cover_url: coverUrl || null,
          tags: parseTags(tagsInput),
          ...(publish ? { published: true } : {}),
        }),
      });

      if (!res.ok) throw new Error("Save failed");
      setStatus(publish ? "published" : "saved");

      if (publish) {
        setTimeout(() => router.push("/admin"), 1500);
      }
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#002C5F]" />
      </div>
    );
  }

  if (!post || status === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-gray-600">Статья не найдена или ошибка загрузки</p>
        <button onClick={() => router.push("/admin")} className="text-[#002C5F] hover:underline text-sm">
          ← В админку
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#002C5F] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin")} className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-sm font-bold">Редактирование статьи</div>
            <div className="text-xs text-blue-200 truncate max-w-xs">{post.slug}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === "saved" && (
            <span className="text-green-300 text-xs flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Сохранено
            </span>
          )}
          {status === "published" && (
            <span className="text-green-300 text-xs flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Опубликовано!
            </span>
          )}

          <button
            onClick={() => save(false)}
            disabled={saving || publishing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Сохранить
          </button>

          <button
            onClick={() => save(true)}
            disabled={saving || publishing || post.published}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#BB162B] hover:bg-[#9B1220] text-sm font-medium transition disabled:opacity-50"
          >
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {post.published ? "Опубликовано" : "Опубликовать"}
          </button>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Cover preview */}
        {coverUrl && (
          <div className="rounded-xl overflow-hidden h-48 bg-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Cover URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Обложка (URL)
          </label>
          <input
            type="url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://images.pexels.com/..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#002C5F] transition"
          />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Заголовок (RU)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#002C5F] focus:outline-none focus:border-[#002C5F] transition"
          />
        </div>

        {/* Excerpt */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Краткое описание (RU)
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 focus:outline-none focus:border-[#002C5F] transition resize-none"
          />
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Теги (через запятую)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Kia Sportage, Sportage NQ5, Kia, сравнение"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#002C5F] transition"
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {parseTags(tagsInput).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#002C5F]/5 text-[#002C5F]">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Содержимое (Markdown, RU)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={25}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono text-gray-700 leading-relaxed focus:outline-none focus:border-[#002C5F] transition resize-y"
          />
          <p className="text-xs text-gray-400">
            Поддерживает Markdown: ## заголовки, **жирный**, - списки
          </p>
        </div>

        {/* Bottom actions */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={() => save(false)}
            disabled={saving || publishing}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#002C5F] text-[#002C5F] font-medium hover:bg-[#002C5F]/5 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Сохранить черновик
          </button>

          <button
            onClick={() => save(true)}
            disabled={saving || publishing || post.published}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#BB162B] text-white font-medium hover:bg-[#9B1220] transition disabled:opacity-50"
          >
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {post.published ? "Уже опубликовано" : "Опубликовать"}
          </button>
        </div>
      </main>
    </div>
  );
}
