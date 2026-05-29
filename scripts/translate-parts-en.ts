/**
 * Translate parts_products.name_ru → name_en via Gemini 2.5 Flash
 *
 * Run:
 *   npx tsx scripts/translate-parts-en.ts
 *
 * Processes rows where name_en IS NULL or empty, in batches of 50.
 * Logs progress and skips rows on error (keeps going).
 */

import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GEMINI_KEY        = process.env.GEMINI_API_KEY!;
const BATCH_SIZE        = 50;   // rows per Gemini call
const DELAY_MS          = 5000; // free tier: ~15 req/min → 4s+ between batches
const MAX_RETRIES       = 3;    // Gemini retry attempts

// ── Init ──────────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI    = new GoogleGenerativeAI(GEMINI_KEY);
const model    = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Send a batch of part names to Gemini, get English translations back.
 * Retries up to MAX_RETRIES times on 503/rate-limit errors.
 * Returns a map: { id → translated_name_en }
 */
async function translateBatch(
  rows: { id: number; name_ru: string; name_ko: string | null }[]
): Promise<Map<number, string>> {
  const list = rows
    .map((r, i) => {
      const src = r.name_ko?.trim() || r.name_ru.trim();
      return `${i + 1}. [${r.id}] ${src}`;
    })
    .join("\n");

  const prompt = `You are translating Korean/Russian automotive spare part names into concise English product names used in international catalogs (like Hyundai Mobis).

Rules:
- Output ONLY a numbered list, same order, same count.
- Format: "N. [ID] English name"
- Keep it short and technical (e.g. "Knock Sensor", "Front Bumper Bracket Assy", "Oil Filter")
- Do NOT add explanations or extra text.

Parts to translate:
${list}`;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text   = result.response.text().trim();

      const map    = new Map<number, string>();
      const lineRe = /^\d+\.\s+\[(\d+)\]\s+(.+)$/;
      for (const line of text.split("\n")) {
        const m = line.trim().match(lineRe);
        if (m) {
          const id = Number(m[1]);
          const name = m[2].trim();
          if (id && name) map.set(id, name);
        }
      }
      return map;
    } catch (err: unknown) {
      lastErr = err;
      const status = (err as { status?: number }).status;
      if (status === 503) {
        const wait = attempt * 8000;
        console.warn(`  ↻ Gemini ${status}, retry ${attempt}/${MAX_RETRIES} in ${wait / 1000}s…`);
        await sleep(wait);
      } else {
        throw err; // non-retryable
      }
    }
  }
  throw lastErr;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Count total rows to process
  const { count } = await supabase
    .from("parts_products")
    .select("*", { count: "exact", head: true })
    .or("name_en.is.null,name_en.eq.");

  if (!count) {
    console.log("✅ No rows to translate.");
    return;
  }

  console.log(`📦 Found ${count} rows without name_en. Processing in batches of ${BATCH_SIZE}…\n`);

  let offset    = 0;
  let processed = 0;
  let errors    = 0;

  while (offset < count) {
    // Fetch next batch
    const { data: rows, error: fetchErr } = await supabase
      .from("parts_products")
      .select("id, name_ru, name_ko")
      .or("name_en.is.null,name_en.eq.")
      .order("id")
      .range(offset, offset + BATCH_SIZE - 1);

    if (fetchErr || !rows?.length) {
      console.error("Fetch error:", fetchErr);
      break;
    }

    console.log(`⏳ Batch ${Math.floor(offset / BATCH_SIZE) + 1}: translating ${rows.length} rows (IDs ${rows[0].id}–${rows[rows.length - 1].id})…`);

    try {
      const translations = await translateBatch(rows);

      // Write translations back — one upsert per batch
      const updates = [];
      for (const row of rows) {
        const en = translations.get(row.id);
        if (en) {
          updates.push({ id: row.id, name_en: en });
        } else {
          console.warn(`  ⚠️  No translation for ID ${row.id} (${row.name_ru})`);
          errors++;
        }
      }

      if (updates.length) {
        // Update each row individually (avoids NOT NULL constraint issues with upsert)
        const results = await Promise.all(
          updates.map(({ id, name_en }) =>
            supabase.from("parts_products").update({ name_en }).eq("id", id)
          )
        );
        const failed = results.filter((r) => r.error);
        if (failed.length) {
          console.error(`  Update errors: ${failed.map((r) => r.error?.message).join("; ")}`);
          errors += failed.length;
        }
        const ok = updates.length - failed.length;
        processed += ok;
        console.log(`  ✅ Updated ${ok} rows (total: ${processed}/${count})`);
      }
    } catch (err) {
      console.error("  Gemini error:", err);
      errors += rows.length;
    }

    offset += BATCH_SIZE;

    // Rate-limit pause (skip on last batch)
    if (offset < count) await sleep(DELAY_MS);
  }

  console.log(`\n🏁 Done. Translated: ${processed}, Errors: ${errors}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
