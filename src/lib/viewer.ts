// Вошёл ли посетитель — для серверных страниц, которые показывают разное
// гостю и зарегистрированному (цены аукционов, решение владельца 05.10.2026).
//
// getUser, а не getSession: getSession верит cookie как есть, а getUser
// сверяет токен с Supabase — подделать вход правкой cookie нельзя. Цена
// ради этого стоит одного запроса к Supabase (он на том же VPS).
//
// ⚠️ Страница, которая это вызывает, становится ДИНАМИЧЕСКОЙ (cookies):
// её нельзя кешировать общим кешем Next — ответ зависит от посетителя.
//
// Не бросает: Supabase лёг — считаем гостем. Страница важнее цены.

import { isServiceHost } from "@/lib/serviceHost";
import { createClient } from "@/lib/supabase/server";

export interface Viewer {
  id: string;
  email: string | null;
}

export async function getViewer(): Promise<Viewer | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  } catch (e) {
    console.error("[viewer] проверка входа не удалась:", e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Видит ли посетитель цены лотов аукционов: вошёл ИЛИ пришёл через служебный
 * хост (office.kmotors.shop).
 *
 * Служебный хост закрыт Cloudflare Access — туда пускают только по почте из
 * политики, то есть только нас. Замок цены там ничего не защищает, а вход через
 * Google на нём невозможен: колбэк возвращает на NEXT_PUBLIC_SITE_URL, то есть
 * на www, и сессия остаётся там (решение владельца 06.10.2026).
 *
 * ⚠️ Оговорка та же, что у служебного блока (src/lib/serviceHost.ts): заголовок
 * Host подделывается запросом прямо на IP сервера в обход Cloudflare. Пока на
 * 80/443 пускают не только адреса Cloudflare, цена на служебном хосте — защита
 * от случайного взгляда, а не от целенаправленного обхода.
 */
export async function canSeeAuctionPrices(): Promise<boolean> {
  if (await isServiceHost()) return true;
  return !!(await getViewer());
}
