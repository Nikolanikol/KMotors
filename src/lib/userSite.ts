// Метка сайта в аккаунте: kmotors | caranalizer (решение владельца 06.10.2026).
//
// Зачем. Supabase у K-Axis и Caranalizer ОБЩИЙ (ADDITIONAL_REDIRECT_URLS в
// Coolify держит оба домена), значит и auth.users общий: человек с одной почтой
// — один аккаунт на обоих сайтах. Без метки не понять, чей это пользователь:
// счёт регистраций K-Axis завышен людьми Caranalizer, а у Google-входа в
// аккаунте нет ничего, кроме данных Google.
//
// Как. В app_metadata.sites — СПИСОК сайтов, где человек входил: один и тот же
// человек может пользоваться обоими. app_metadata, а не user_metadata: второе
// пользователь меняет сам, первое пишет только сервер сервисным ключом.
// Caranalizer обязан ставить ту же метку со своим именем — инструкция в
// docs/user-site-tag.md.
//
// Запрос «пользователи K-Axis»: where raw_app_meta_data->'sites' ? 'kmotors'.
//
// Не бросает: метка — учёт, а не условие входа.

import type { User } from "@supabase/supabase-js";

import { createServerClient as createAdminClient } from "@/lib/supabase";

export const SITE_TAG = "kmotors";

/** Есть ли у аккаунта наша метка — по уже загруженному User, без запроса. */
export function hasSiteTag(user: User): boolean {
  const sites = (user.app_metadata as Record<string, unknown> | undefined)?.sites;
  return Array.isArray(sites) && sites.includes(SITE_TAG);
}

/** Поставить метку, если её нет. Один запрос на человека за всё время. */
export async function tagUserSite(user: User): Promise<void> {
  if (hasSiteTag(user)) return;
  try {
    const app = (user.app_metadata ?? {}) as Record<string, unknown>;
    const sites = Array.isArray(app.sites) ? (app.sites as unknown[]).filter((s) => typeof s === "string") : [];
    // Объект целиком со своей правкой — не полагаемся на то, сливает ли GoTrue поля сам.
    const { error } = await createAdminClient().auth.admin.updateUserById(user.id, {
      app_metadata: { ...app, sites: [...sites, SITE_TAG] },
    });
    if (error) console.error("[site-tag] метка не сохранилась:", error.message, user.id);
  } catch (e) {
    console.error("[site-tag] метка не сохранилась:", e instanceof Error ? e.message : e, user.id);
  }
}
