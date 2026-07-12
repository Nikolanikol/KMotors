-- Фаза 3 SEO-автоматики: очередь черновиков + боевые SEO-поля карточки запчасти.

-- ── 1. Боевые SEO-поля на parts_products ────────────────────────────────────
-- Заполняются ТОЛЬКО после апрува предложения из seo_suggestions.
-- generateMetadata и карточка читают их (если пусто — фолбэк на текущую логику).
ALTER TABLE parts_products ADD COLUMN IF NOT EXISTS seo_title_ru      TEXT;
ALTER TABLE parts_products ADD COLUMN IF NOT EXISTS seo_title_en      TEXT;
ALTER TABLE parts_products ADD COLUMN IF NOT EXISTS seo_desc_ru       TEXT;
ALTER TABLE parts_products ADD COLUMN IF NOT EXISTS seo_desc_en       TEXT;
ALTER TABLE parts_products ADD COLUMN IF NOT EXISTS seo_body_ru       TEXT;   -- проза-описание
ALTER TABLE parts_products ADD COLUMN IF NOT EXISTS seo_body_en       TEXT;
ALTER TABLE parts_products ADD COLUMN IF NOT EXISTS cross_refs        JSONB;  -- ["51712-2W000", ...]
ALTER TABLE parts_products ADD COLUMN IF NOT EXISTS seo_updated_at    TIMESTAMPTZ;
ALTER TABLE parts_products ADD COLUMN IF NOT EXISTS seo_content_hash  TEXT;

-- ── 2. Очередь предложений (draft → approved/rejected/applied) ──────────────
CREATE TABLE IF NOT EXISTS seo_suggestions (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_id           UUID        NOT NULL,               -- группирует один прогон генерации
  product_id         BIGINT,                             -- parts_products.id (для parts)
  part_number        TEXT,
  url                TEXT,                               -- канонический /ru/parts/{slug} (для не-parts)
  type               TEXT        NOT NULL,               -- 'meta' | 'content'
  source             TEXT        NOT NULL,               -- 'proactive_parts' | 'gsc_meta' | 'gsc_content'

  -- Снимок метрик на момент генерации — точка отсчёта для замера «до/после»
  snap_impressions   INTEGER,
  snap_ctr           REAL,
  snap_position      REAL,

  -- Предложенный контент (языки ru/en — приоритетные)
  proposed_title_ru  TEXT,
  proposed_title_en  TEXT,
  proposed_desc_ru   TEXT,
  proposed_desc_en   TEXT,
  proposed_body_ru   TEXT,
  proposed_body_en   TEXT,
  proposed_cross_refs JSONB,

  content_hash       TEXT,
  status             TEXT        NOT NULL DEFAULT 'draft', -- draft|approved|rejected|applied
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_seo_suggestions_batch   ON seo_suggestions (batch_id);
CREATE INDEX IF NOT EXISTS idx_seo_suggestions_status  ON seo_suggestions (status);
CREATE INDEX IF NOT EXISTS idx_seo_suggestions_product ON seo_suggestions (product_id) WHERE product_id IS NOT NULL;
-- Не генерить повторно то, что недавно предлагали: свежий draft/approved по товару
CREATE INDEX IF NOT EXISTS idx_seo_suggestions_recent  ON seo_suggestions (product_id, created_at DESC);
