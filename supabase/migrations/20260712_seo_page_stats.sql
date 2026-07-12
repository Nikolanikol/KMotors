-- Search Console performance snapshots per page.
-- Наполняется коллектором /api/seo/collect (Фаза 1 SEO-автоматики).
-- Одна строка = одна страница за одно окно сбора (28 дней, заканчивающееся period_end).
-- Храним историю (не перезатираем), чтобы позже мерить эффект «до/после».

CREATE TABLE IF NOT EXISTS seo_page_stats (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  url          TEXT        NOT NULL,
  page_path    TEXT,                       -- /ru/parts/51712-B4000
  lang         TEXT,                       -- ru | en | ka | ar | ko
  section      TEXT,                       -- parts | catalog | calculator | blog | ...
  product_id   BIGINT,                     -- parts_products.id, если это карточка запчасти
  part_number  TEXT,                       -- артикул из slug, если распознан
  clicks       INTEGER     NOT NULL DEFAULT 0,
  impressions  INTEGER     NOT NULL DEFAULT 0,
  ctr          REAL        NOT NULL DEFAULT 0,
  position     REAL        NOT NULL DEFAULT 0,
  period_start DATE        NOT NULL,
  period_end   DATE        NOT NULL,
  fetched_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- один снапшот на (страница, окно): повторный сбор за тот же период обновляет строку
  UNIQUE (url, period_end)
);

CREATE INDEX IF NOT EXISTS idx_seo_page_stats_product   ON seo_page_stats (product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_seo_page_stats_period    ON seo_page_stats (period_end);
CREATE INDEX IF NOT EXISTS idx_seo_page_stats_section   ON seo_page_stats (section);
-- Детектор ищет слабые страницы: быстрый доступ по показам/позиции внутри свежего окна
CREATE INDEX IF NOT EXISTS idx_seo_page_stats_weak      ON seo_page_stats (period_end, impressions DESC, position);
