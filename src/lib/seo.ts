const BASE = "https://www.kmotors.shop";
const LANGS = ["ru", "en", "ka", "ar"];

export function makeAlternates(lang: string, path: string) {
  const languages: Record<string, string> = {};
  for (const l of LANGS) {
    languages[l] = `${BASE}/${l}${path}`;
  }
  languages["x-default"] = `${BASE}/ru${path}`;
  return {
    canonical: `${BASE}/${lang}${path}`,
    languages,
  };
}
