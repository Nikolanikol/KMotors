// Манифест ядра «запчасти». Из Кореи запчасти открыты — запретов здесь нет.

import { LANG_GROUP } from "./shared";

// 308: старые URL запчастей "PN--name-slug" → канонический "PN".
// Редирект должен быть настоящим HTTP (не из page.tsx: там loading.tsx
// запускает стриминг и статус уже отправлен как 200).
const LEGACY_PARTS_SLUG = new RegExp(`^\\/(${LANG_GROUP})\\/parts\\/([^/]+?)--[^/]+$`);

/** Канонический путь для старого `/{lang}/parts/PN--slug` или null. */
export function legacyPartsRedirect(path: string): string | null {
  const m = path.match(LEGACY_PARTS_SLUG);
  return m ? `/${m[1]}/parts/${m[2]}` : null;
}
