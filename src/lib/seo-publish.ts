// Фаза 5 SEO-автоматики: публикация одобренного контента на карточку.
//
// Берёт approved-предложения → пишет в parts_products.seo_* → сбрасывает кэш
// (revalidatePath + revalidateTag) → пингует IndexNow (Bing/Яндекс) → помечает applied.
// Вызывается из Telegram-гейта (по апруву) и из /api/seo/publish (backstop/cron).

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath, revalidateTag } from "next/cache";
import { submitIndexNow } from "@/lib/indexnow";

const LANGS = ["ru", "en", "ka", "ar"]; // индексируемые языки карточек

export async function publishApproved(
  supabase: SupabaseClient,
  filter: { batch_id?: string; id?: number }
): Promise<{ published: number; urls: number; indexnow: boolean }> {
  let q = supabase
    .from("seo_suggestions")
    .select("id, product_id, part_number, content_hash, proposed_title_ru, proposed_title_en, proposed_desc_ru, proposed_desc_en, proposed_body_ru, proposed_body_en, proposed_cross_refs")
    .eq("status", "approved");
  if (filter.batch_id) q = q.eq("batch_id", filter.batch_id);
  if (filter.id) q = q.eq("id", filter.id);

  const { data: rows } = await q;
  if (!rows?.length) return { published: 0, urls: 0, indexnow: false };

  const urls: string[] = [];
  let published = 0;

  for (const s of rows) {
    if (!s.product_id) continue;

    const { error } = await supabase
      .from("parts_products")
      .update({
        seo_title_ru: s.proposed_title_ru,
        seo_title_en: s.proposed_title_en,
        seo_desc_ru: s.proposed_desc_ru,
        seo_desc_en: s.proposed_desc_en,
        seo_body_ru: s.proposed_body_ru,
        seo_body_en: s.proposed_body_en,
        cross_refs: s.proposed_cross_refs,
        seo_updated_at: new Date().toISOString(),
        seo_content_hash: s.content_hash,
      })
      .eq("id", s.product_id);
    if (error) {
      console.error("[seo-publish]", s.product_id, error.message);
      continue;
    }

    await supabase.from("seo_suggestions").update({ status: "applied" }).eq("id", s.id);

    const slug = s.part_number || `id-${s.product_id}`;
    for (const lang of LANGS) {
      const path = `/${lang}/parts/${slug}`;
      urls.push(path);
      try {
        revalidatePath(path);
      } catch {
        /* вне request-контекста — не критично */
      }
    }
    published++;
  }

  // Сброс data-cache карточек (getCachedProduct тегирован "parts-product")
  try {
    revalidateTag("parts-product");
  } catch {
    /* ignore */
  }

  // Пинг Bing/Яндекс об изменённых URL
  let indexnow = false;
  if (urls.length) {
    const r = await submitIndexNow(urls);
    indexnow = r.ok;
  }

  return { published, urls: urls.length, indexnow };
}
