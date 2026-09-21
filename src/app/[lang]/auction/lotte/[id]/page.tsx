// Публичная карточка лота lotte.

import { LotPage, lotMetadata } from "../../lotPage";

export const dynamic = "force-dynamic";
export const metadata = lotMetadata;

export default async function Page({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  return <LotPage lang={lang} id={id} source="lotte" />;
}
