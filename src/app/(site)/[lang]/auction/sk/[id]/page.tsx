// Адрес прежней витрины аукционов (dokanmazad, выключена 04.10.2026).
// Её лоты в новый каталог не переносятся — id у carnect другие, — поэтому
// ведём в каталог целиком. Ссылки на старые адреса остались в переписке
// с клиентами в мессенджерах; пустая 404 там хуже каталога.

import { permanentRedirect } from "next/navigation";

export default async function OldAuctionUrl({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  permanentRedirect(`/${lang}/auction`);
}
