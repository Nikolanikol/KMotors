-- Экспертный контент карточек запчастей: «что это за деталь, зачем нужна, как изнашивается».
-- Запустить в Supabase Dashboard → SQL Editor. Только создаёт новую таблицу, существующих
-- таблиц не трогает и ни с чем не связана внешними ключами.
--
-- ЗАЧЕМ ЭТА ТАБЛИЦА.
-- С конца лета 2026 Google не индексирует большую часть карточек запчастей: в карточке
-- ~2 КБ видимого текста, и 143 тысячи страниц лежат в статусе «просканирована, но не
-- проиндексирована». Хронология и разбор — docs/seo-indexing/. Эта таблица хранит
-- ДОПОЛНИТЕЛЬНЫЙ текст, который выводится на странице детали под основным блоком: что это за
-- деталь, к чему крепится, чем отличается от похожих, признаки износа, заметки по замене и
-- вопросы-ответы покупателя. Ради этого текста таблица и существует.
--
-- ОТКУДА ДАННЫЕ.
-- Генерирует ChatGPT по белому списку источников (дилерские каталоги Hyundai/Kia/Genesis,
-- partsro.com, официальные мануалы), прогонами по 50 артикулов; после каждого прогона
-- делается выборка на проверку, и только потом строки переводятся из draft в published.
-- Два слоя внутри content:
--   catalog_facts — факты ИМЕННО об этом номере, только из источников (замена номера,
--                   парные номера, чем не путать);
--   explanation   — общее знание о ТИПЕ детали (как работает, как изнашивается), без чисел
--                   и без привязки к модели.
--
-- ЧЕГО ЗДЕСЬ БЫТЬ НЕ ДОЛЖНО.
-- Цен, применимости к моделям и фото. Применимость живёт в part_vehicles + vehicles,
-- цена — в parts_products и считается через src/lib/pricing.ts. Дублировать их сюда нельзя:
-- разъедутся.
--
-- КЛЮЧ — part_number + lang, а НЕ id из parts_products. В parts_products ~130 артикулов
-- занимают несколько строк (одна деталь заведена по строке на совместимый автомобиль), и
-- сливать их нельзя. Контент относится к артикулу, а не к строке.
--
-- ПУБЛИКАЦИЯ. Страницы читают ТОЛЬКО строки со status = 'published'. Всё остальное
-- (draft, approved, rejected) на сайт не попадает. Пока код страницы не подключён к таблице,
-- содержимое нигде не отображается.
--
-- ДОСТУП. Как у cars_seen: RLS включён, политик нет, значит публичного доступа нет. Читает и
-- пишет только сервер сервис-ключом.

CREATE TABLE IF NOT EXISTS kmotors_part_content (
  part_number   text NOT NULL,                       -- OEM-номер как в parts_products.part_number
  lang          text NOT NULL DEFAULT 'en'
                CHECK (lang ~ '^[a-z]{2}$'),         -- язык текста; сейчас только 'en'

  -- draft — только что сгенерировано; approved — прошло проверку, ещё не выложено;
  -- published — показывается на сайте; rejected — забраковано, не показывать и не перегенерировать
  -- без решения человека.
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'approved', 'published', 'rejected')),

  -- Уверенность самой модели: high / medium / low. low = каталожного слоя нет, остался только
  -- общий текст о типе детали.
  confidence    text CHECK (confidence IN ('high', 'medium', 'low')),

  -- Полная карточка: { catalog_facts: {...}, explanation: {...}, faq: [...] }. Структура описана
  -- в docs/seo-indexing/ (промпт-эталон), схему внутри Postgres намеренно не навязываем:
  -- формат ещё уточняется, а jsonb переживает правки без миграций.
  content       jsonb NOT NULL,

  -- Нормализованные ссылки на источники (страница конкретного номера), вынесены отдельно,
  -- чтобы их можно было проверять скриптом без разбора jsonb.
  sources       text[] NOT NULL DEFAULT '{}',

  word_count    int,                                 -- слов в карточке, для отбора слабых
  run_label     text,                                -- 'run1', 'run2'… — какой прогон дал строку
  generator     text NOT NULL DEFAULT 'chatgpt-web', -- чем сгенерировано

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  reviewed_at   timestamptz,                         -- когда человек принял решение по строке

  PRIMARY KEY (part_number, lang)
);

-- Выборка для страницы: «опубликованный контент по номеру» — это уже ключ, а вот
-- проверки очереди (сколько черновиков, что ждёт ревью) идут по статусу.
CREATE INDEX IF NOT EXISTS kmotors_part_content_status_idx
  ON kmotors_part_content (status, run_label);

ALTER TABLE kmotors_part_content ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE kmotors_part_content IS
  'Экспертный текст карточки запчасти (что за деталь, признаки износа, вопросы-ответы), генерируется ChatGPT по белому списку источников. Зачем: тонкие шаблонные карточки не индексируются Google, этот текст добавляет вес. Ключ part_number+lang. На сайт попадают только строки status=published. Подробно: docs/seo-indexing/, sql/045_kmotors_part_content.sql.';
COMMENT ON COLUMN kmotors_part_content.part_number IS 'OEM-номер, как в parts_products.part_number. Не id: один артикул может занимать несколько строк parts_products.';
COMMENT ON COLUMN kmotors_part_content.lang IS 'Двухбуквенный код языка текста. Сейчас только en (решение владельца 26.11.2026).';
COMMENT ON COLUMN kmotors_part_content.status IS 'draft → approved → published; rejected — забраковано. Сайт показывает только published.';
COMMENT ON COLUMN kmotors_part_content.confidence IS 'Уверенность модели: high/medium/low. low = нет каталожного слоя, только общее объяснение типа детали.';
COMMENT ON COLUMN kmotors_part_content.content IS 'jsonb: catalog_facts (факты об этом номере из источников), explanation (общее о типе детали), faq (3 вопроса-ответа).';
COMMENT ON COLUMN kmotors_part_content.sources IS 'Ссылки на страницы источников по этому номеру (нормализованные), для автоматической проверки.';
COMMENT ON COLUMN kmotors_part_content.word_count IS 'Число слов в карточке, для отбора слабых.';
COMMENT ON COLUMN kmotors_part_content.run_label IS 'Метка прогона генерации (run1, run2…).';
COMMENT ON COLUMN kmotors_part_content.generator IS 'Чем сгенерировано: chatgpt-web — ответ ChatGPT, скопированный из интерфейса.';
COMMENT ON COLUMN kmotors_part_content.reviewed_at IS 'Когда человек принял решение по строке (approved/rejected/published).';
