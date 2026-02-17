import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { BlogPost, BlogLang, BlogCategory } from "@/types/blog";

export const revalidate = 60; // cache for 60 seconds

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang = (searchParams.get("lang") || "ru") as BlogLang;
  const category = searchParams.get("category") as BlogCategory | null;
  const search = searchParams.get("search") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(24, parseInt(searchParams.get("limit") || "12"));
  const offset = (page - 1) * limit;

  try {
    const supabase = createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from("blog_posts")
      .select("*", { count: "exact" })
      .eq("published", true)
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq("category", category);
    }

    if (search.trim()) {
      const s = search.trim();
      query = query.or(
        `title_ru.ilike.%${s}%,title_en.ilike.%${s}%,excerpt_ru.ilike.%${s}%,excerpt_en.ilike.%${s}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase blog list error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const posts: BlogPost[] = (data || []).map((row: any) => ({
      id: row.id,
      slug: row.slug,
      category: row.category,
      source: row.source,
      published_at: row.published_at,
      cover_url: row.cover_url,
      tags: row.tags,
      title: row[`title_${lang}`] || row.title_ru || "",
      excerpt: row[`excerpt_${lang}`] || row.excerpt_ru || "",
    }));

    const total = count ?? 0;

    return NextResponse.json({
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Blog API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
