import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Total with image_url
  const { count: total } = await sb.from("parts_products").select("*", { count: "exact", head: true }).not("image_url", "is", null).neq("image_url", "");
  console.log(`Total rows with image_url: ${total}`);

  // Unique URLs
  const { data: sample } = await sb.from("parts_products").select("image_url").not("image_url", "is", null).neq("image_url", "").limit(5000);
  const unique = new Set(sample?.map(r => r.image_url));
  console.log(`Unique URLs in first 5000: ${unique.size} (${((unique.size/5000)*100).toFixed(0)}% unique)`);

  // Domains breakdown
  const domains: Record<string, number> = {};
  for (const url of unique) {
    try { const d = new URL(url as string).hostname; domains[d] = (domains[d] ?? 0) + 1; } catch {}
  }
  console.log("\nDomains:", domains);

  // Check already in supabase storage (migrated)
  const supabaseStorageBase = process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/";
  const { count: migrated } = await sb.from("parts_products").select("*", { count: "exact", head: true }).like("image_url", `${supabaseStorageBase}%`);
  console.log(`\nAlready in Supabase Storage: ${migrated ?? 0}`);

  // Sample a few images to estimate size
  const testUrls = Array.from(unique).slice(0, 5) as string[];
  console.log("\nSampling image sizes...");
  let totalBytes = 0;
  let count = 0;
  for (const url of testUrls) {
    try {
      const r = await fetch(url, { method: "HEAD" });
      const size = r.headers.get("content-length");
      if (size) { totalBytes += parseInt(size); count++; console.log(`  ${url.split("/").pop()} → ${(parseInt(size)/1024).toFixed(0)} KB`); }
    } catch (e) { console.log(`  ${url} → ERROR`); }
  }
  if (count > 0) {
    const avgKB = totalBytes / count / 1024;
    const estimatedGB = (avgKB * (total ?? 0)) / 1024 / 1024;
    console.log(`\nAvg image size: ~${avgKB.toFixed(0)} KB`);
    console.log(`Estimated total storage: ~${estimatedGB.toFixed(1)} GB`);
  }
}
main().catch(console.error);
