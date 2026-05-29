import { createClient } from "@supabase/supabase-js";

const DEEPL_KEY = process.env.DEEPL_API_KEY!;
const DEEPL_URL = DEEPL_KEY.endsWith(":fx")
  ? "https://api-free.deepl.com/v2/translate"
  : "https://api.deepl.com/v2/translate";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // 5 untranslated rows
  const { data } = await supabase
    .from("parts_products")
    .select("id, name_ru, name_ko")
    .or("name_en.is.null,name_en.eq.")
    .limit(5);

  console.log("Source names:");
  data?.forEach((r) => {
    const src = r.name_ru?.trim() || r.name_ko?.trim();
    const lang = r.name_ru ? "RU" : "KO";
    console.log(" ", r.id, `[${lang}]`, "|", src);
  });

  // Translate — auto-detect source language (RU or KO)
  const body = new URLSearchParams();
  body.append("target_lang", "EN-US");
  data?.forEach((r) => {
    const src = r.name_ru?.trim() || r.name_ko?.trim() || "";
    body.append("text", src);
  });

  const res = await fetch(DEEPL_URL, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = (await res.json()) as any;

  console.log("\nTranslations:");
  data?.forEach((r, i) => {
    const src = r.name_ru?.trim() || r.name_ko?.trim();
    console.log(" ", src, "→", json.translations?.[i]?.text ?? "ERROR");
  });

  // Quota check
  const uRes = await fetch("https://api-free.deepl.com/v2/usage", {
    headers: { Authorization: `DeepL-Auth-Key ${DEEPL_KEY}` },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = (await uRes.json()) as any;
  const pct = ((u.character_count / u.character_limit) * 100).toFixed(1);
  console.log(
    `\nQuota: ${u.character_count?.toLocaleString()} / ${u.character_limit?.toLocaleString()} chars (${pct}% used)`
  );
}

main().catch(console.error);
