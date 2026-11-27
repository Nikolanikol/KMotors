import { LANGS } from "@/lib/lang";
import { SITE_URL } from "@/lib/site";

export interface AlternatesOptions {
  /**
   * Язык, на который указывает hreflang="x-default". По умолчанию `ru` — как у
   * всего сайта. Карточка авто передаёт `en` (решение владельца 27.11.2026:
   * упор на английские адреса); карта сайта выводит тот же адрес.
   */
  xDefault?: "en" | "ru";
}

export function makeAlternates(lang: string, path: string, opts?: AlternatesOptions) {
  const languages: Record<string, string> = {};
  for (const l of LANGS) {
    languages[l] = `${SITE_URL}/${l}${path}`;
  }
  languages["x-default"] = `${SITE_URL}/${opts?.xDefault ?? "ru"}${path}`;
  return {
    canonical: `${SITE_URL}/${lang}${path}`,
    languages,
  };
}
