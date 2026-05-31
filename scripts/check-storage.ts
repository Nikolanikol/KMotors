import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
  // Check bucket exists and is public
  const { data: buckets } = await sb.storage.listBuckets();
  const bucket = buckets?.find(b => b.name === "parts-images");
  console.log("Bucket:", JSON.stringify(bucket, null, 2));
  
  // List first 5 files
  const { data: files, error } = await sb.storage.from("parts-images").list("", { limit: 5 });
  console.log("\nFiles error:", error);
  console.log("First 5 files:", files?.map(f => f.name));
  
  // Try to get public URL for one file
  if (files?.[0]) {
    const { data } = sb.storage.from("parts-images").getPublicUrl(files[0].name);
    console.log("\nPublic URL:", data.publicUrl);
  }
}
main().catch(console.error);
