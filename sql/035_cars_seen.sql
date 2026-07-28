-- Снимки машин Encar: наше собственное хранилище того, что у Encar живёт временно.
-- Запустить в Supabase Dashboard → SQL Editor.
--
-- Зачем: Encar на проданной машине отдаёт 404, и карточка остаётся вообще без
-- данных — ни марки, ни модели, ни цены. Из-за этого /[lang]/catalog/[id]
-- уходит в notFound() и теряет весь входящий поисковый трафик. Снимок позволяет
-- показать, что за машина тут была, и собрать запрос «покажи такие же».
--
-- Наполняется двумя путями, оба через upsert по encar_id:
--   1) пассивно при каждом рендере карточки (src/lib/carsSeen.ts) — богатый
--      снимок из /v1/readside/vehicle/{id}, включая modelGroup и английские имена;
--   2) разовым бэкфиллом (scripts/backfill-cars-seen.ts) — из листинга, где
--      modelGroup и английских имён нет, поэтому эти поля остаются NULL.
-- Пассивный путь покрывает всё, что реально получает трафик: чтобы страница
-- попала в поиск, Google должен был её обойти, а обход — это рендер.
--
-- Нестабильный порядок выдачи Encar таблице безразличен: пропущенная на стыке
-- страниц машина подберётся следующим проходом.

CREATE TABLE IF NOT EXISTS cars_seen (
  encar_id         text PRIMARY KEY,

  -- Корейские имена нужны, чтобы собирать запрос к Encar («такие же»):
  -- фильтр там принимает только их — Manufacturer.현대._.ModelGroup.팰리세이드.
  manufacturer_ko  text,
  model_group_ko   text,   -- 팰리세이드 — только из рендера, в листинге его нет
  model_ko         text,   -- 더 뉴 팰리세이드 — с поколением, для запроса не годится
  grade_ko         text,   -- Badge: 가솔린 3.8 2WD

  -- Английские — для показа человеку; прогонять через normalizeBrand().
  manufacturer_en  text,
  model_group_en   text,
  grade_en         text,

  year             int,     -- FormYear: 2023
  year_month       int,     -- Year / yearMonth: 202206
  -- ⚠️ ЕДИНИЦЫ: Encar отдаёт цену в 만원 (десятки тысяч вон) в обоих эндпоинтах.
  -- Храним как есть, без пересчёта. В вонах = price_manwon * 10000, ровно так
  -- это делает карточка (page.tsx: data.advertisement.price * 10000).
  price_manwon     int,
  mileage          int,
  fuel_ko          text,
  transmission_ko  text,
  photo_path       text,    -- путь без хоста; хост — https://ci.encar.com

  first_seen_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at     timestamptz NOT NULL DEFAULT now(),
  -- Проставляется лениво: посетитель пришёл на карточку, Encar ответил 404.
  -- Фоновой задачи под это нет и не нужно.
  sold_at          timestamptz
);

-- Подбор «таких же» на карточке проданной машины.
CREATE INDEX IF NOT EXISTS cars_seen_similar_idx
  ON cars_seen (manufacturer_ko, model_group_ko, year)
  WHERE sold_at IS NULL;

-- Пагинация сайтмапа по стабильному ключу вместо живой выдачи Encar
-- (в CLAUDE.md это записано как «настоящее лечение» дублей между файлами).
CREATE INDEX IF NOT EXISTS cars_seen_first_seen_idx
  ON cars_seen (first_seen_at DESC)
  WHERE sold_at IS NULL;

-- Пишет только сервер сервис-ключом; политик нет, значит публичного доступа нет.
ALTER TABLE cars_seen ENABLE ROW LEVEL SECURITY;
