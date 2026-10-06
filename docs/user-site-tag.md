# Метка сайта в аккаунте Supabase — K-Axis и Caranalizer

У K-Axis (kmotors.shop) и Caranalizer (caranalizer.com) **общий Supabase**, а
значит общий список аккаунтов `auth.users`: человек с одной почтой — один
аккаунт на обоих сайтах. Чтобы понимать, чей это пользователь, каждый сайт при
входе дописывает себя в метку аккаунта.

## Договорённость

- Поле: `app_metadata.sites` — **массив строк**.
- Значения: `"kmotors"` и `"caranalizer"`. Человек, который пользуется обоими
  сайтами, получает оба.
- Пишет только сервер, **сервисным ключом** (`auth.admin.updateUserById`).
  `app_metadata` пользователь сам изменить не может, в отличие от
  `user_metadata`.
- Метку дописывать, а не заменять: прочитать текущий массив, добавить своё имя,
  если его там нет.
- Ошибка записи метки не должна ломать вход — только лог.

## Код (supabase-js v2, сервер)

```ts
import { createClient, type User } from "@supabase/supabase-js";

const SITE_TAG = "caranalizer"; // у K-Axis здесь "kmotors"

const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function tagUserSite(user: User) {
  const app = (user.app_metadata ?? {}) as Record<string, unknown>;
  const sites = Array.isArray(app.sites) ? (app.sites as string[]) : [];
  if (sites.includes(SITE_TAG)) return;
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...app, sites: [...sites, SITE_TAG] },
  });
  if (error) console.error("[site-tag]", error.message, user.id);
}
```

## Где вызывать

После КАЖДОГО удачного входа, на сервере, с проверенным пользователем
(`supabase.auth.getUser()` или результат `exchangeCodeForSession`):

1. Колбэк OAuth (вход через Google) — сразу после `exchangeCodeForSession(code)`.
2. Вход и регистрация по почте — в серверном обработчике после успешного
   `signInWithPassword` / `signUp` с сессией.
3. Любая серверная страница, которая и так проверяет вход (личный кабинет и
   т.п.), — чтобы метку получили давние пользователи, которые давно не входили
   заново. Проверка `sites.includes(...)` делает вызов бесплатным после первого раза.

## Запросы (Supabase → SQL Editor)

```sql
-- Сколько пользователей у каждого сайта и сколько общих
select
  count(*) filter (where raw_app_meta_data->'sites' ? 'kmotors')      as kmotors,
  count(*) filter (where raw_app_meta_data->'sites' ? 'caranalizer')  as caranalizer,
  count(*) filter (where raw_app_meta_data->'sites' ?& array['kmotors','caranalizer']) as оба,
  count(*) filter (where raw_app_meta_data->'sites' is null)          as без_метки
from auth.users;
```

```sql
-- Список пользователей K-Axis
select created_at, email, raw_app_meta_data->>'provider' as provider, last_sign_in_at
from auth.users
where raw_app_meta_data->'sites' ? 'kmotors'
order by created_at desc;
```

Аккаунты, созданные до появления метки и с тех пор не входившие, останутся
`без_метки`. По почтовым регистрациям K-Axis их можно отличить по
`user_metadata` (`preferred_lang`, `signup_source`, `signup_notified`); по старым
входам через Google сайт не определить ничем.
