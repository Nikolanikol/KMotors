import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { BlogPost, BlogLang } from "@/types/blog";

export const revalidate = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const lang = (searchParams.get("lang") || "ru") as BlogLang;

  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const post: BlogPost = {
      id: data.id,
      slug: data.slug,
      category: data.category,
      source: data.source,
      published_at: data.published_at,
      cover_url: data.cover_url,
      tags: data.tags,
      // Фолбэк: запрошенный язык → английский → русский (ka/ar без контента → en).
      title: data[`title_${lang}`] || data.title_en || data.title_ru || "",
      excerpt: data[`excerpt_${lang}`] || data.excerpt_en || data.excerpt_ru || "",
      content: data[`content_${lang}`] || data.content_en || data.content_ru || "",
    };

    return NextResponse.json(post);
  } catch (err) {
    console.error("Blog slug API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
