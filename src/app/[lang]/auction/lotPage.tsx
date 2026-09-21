// Публичная карточка лота: общий рендер для всех трёх площадок.
//
// ⚠️ Кнопка ведёт в WhatsApp с готовым текстом — тем же номером, что на
// карточках каталога авто. Лот живёт дни, и разговор о нём нужен сейчас.
//
// ⚠️ noindex, как и у каталога: адрес прошедшего лота через неделю станет
// пустой страницей, а в Search Console — очередной сотней 404.

import type { Metadata } from "next";

import ShowcaseLotPage from "@/components/Auction/ShowcaseLotPage";
import { auctionLabels } from "@/lib/auctionLabels";
import { getLot } from "@/lib/kcar/query";

/** Тот же номер, что в карточке каталога авто (Catalog/Row/CarCard). */
const WA_PHONE = "821058654344";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kmotors.shop";

export const lotMetadata: Metadata = { robots: { index: false, follow: false } };

export async function LotPage({
  lang,
  id,
  source,
}: {
  lang: string;
  id: string;
  source: string;
}) {
  const L = auctionLabels(lang);
  const lot = await getLot(id);

  const name = lot ? [lot.maker, lot.model, lot.year].filter(Boolean).join(" ") : id;
  // ⚠️ В сообщение идёт НАШ адрес лота, а не source_url витрины-источника.
  // Иначе мы сами присылаем клиенту ссылку на посредника, у которого он
  // купит мимо нас. Номер лота нужен менеджеру, чтобы найти машину у себя.
  const ourUrl = `${SITE}/${lang}/auction/${source === "kcar" ? "" : `${source}/`}${id}`;
  const text = `${L.ask}: ${name} (${L.lot} ${id}) — ${ourUrl}`;
  const contactHref = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;

  return (
    <div className="pt-20">
      <ShowcaseLotPage
        id={id}
        source={source}
        labels={L}
        hrefBase={`/${lang}/auction`}
        lang={lang}
        contactHref={contactHref}
      />
    </div>
  );
}
