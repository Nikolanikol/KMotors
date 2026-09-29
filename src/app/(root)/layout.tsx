// Корневой layout для страниц ВНЕ языкового сегмента: "/" и /blog/[slug].
// Язык здесь взять неоткуда, поэтому ru — обе страницы русскоязычные.
import RootShell from "../RootShell";
export { metadata, viewport } from "../rootMetadata";

export default function RootGroupLayout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="ru">{children}</RootShell>;
}
