/**
 * Translate parts_products.name_en → name_ru via DeepL Free API
 *
 * Run:   npx tsx scripts/translate-parts-ru.ts
 *
 * Free tier: 500K chars/month. Stops on quota, re-run next month.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEEPL_KEY = process.env.DEEPL_API_KEY!;

const DEEPL_URL = DEEPL_KEY?.endsWith(":fx")
  ? "https://api-free.deepl.com/v2/translate"
  : "https://api.deepl.com/v2/translate";

const BATCH_SIZE = 50;
const DELAY_MS = 300;

if (!DEEPL_KEY) {
  console.error("DEEPL_API_KEY not set in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function translateBatch(texts: string[]): Promise<string[]> {
  const body = new URLSearchParams();
  body.append("source_lang", "EN");
  body.append("target_lang", "RU");
  for (const t of texts) body.append("text", t);

  const res = await fetch(DEEPL_URL, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (res.status === 456) throw new Error("QUOTA_EXCEEDED");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepL ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { translations: { text: string }[] };
  return json.translations.map((t) => t.text);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  // Check remaining quota
  const usageRes = await fetch(
    DEEPL_URL.replace("/v2/translate", "/v2/usage"),
    { headers: { Authorization: `DeepL-Auth-Key ${DEEPL_KEY}` } }
  );
  const usage = (await usageRes.json()) as {
    character_count: number;
    character_limit: number;
  };
  const remaining = usage.character_limit - usage.character_count;
  console.log(
    `DeepL quota: ${usage.character_count.toLocaleString()} / ${usage.character_limit.toLocaleString()} used, ~${remaining.toLocaleString()} remaining\n`
  );

  const { count } = await supabase
    .from("parts_products")
    .select("*", { count: "exact", head: true })
    .not("name_en", "is", null)
    .not("name_en", "eq", "")
    .or("name_ru.is.null,name_ru.eq.");

  if (!count) {
    console.log("All rows already have name_ru.");
    return;
  }

  console.log(`${count} rows to translate. Batches of ${BATCH_SIZE}...\n`);

  let processed = 0;
  let charsSent = 0;
  let batchNum = 0;

  while (processed < count) {
    const { data: rows, error } = await supabase
      .from("parts_products")
      .select("id, name_en")
      .not("name_en", "is", null)
      .not("name_en", "eq", "")
      .or("name_ru.is.null,name_ru.eq.")
      .order("id")
      .limit(BATCH_SIZE);

    if (error || !rows?.length) {
      if (error) console.error("Fetch error:", error);
      break;
    }

    batchNum++;
    const texts = rows.map((r) => r.name_en as string);
    const batchChars = texts.reduce((s, t) => s + t.length, 0);

    if (charsSent + batchChars > remaining) {
      console.log(
        `\nStopping: next batch (~${batchChars} chars) would exceed remaining quota (~${(remaining - charsSent).toLocaleString()}).`
      );
      break;
    }

    process.stdout.write(
      `Batch ${batchNum}: ${rows.length} rows, ~${batchChars} chars ... `
    );

    try {
      const translations = await translateBatch(texts);
      charsSent += batchChars;

      const results = await Promise.all(
        rows.map((row, i) =>
          supabase
            .from("parts_products")
            .update({ name_ru: translations[i] })
            .eq("id", row.id)
        )
      );

      const failed = results.filter((r) => r.error).length;
      processed += rows.length - failed;

      console.log(
        `ok (${processed}/${count}, ~${charsSent.toLocaleString()} chars)`
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "QUOTA_EXCEEDED") {
        console.log(
          `\nDeepL quota reached after ~${charsSent.toLocaleString()} chars. Translated: ${processed} rows. Re-run next month.`
        );
        break;
      }
      console.error("Error:", err);
    }

    await sleep(DELAY_MS);
  }

  console.log(
    `\nDone. Translated ${processed} rows, ~${charsSent.toLocaleString()} chars used.`
  );
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
