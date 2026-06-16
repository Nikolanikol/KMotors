import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  const password = process.env.ADMIN_PASSWORD;
  return !!(session && password && session.value === password);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title_ru, excerpt_ru, content_ru, cover_url, tags, published, published_at, category")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowed = ["title_ru", "excerpt_ru", "content_ru", "cover_url", "tags", "published"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (body.published === true) {
    update.published_at = new Date().toISOString();
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("blog_posts").update(update).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.published === true) {
    const { data: post } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("id", id)
      .single();

    if (post?.slug) {
      const INDEXNOW_KEY = "f0a070ba837a4a414a58457c67b26450";
      fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: "www.kmotors.shop",
          key: INDEXNOW_KEY,
          keyLocation: `https://www.kmotors.shop/${INDEXNOW_KEY}.txt`,
          urlList: [`https://www.kmotors.shop/ru/blog/${post.slug}`],
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
