-- Запчасти: проверка RLS и индексов (аудит 27.11.2026) и набор индексов под каталог.
-- Запускать в Supabase Dashboard → SQL Editor, ПО ЧАСТЯМ, сверху вниз. Это ПРОДОВАЯ база.
-- Ничего ниже не запускается приложением и не входит в миграции автоматически.
--
-- ЧАСТЬ A и B — только чтение (SELECT). Выполнить первыми и сохранить результат.
-- ЧАСТЬ C — создание индексов. Запускать ТОЛЬКО после просмотра результата части B и
--          отдельно, по одному оператору (CREATE INDEX CONCURRENTLY не работает внутри
--          транзакции, а SQL Editor оборачивает несколько операторов в одну).
-- ЧАСТЬ D — включение RLS. НЕ запускать, пока часть A не показала, что RLS выключен:
--          сервер ходит service-ключом и RLS не замечает, но любое место, где браузер
--          читает таблицу anon-ключом, после включения без политики перестанет работать.

-- ============================================================================
-- A. RLS: у каких таблиц включён, какие политики есть
-- ============================================================================
select c.relname as table_name, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
order by c.relrowsecurity, c.relname;

select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Гранты роли anon на таблицы запчастей и SEO: если есть INSERT/UPDATE/DELETE при
-- выключенном RLS, публичный anon-ключ (он в браузере) может менять данные.
select table_name, string_agg(privilege_type, ', ' order by privilege_type) as anon_privileges
from information_schema.role_table_grants
where grantee = 'anon' and table_schema = 'public'
  and table_name in ('parts_products', 'parts_staging', 'part_vehicles', 'vehicles',
                     'parts_fitment', 'parts_vehicle_models', 'seo_suggestions',
                     'seo_page_stats', 'leads', 'orders', 'order_items', 'carts', 'cart_items')
group by table_name
order by table_name;

-- ============================================================================
-- B. Индексы и размеры: что есть сейчас
-- ============================================================================
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('parts_products', 'part_vehicles', 'vehicles', 'parts_staging', 'leads')
order by tablename, indexname;

select relname, n_live_tup as approx_rows,
       pg_size_pretty(pg_total_relation_size(relid)) as total_size
from pg_stat_user_tables
where relname in ('parts_products', 'part_vehicles', 'vehicles', 'parts_staging')
order by relname;

select extname from pg_extension where extname in ('pg_trgm');

-- Данные, от которых зависят решения кода (сохранить ответы и принести):
-- 1) Формат артикулов: сколько с дефисами, пробелами, строчными, спецсимволами.
select
  count(*) filter (where part_number ~ '-')                    as with_hyphen,
  count(*) filter (where part_number ~ '\s')                   as with_space,
  count(*) filter (where part_number <> upper(part_number))    as not_upper,
  count(*) filter (where part_number !~ '^[A-Za-z0-9-]+$')     as special_chars,
  count(*) filter (where price_krw is null or price_krw <= 0)  as zero_or_null_price,
  count(*)                                                     as total
from parts_products;

-- 2) Рассинхрон денормализованного parts_count и живой совместимости (fitment-страницы).
select count(*) as mismatched_vehicles
from vehicles v
where v.parts_count <> (select count(*) from part_vehicles pv where pv.vehicle_id = v.id);

-- 3) Сколько карточек с seo_body (в журнале расходятся 493 и 535).
select count(seo_body_ru) as seo_ru, count(seo_body_en) as seo_en from parts_products;

-- ============================================================================
-- C. Индексы под запросы /api/parts/products и страниц запчастей
-- Каждый оператор запускать ОТДЕЛЬНО. Пропускать те, что уже есть по результату части B.
-- CONCURRENTLY: таблицу не блокирует на запись, но дольше строится. На ~49 тыс. строк
-- это секунды-минуты. Пересоздавать невалидные индексы (indisvalid=false) после сбоя.
-- ============================================================================

-- ВЫПОЛНЕНО 27.11.2026 (по команде владельца): pg_trgm и три GIN-индекса ниже созданы, все
-- валидны (2.8 + 4.8 + 3.8 МБ). Замер поиска ilike '%диск%': Seq Scan 107 мс → Bitmap Index
-- Scan 3.1 мс. Повторно не запускать.
-- Текстовый поиск ilike '%…%' по артикулу и названиям (раньше — полный просмотр таблицы).
create extension if not exists pg_trgm;

create index concurrently if not exists idx_parts_products_part_number_trgm
  on parts_products using gin (part_number gin_trgm_ops);
create index concurrently if not exists idx_parts_products_name_ru_trgm
  on parts_products using gin (name_ru gin_trgm_ops);
create index concurrently if not exists idx_parts_products_name_en_trgm
  on parts_products using gin (name_en gin_trgm_ops);

-- Стабильная сортировка с тайбрейкером id (пагинация каталога после правки `.order("id")`).
create index concurrently if not exists idx_parts_products_name_ru_id
  on parts_products (name_ru, id);
create index concurrently if not exists idx_parts_products_price_id
  on parts_products (price_krw, id);

-- УЖЕ ЕСТЬ в базе (замер 27.11.2026), заново НЕ создавать: parts_products(part_number)
-- idx_parts_products_partno, parts_products(subcategory_id) idx_parts_products_subcat,
-- part_vehicles(vehicle_id) idx_part_vehicles_vehicle, part_vehicles PK (part_id, vehicle_id)
-- покрывает поиск по part_id.
-- Лишние дубли на parts_products(category_id): idx_parts_products_cat, idx_parts_products_category,
-- idx_products_category — три одинаковых индекса, два можно удалить (drop index concurrently).

-- После создания проверить, что индексы валидны:
-- select indexrelid::regclass, indisvalid from pg_index where indrelid = 'parts_products'::regclass;

-- ============================================================================
-- D0. РЕЗУЛЬТАТ ЗАМЕРА 27.11.2026 (читающие запросы, выполнены в SQL Editor)
-- RLS ВЫКЛЮЧЕН у 33 из 64 таблиц public, и у anon есть полный набор прав
-- (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER) на каждую из них:
--   KMotors: leads (339 заявок: имена и телефоны), parts_products, parts_staging, parts_brands,
--            parts_categories, parts_fitment, parts_vehicle_models, parts_compatible_cars_raw,
--            auction_lots, auction_results, auction_sync_runs, carnect_lots, car_names,
--            blog_posts, blog_topics, events, page_views, ab_results, posted_parts,
--            posted_vehicles, seo_page_stats, seo_suggestions.
--   Чужие проекты в той же базе (НЕ трогать без владельцев): ca_parts_seo, ca_seo_page_stats,
--            ca_seo_suggestions (caranalizer), smmaker_* (9 таблиц).
-- Публичный anon-ключ лежит в браузерном бандле. Любой, у кого он есть, может читать заявки
-- с телефонами, менять цены, стирать таблицы. Код KMotors этих таблиц anon-ключом НЕ читает:
-- anon нужен только для авторизации (middleware, auth/callback, вкладки «Профиль» и «Заказы»),
-- всё остальное идёт service-ключом (src/lib/supabase.ts createServerClient), для которого
-- RLS не действует. Поэтому включение RLS без политик на таблицах KMotors сайт не ломает.
-- ============================================================================

-- D1. ВКЛЮЧЕНИЕ RLS на таблицах KMotors. НЕ запускать без решения владельца. Одним блоком
-- можно: ALTER ... ENABLE RLS мгновенный. Откат одной таблицы: alter table … disable row level security.
-- После запуска проверить: /ru/parts, карточку, категорию, /auction, блог, форму заявки, вход.
--
-- alter table public.leads                     enable row level security;
-- alter table public.parts_products            enable row level security;
-- alter table public.parts_staging             enable row level security;
-- alter table public.parts_brands              enable row level security;
-- alter table public.parts_categories          enable row level security;
-- alter table public.parts_fitment             enable row level security;
-- alter table public.parts_vehicle_models      enable row level security;
-- alter table public.parts_compatible_cars_raw enable row level security;
-- alter table public.auction_lots              enable row level security;
-- alter table public.auction_results           enable row level security;
-- alter table public.auction_sync_runs         enable row level security;
-- alter table public.carnect_lots              enable row level security;
-- alter table public.car_names                 enable row level security;
-- alter table public.blog_posts                enable row level security;
-- alter table public.blog_topics               enable row level security;
-- alter table public.events                    enable row level security;
-- alter table public.page_views                enable row level security;
-- alter table public.ab_results                enable row level security;
-- alter table public.posted_parts              enable row level security;
-- alter table public.posted_vehicles           enable row level security;
-- alter table public.seo_page_stats            enable row level security;
-- alter table public.seo_suggestions           enable row level security;
--
-- Скрипты из scripts/ и n8n/внешние сервисы, ходящие в базу anon-ключом, после этого потеряют
-- доступ: перед запуском убедиться, что они на service-ключе (в src и scripts anon-ключ
-- найден только в src/lib/supabase*.ts, middleware и auth/callback).

-- ============================================================================
-- D. RLS — общий шаблон (оставлен справочно).
-- Перед включением найти в коде все места, где ТАБЛИЦУ читает БРАУЗЕР anon-ключом
-- (src/lib/supabase/client.ts и всё, что его импортирует), и оставить для них политику
-- SELECT. Серверный код (service-ключ, src/lib/supabase.ts) RLS обходит.
-- Шаблон для таблицы, которую браузер НЕ читает (закрыть целиком):
--   alter table public.parts_staging enable row level security;
-- Шаблон для таблицы, которую браузер читает (открыть только чтение):
--   alter table public.parts_products enable row level security;
--   create policy parts_products_read on public.parts_products for select to anon, authenticated using (true);
-- Таблицы SEO-пайплайна (seo_suggestions, seo_page_stats, posted_parts, posted_vehicles) и
-- leads закрываются целиком: читает и пишет только сервер.
-- После включения проверить сайт: /ru/parts, карточку, категорию, fitment, корзину.
-- ============================================================================
