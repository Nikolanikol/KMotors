// Быстрый контакт по WhatsApp — номер и сборка ссылки в одном месте.
//
// ⚠️ Номер живёт в проекте ДЕВЯТЬЮ копиями (CarCard, StickyMobileCTA,
// SoldCarCta, MessengerButtons, SocialRow, FloatingButtons, NoResultsBanner,
// FavoritesClient, models/[slug]) плюс дважды в JSON-LD. Здесь он заведён
// один раз для кода аукциона; сводить остальные к этому модулю — отдельная
// работа, и делать её заодно значит трогать половину витрины ради одной
// строки. Но новую копию плодить нельзя: поменяется номер — и часть сайта
// будет звать клиента не туда, причём молча.
export const WA_PHONE = "821058654344";

/** Ссылка в WhatsApp с готовым текстом. */
export function waHref(text: string): string {
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;
}

/**
 * Текст обращения по лоту аукциона.
 *
 * ⚠️ В сообщение идёт НАШ адрес лота, а не source_url витрины-посредника.
 * Иначе мы сами присылаем клиенту прямую ссылку на посредника, у которого он
 * купит мимо нас: это не утечка данных, а утечка сделки. Номер лота нужен
 * менеджеру, чтобы найти машину у себя.
 */
export function lotAskText(opts: {
  ask: string;
  lotWord: string;
  name: string;
  id: string;
  url: string;
}): string {
  return `${opts.ask}: ${opts.name} (${opts.lotWord} ${opts.id}) — ${opts.url}`;
}

/** Абсолютный адрес нашей страницы лота. */
export function lotUrl(lang: string, source: string, id: string): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kmotors.shop";
  return `${site}/${lang}/auction/${source === "kcar" ? "" : `${source}/`}${id}`;
}
