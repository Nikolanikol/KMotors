import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
  const { data } = await sb.from("parts_products").select("id, image_url").not("image_url", "is", null).limit(10);
  data?.forEach(r => console.log(r.id, JSON.stringify(r.image_url)));
  // count nulls
  const { count: nullCount } = await sb.from("parts_products").select("*", { count: "exact", head: true }).is("image_url", null);
  const { count: total } = await sb.from("parts_products").select("*", { count: "exact", head: true });
  console.log(`\nTotal: ${total}, No image: ${nullCount}, With image: ${(total ?? 0) - (nullCount ?? 0)}`);
}
main().catch(console.error);
