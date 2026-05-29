/**
 * Translate parts_products.name_ru → name_en via DeepL Free API
 *
 * Prerequisites:
 *   1. Register at https://www.deepl.com/en/pro/api (Free plan)
 *   2. Add to .env:  DEEPL_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx
 *
 * Run:
 *   npx tsx scripts/translate-parts-deepl.ts
 *
 * Free tier: 500,000 chars/month. Script stops automatically when quota runs out.
 * Re-run next month — it will continue from where it left off (skips translated rows).
 */

import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEEPL_KEY     = process.env.DEEPL_API_KEY!;

// Free tier uses api-free.deepl.com, paid uses api.deepl.com
const DEEPL_URL = DEEPL_KEY?.endsWith(":fx")
  ? "https://api-free.deepl.com/v2/translate"
  : "https://api.deepl.com/v2/translate";

const BATCH_SIZE = 50;   // DeepL supports up to 50 texts per request
const DELAY_MS   = 500;  // pause between batches

// ── Init ──────────────────────────────────────────────────────────────────────
if (!DEEPL_KEY) {
  console.error("❌ DEEPL_API_KEY not set in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── DeepL translate batch ─────────────────────────────────────────────────────
async function translateBatch(texts: string[]): Promise<string[]> {
  const body = new URLSearchParams();
  // No source_lang — DeepL auto-detects RU or KO
  body.append("target_lang", "EN-US");
  for (const t of texts) body.append("text", t);

  const res = await fetch(DEEPL_URL, {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${DEEPL_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (res.status === 456) {
    throw new Error("QUOTA_EXCEEDED");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepL ${res.status}: ${text}`);
  }

  const json = await res.json() as { translations: { text: string }[] };
  return json.translations.map((t) => t.text);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const { count } = await supabase
    .from("parts_products")
    .select("*", { count: "exact", head: true })
    .or("name_en.is.null,name_en.eq.");

  if (!count) {
    console.log("✅ All rows already have name_en.");
    return;
  }

  console.log(`📦 ${count} rows to translate. Batches of ${BATCH_SIZE}…\n`);

  // NOTE: Always query at offset 0 — as rows get translated they fall out of the
  // name_en.is.null filter, so the "cursor" advances naturally without a fixed offset
  // (fixed offset + dynamic filter = skips every other batch).
  let batchNum  = 0;
  let processed = 0;
  let charsSent = 0;

  while (processed < count) {
    const { data: rows, error } = await supabase
      .from("parts_products")
      .select("id, name_ru, name_ko")
      .or("name_en.is.null,name_en.eq.")
      .order("id")
      .limit(BATCH_SIZE);

    if (error || !rows?.length) {
      if (error) console.error("Fetch error:", error);
      break;
    }

    batchNum++;

    // Use name_ru if available, fall back to name_ko (strip part number in parentheses)
    const validRows = rows.filter((r) => r.name_ru?.trim() || r.name_ko?.trim());
    const texts = validRows.map((r) => {
      const src = (r.name_ru?.trim() || r.name_ko?.trim()) as string;
      // Remove trailing part numbers like "(85201D2202NBD)" from Korean names
      return src.replace(/\s*\([A-Z0-9]{6,}\)\s*$/, "").trim();
    });
    const batchChars = texts.reduce((s, t) => s + t.length, 0);

    console.log(`⏳ Batch ${batchNum}: ${validRows.length} rows, ~${batchChars} chars (total sent: ${charsSent.toLocaleString()})…`);

    try {
      const translations = await translateBatch(texts);
      charsSent += batchChars;

      // Update each row
      const results = await Promise.all(
        validRows.map((row, i) =>
          supabase
            .from("parts_products")
            .update({ name_en: translations[i] })
            .eq("id", row.id)
        )
      );

      const failed = results.filter((r) => r.error).length;
      const ok     = rows.length - failed;
      processed   += ok;

      console.log(`  ✅ ${ok} rows (total: ${processed}/${count}, chars used: ~${charsSent.toLocaleString()})`);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "QUOTA_EXCEEDED") {
        console.log(`\n⛔ DeepL monthly quota reached after ~${charsSent.toLocaleString()} chars.`);
        console.log(`   Translated so far: ${processed} rows.`);
        console.log(`   Re-run next month to continue (script skips already translated rows).`);
        break;
      }
      console.error("  Error:", err);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n🏁 Done. Translated ${processed} rows, ~${charsSent.toLocaleString()} chars used.`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
