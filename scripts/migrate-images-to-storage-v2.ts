/**
 * Migrate parts_products images from external CDNs → Supabase Storage (v2)
 *
 * Safe & resumable:
 *   - Reads unique image_url WHERE image_storage_url IS NULL
 *   - Downloads with per-host Referer + throttling
 *   - Uploads to bucket `parts-images/<host>/<filename>`
 *   - Writes result into image_storage_url (NEVER touches image_url)
 *   - Logs failed URLs to scripts/.image-migration-failures.log
 *
 * Run (test 100):
 *   LIMIT=100 npx tsx --env-file=.env scripts/migrate-images-to-storage-v2.ts
 * Run (full, gentle):
 *   LIMIT=0 CONCURRENCY=4 DELAY_MS=150 npx tsx --env-file=.env scripts/migrate-images-to-storage-v2.ts
 */

import { createClient } from "@supabase/supabase-js";
import { appendFileSync } from "node:fs";

// ── Config (env-overridable) ───────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET       = "parts-images";
const LIMIT        = Number(process.env.LIMIT ?? "100");   // 0 = no limit (full run)
const CONCURRENCY  = Number(process.env.CONCURRENCY ?? "4");
const DELAY_MS     = Number(process.env.DELAY_MS ?? "150"); // pause after each download
const TIMEOUT_MS   = Number(process.env.TIMEOUT_MS ?? "20000");
const FAIL_LOG     = "scripts/.image-migration-failures.log";

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Storage object path: <host>/<safe-filename>, keeps images namespaced per source */
function urlToStoragePath(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
    const base = (u.pathname.split("/").pop() || "image.jpg")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .toLowerCase();
    return `${host}/${base}`;
  } catch {
    return `misc/image_${Date.now()}.jpg`;
  }
}

/** A legit-looking Referer for the source host (defeats naive hotlink protection) */
function refererFor(url: string): string {
  try { return new URL(url).origin + "/"; } catch { return ""; }
}

async function fetchImage(
  url: string
): Promise<{ buffer: Buffer; contentType: string } | { error: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Referer: refererFor(url),
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      },
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.byteLength < 200) return { error: `too small (${buffer.byteLength}b)` };
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return { error: `not image (${contentType})` };
    return { buffer, contentType };
  } catch (e) {
    return { error: (e as Error).name === "AbortError" ? "timeout" : (e as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

async function pool<T>(items: T[], concurrency: number, fn: (item: T, idx: number) => Promise<void>) {
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n⚙  LIMIT=${LIMIT || "∞"}  CONCURRENCY=${CONCURRENCY}  DELAY_MS=${DELAY_MS}\n`);

  // 1. Ensure bucket exists (public)
  const { data: buckets } = await sb.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await sb.storage.createBucket(BUCKET, { public: true });
    if (error) { console.error("❌ createBucket:", error.message); process.exit(1); }
    console.log(`✅ Created public bucket: ${BUCKET}`);
  } else {
    console.log(`✅ Bucket exists: ${BUCKET}`);
  }

  // 2. Collect unique external URLs still missing a storage copy
  console.log("📋 Loading unmigrated image URLs...");
  const uniq = new Set<string>();
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from("parts_products")
      .select("image_url")
      .not("image_url", "is", null)
      .neq("image_url", "")
      .is("image_storage_url", null)
      .range(from, from + 999);
    if (error) { console.error(error.message); break; }
    if (!data?.length) break;
    data.forEach((r) => uniq.add(r.image_url as string));
    from += 1000;
    if (data.length < 1000) break;
    if (LIMIT && uniq.size >= LIMIT) break;
  }
  let urls = Array.from(uniq);
  if (LIMIT) urls = urls.slice(0, LIMIT);
  console.log(`📦 ${urls.length} unique URLs to process\n`);
  if (!urls.length) { console.log("✅ Nothing left to migrate."); return; }

  // 3. Download → upload → map old→new
  const storageBase = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
  const migrated = new Map<string, string>();
  let done = 0, failed = 0;

  await pool(urls, CONCURRENCY, async (url) => {
    const path = urlToStoragePath(url);
    const res = await fetchImage(url);
    if ("error" in res) {
      failed++;
      appendFileSync(FAIL_LOG, `${res.error}\t${url}\n`);
      console.log(`  ❌ ${res.error}: ${url}`);
      await sleep(DELAY_MS);
      return;
    }
    const { error: upErr } = await sb.storage
      .from(BUCKET)
      .upload(path, res.buffer, { contentType: res.contentType, upsert: true });
    if (upErr) {
      failed++;
      appendFileSync(FAIL_LOG, `upload:${upErr.message}\t${url}\n`);
      console.log(`  ❌ upload ${upErr.message}: ${url}`);
      await sleep(DELAY_MS);
      return;
    }
    migrated.set(url, `${storageBase}${path}`);
    done++;
    const kb = (res.buffer.byteLength / 1024).toFixed(0);
    console.log(`  ✅ [${done}/${urls.length}] ${path} (${kb} KB)`);
    await sleep(DELAY_MS);
  });

  console.log(`\n📤 Download/upload: ${done} ok, ${failed} failed`);

  // 4. Write image_storage_url for every row sharing each migrated source URL
  if (!migrated.size) { console.log("Nothing to write to DB."); return; }
  console.log(`\n🗄  Writing image_storage_url for ${migrated.size} source URLs...`);
  let updated = 0;
  const entries = Array.from(migrated.entries());
  for (let i = 0; i < entries.length; i += 50) {
    const batch = entries.slice(i, i + 50);
    await Promise.all(
      batch.map(([oldUrl, newUrl]) =>
        sb.from("parts_products").update({ image_storage_url: newUrl }).eq("image_url", oldUrl)
      )
    );
    updated += batch.length;
    process.stdout.write(`  ${updated}/${migrated.size}\r`);
  }
  console.log(`\n✅ DB updated. Failures logged to ${FAIL_LOG}`);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
