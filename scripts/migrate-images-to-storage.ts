/**
 * Migrate parts_products images from external CDNs → Supabase Storage
 *
 * Run:
 *   npx tsx --env-file=.env scripts/migrate-images-to-storage.ts
 *
 * Resumable: already-uploaded files are skipped automatically.
 * Interrupt anytime — re-run to continue from where it left off.
 */

import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET      = "parts-images";
const CONCURRENCY = 5;
const TIMEOUT_MS  = 15_000;

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract filename from URL, keep original extension */
function urlToFilename(url: string): string {
  try {
    const path = new URL(url).pathname;
    const base = path.split("/").pop() || "image.jpg";
    // Keep only safe chars
    return base.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
  } catch {
    return "image.jpg";
  }
}

/** Download image with timeout, return Buffer + content-type */
async function fetchImage(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; KMotors/1.0)" },
    });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    return { buffer: Buffer.from(arrayBuffer), contentType };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Run N async tasks with limited concurrency */
async function pool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, idx: number) => Promise<void>
): Promise<void> {
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Ensure bucket exists (public)
  const { data: buckets } = await sb.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await sb.storage.createBucket(BUCKET, { public: true });
    if (error) { console.error("❌ Failed to create bucket:", error.message); process.exit(1); }
    console.log(`✅ Created bucket: ${BUCKET}`);
  } else {
    console.log(`✅ Bucket exists: ${BUCKET}`);
  }

  // 2. Get all unique external image URLs
  console.log("\n📋 Loading unique image URLs...");
  const storageBase = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

  // Fetch in pages (Supabase limit 1000 per request)
  const allUrls = new Set<string>();
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from("parts_products")
      .select("image_url")
      .not("image_url", "is", null)
      .neq("image_url", "")
      .not("image_url", "like", `${storageBase}%`) // skip already migrated
      .range(from, from + 999);
    if (error || !data?.length) break;
    data.forEach((r) => allUrls.add(r.image_url as string));
    from += 1000;
    if (data.length < 1000) break;
  }

  const uniqueUrls = Array.from(allUrls);
  console.log(`📦 ${uniqueUrls.length} unique external URLs to migrate\n`);

  if (!uniqueUrls.length) {
    console.log("✅ All images already in Supabase Storage!");
    return;
  }

  // 3. Check which files already exist in storage
  console.log("🔍 Checking existing files in storage...");
  const existingFiles = new Set<string>();
  let storageFrom = 0;
  while (true) {
    const { data } = await sb.storage.from(BUCKET).list("", { limit: 1000, offset: storageFrom });
    if (!data?.length) break;
    data.forEach((f) => existingFiles.add(f.name));
    storageFrom += 1000;
    if (data.length < 1000) break;
  }
  console.log(`  Found ${existingFiles.size} files already uploaded\n`);

  // 4. Process each unique URL
  let done = 0, skipped = 0, failed = 0;
  const total = uniqueUrls.length;

  // Map: oldUrl → newUrl (for DB update)
  const migrated = new Map<string, string>();

  await pool(uniqueUrls, CONCURRENCY, async (url, idx) => {
    const filename = urlToFilename(url);

    // Already uploaded?
    if (existingFiles.has(filename)) {
      const newUrl = `${storageBase}${filename}`;
      migrated.set(url, newUrl);
      skipped++;
      if (skipped % 100 === 0) process.stdout.write(`  ⏭  Skipped ${skipped} already uploaded\r`);
      return;
    }

    // Download
    const result = await fetchImage(url);
    if (!result) {
      failed++;
      console.log(`  ❌ [${idx + 1}/${total}] Failed to download: ${url}`);
      return;
    }

    // Upload to Storage
    const { error: uploadError } = await sb.storage
      .from(BUCKET)
      .upload(filename, result.buffer, {
        contentType: result.contentType,
        upsert: false,
      });

    if (uploadError && !uploadError.message.includes("already exists")) {
      failed++;
      console.log(`  ❌ [${idx + 1}/${total}] Upload failed: ${uploadError.message}`);
      return;
    }

    const newUrl = `${storageBase}${filename}`;
    migrated.set(url, newUrl);
    done++;
    const kb = (result.buffer.byteLength / 1024).toFixed(0);
    console.log(`  ✅ [${done + skipped}/${total}] ${filename} (${kb} KB)`);
  });

  console.log(`\n📤 Upload done: ${done} new, ${skipped} skipped, ${failed} failed`);

  // 5. Update DB rows in batches
  if (migrated.size === 0) {
    console.log("Nothing to update in DB.");
    return;
  }

  console.log(`\n🗄  Updating database (${migrated.size} URL mappings)...`);
  let updated = 0;
  const entries = Array.from(migrated.entries());

  // Process in batches of 50 updates (run parallel within batch)
  for (let i = 0; i < entries.length; i += 50) {
    const batch = entries.slice(i, i + 50);
    await Promise.all(
      batch.map(([oldUrl, newUrl]) =>
        sb
          .from("parts_products")
          .update({ image_url: newUrl })
          .eq("image_url", oldUrl)
      )
    );
    updated += batch.length;
    process.stdout.write(`  Updated ${updated}/${migrated.size} URL mappings\r`);
  }

  console.log(`\n✅ Database updated: ${updated} URL mappings replaced`);
  console.log(`\n🏁 Done! Images are now served from Supabase Storage.`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
