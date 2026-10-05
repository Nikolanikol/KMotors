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
