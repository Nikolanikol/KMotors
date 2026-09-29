// Публичная карточка лота K Car — она лежит в корне раздела, без сегмента
// площадки, потому что K Car это вкладка по умолчанию.

import { LotPage, lotMetadata } from "../lotPage";

export const dynamic = "force-dynamic";
export const metadata = lotMetadata;

export default async function Page({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  return <LotPage lang={lang} id={id} source="kcar" />;
}
