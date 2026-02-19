import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { fetchRssFeed, parseRssItems, slugFromUrl, escapeHtml } from "@/lib/rss";

const RSS_FEEDS = [
  {
    url: "https://www.vedomosti.ru/rss/rubric/auto/auto_industry.xml",
    tags: ["ведомости", "автопром"],
    source: "vedomosti.ru",
  },
  {
    url: "https://www.vedomosti.ru/rss/rubric/auto/cars.xml",
    tags: ["ведомости", "авто"],
    source: "vedomosti.ru",
  },
];

// Max new articles per sync run (across all feeds combined)
const MAX_NEW_PER_RUN = 5;

// Only accept articles published within the last N days
const MAX_AGE_DAYS = 7;

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function GET(req: NextRequest) {
  // Validate cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const token = authHeader?.replace("Bearer ", "");
    if (token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const supabase = createServerClient();

    // Get ALL existing slugs once (dedup across all sources by slug uniqueness)
    const { data: existingRows } = await supabase
      .from("blog_posts")
      .select("slug");

    const existingSlugs = new Set(
      (existingRows || []).map((r: { slug: string }) => r.slug)
    );

    let totalAdded = 0;
    const allErrors: string[] = [];

    for (const feed of RSS_FEEDS) {
      if (totalAdded >= MAX_NEW_PER_RUN) break;

      try {
        // Vedomosti is UTF-8 (default)
        const xml = await fetchRssFeed(feed.url);
        const items = parseRssItems(xml);

        if (!items.length) continue;

        // Sort newest first
        const sorted = [...items].sort((a, b) => {
          const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
          const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
          return db - da;
        });

        const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

        for (const item of sorted) {
          if (totalAdded >= MAX_NEW_PER_RUN) break;

          // Skip old articles
          const pubTime = item.pubDate ? new Date(item.pubDate).getTime() : 0;
          if (!pubTime || pubTime < cutoff) continue;

          const slug = slugFromUrl(item.guid || item.link);
          if (!slug || existingSlugs.has(slug)) continue;

          const publishedAt = new Date(item.pubDate).toISOString();

          // Insert as draft
          const { data: inserted, error: insertError } = await supabase
            .from("blog_posts")
            .insert({
              slug,
              category: "news",
              source: feed.source,
              published: false,
              published_at: publishedAt,
              title_ru: item.title || "Без заголовка",
              excerpt_ru: item.description?.slice(0, 500) || "",
              content_ru: item.description || "",
              cover_url: item.imageUrl || null,
              tags: feed.tags,
            })
            .select("id")
            .single();

          if (insertError) {
            allErrors.push(`${slug}: ${insertError.message}`);
            continue;
          }

          const postId = inserted?.id;
          existingSlugs.add(slug); // prevent duplicate in same run

          // Send Telegram notification
          if (CHAT_ID && postId) {
            const descText = item.description?.slice(0, 250) || "";
            const ellipsis = (item.description?.length || 0) > 250 ? "..." : "";

            const caption =
              `📰 <b>${escapeHtml(item.title)}</b>\n\n` +
              `${escapeHtml(descText)}${ellipsis}\n\n` +
              `🔗 <a href="${escapeHtml(item.link)}">Источник (Ведомости)</a>\n` +
              `📅 ${escapeHtml(item.pubDate)}`;

            const keyboard = {
              inline_keyboard: [
                [
                  { text: "✅ Опубликовать", callback_data: `publish:${postId}` },
                  { text: "❌ Удалить", callback_data: `delete:${postId}` },
                ],
              ],
            };

            if (item.imageUrl) {
              // Send as photo with caption — shows image preview
              await fetch(`${TELEGRAM_API}/sendPhoto`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: CHAT_ID,
                  photo: item.imageUrl,
                  caption,
                  parse_mode: "HTML",
                  reply_markup: keyboard,
                }),
              });
            } else {
              // Fallback: text message
              await fetch(`${TELEGRAM_API}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: CHAT_ID,
                  text: caption,
                  parse_mode: "HTML",
                  reply_markup: keyboard,
                  disable_web_page_preview: false,
                }),
              });
            }

            totalAdded++;
          }
        }
      } catch (feedErr) {
        allErrors.push(`Feed ${feed.url}: ${String(feedErr)}`);
      }
    }

    return NextResponse.json({
      ok: true,
      feeds: RSS_FEEDS.length,
      added: totalAdded,
      errors: allErrors.length ? allErrors : undefined,
    });
  } catch (err) {
    console.error("RSS sync error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
