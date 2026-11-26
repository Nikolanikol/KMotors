import { LANGS } from "@/lib/lang";
import { SITE_URL } from "@/lib/site";

export function makeAlternates(lang: string, path: string) {
  const languages: Record<string, string> = {};
  for (const l of LANGS) {
    languages[l] = `${SITE_URL}/${l}${path}`;
  }
  languages["x-default"] = `${SITE_URL}/ru${path}`;
  return {
    canonical: `${SITE_URL}/${lang}${path}`,
    languages,
  };
}
