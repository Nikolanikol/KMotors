import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const STORAGE_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/parts-images/";
async function main() {
  const { count: migrated } = await sb.from("parts_products").select("*", { count: "exact", head: true }).like("image_url", `${STORAGE_BASE}%`);
  const { count: external } = await sb.from("parts_products").select("*", { count: "exact", head: true }).not("image_url", "like", `${STORAGE_BASE}%`).not("image_url", "is", null);
  const { count: total } = await sb.from("parts_products").select("*", { count: "exact", head: true });
  console.log(`Total: ${total}`);
  console.log(`✅ Migrated to Storage: ${migrated}`);
  console.log(`⏳ Still external: ${external}`);
}
main().catch(console.error);
