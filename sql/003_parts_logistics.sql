-- ═══════════════════════════════════════════════════════════════════
-- МИГРАЦИЯ: Логистические данные для parts_categories
-- Таблицы: public.parts_categories, public.parts_products
-- Автор: KMotors Parts — generated migration
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- ШАГ 1: Добавить логистические колонки в parts_categories
-- ───────────────────────────────────────────────────────────────────
ALTER TABLE public.parts_categories
  ADD COLUMN IF NOT EXISTS weight_min_kg     DECIMAL(7,3),
  ADD COLUMN IF NOT EXISTS weight_avg_kg     DECIMAL(7,3),
  ADD COLUMN IF NOT EXISTS weight_max_kg     DECIMAL(7,3),
  ADD COLUMN IF NOT EXISTS length_cm         DECIMAL(6,1),
  ADD COLUMN IF NOT EXISTS width_cm          DECIMAL(6,1),
  ADD COLUMN IF NOT EXISTS height_cm         DECIMAL(6,1),
  ADD COLUMN IF NOT EXISTS ship_method       TEXT,   -- 'EMS' | 'EMS_PREMIUM' | 'SEA' | 'CLARIFY'
  ADD COLUMN IF NOT EXISTS logistics_notes   TEXT,
  ADD COLUMN IF NOT EXISTS requires_l3       BOOLEAN DEFAULT FALSE;

-- Комментарии к колонкам
COMMENT ON COLUMN public.parts_categories.weight_avg_kg   IS 'Нормативный средний вес детали без упаковки (кг)';
COMMENT ON COLUMN public.parts_categories.ship_method     IS 'EMS ≤30кг | EMS_PREMIUM ≤70кг | SEA >70кг или негабарит | CLARIFY — уточнять';
COMMENT ON COLUMN public.parts_categories.requires_l3     IS 'TRUE если категория слишком широкая и требует детализации L3';

-- ───────────────────────────────────────────────────────────────────
-- ШАГ 2: Добавить логистические колонки в parts_products
-- ───────────────────────────────────────────────────────────────────
ALTER TABLE public.parts_products
  ADD COLUMN IF NOT EXISTS weight_kg         DECIMAL(7,3),   -- реальный замер (приоритет над нормативом)
  ADD COLUMN IF NOT EXISTS length_cm         DECIMAL(6,1),
  ADD COLUMN IF NOT EXISTS width_cm          DECIMAL(6,1),
  ADD COLUMN IF NOT EXISTS height_cm         DECIMAL(6,1),
  ADD COLUMN IF NOT EXISTS billed_weight_kg  DECIMAL(7,3),   -- расчётный вес для квотирования
  ADD COLUMN IF NOT EXISTS ship_method       TEXT;           -- переопределяет категорию если заполнено

COMMENT ON COLUMN public.parts_products.weight_kg        IS 'Реальный вес после взвешивания — приоритет над нормативом категории';
COMMENT ON COLUMN public.parts_products.billed_weight_kg IS 'max(weight_kg * 1.12, vol_weight) — используется для расчёта доставки';

-- ───────────────────────────────────────────────────────────────────
-- ШАГ 3: Пометить широкие L2 категории (требуют L3)
-- ───────────────────────────────────────────────────────────────────
UPDATE public.parts_categories SET requires_l3 = TRUE
WHERE id IN (17701, 17901, 17902);

-- ───────────────────────────────────────────────────────────────────
-- ШАГ 4: Заполнить однородные L2 категории
-- Расч.вес = max(weight_avg * 1.12, L*W*H/5000)
-- EMS: расч.вес ≤30 кг AND L+(W+H)*2 ≤300 AND L ≤150
-- EMS_PREMIUM: расч.вес ≤70 кг AND L+(W+H)*2 ≤419 AND L ≤270
-- SEA: всё остальное
-- ───────────────────────────────────────────────────────────────────

-- 177 / Двигатель ────────────────────────────────────────────────

-- 17702 Опоры двигателя и КПП
UPDATE public.parts_categories SET
  weight_min_kg=1.50, weight_avg_kg=3.50, weight_max_kg=5.00,
  length_cm=22, width_cm=18, height_cm=14,
  ship_method='EMS',
  logistics_notes='Резиново-металлические подушки, компактные'
WHERE id = 17702;

-- 17703 Система охлаждения (широкий диапазон — радиатор vs патрубок)
UPDATE public.parts_categories SET
  weight_min_kg=0.30, weight_avg_kg=4.00, weight_max_kg=8.00,
  length_cm=55, width_cm=35, height_cm=10,
  ship_method='EMS_PREMIUM',
  logistics_notes='Диапазон большой: патрубок 0.3кг vs радиатор 6кг. Уточнять при крупном заказе'
WHERE id = 17703;

-- 17704 Ремни, ролики и натяжители
UPDATE public.parts_categories SET
  weight_min_kg=0.30, weight_avg_kg=1.20, weight_max_kg=2.50,
  length_cm=32, width_cm=26, height_cm=10,
  ship_method='EMS',
  logistics_notes=''
WHERE id = 17704;

-- 17705 Система зажигания
UPDATE public.parts_categories SET
  weight_min_kg=0.10, weight_avg_kg=0.70, weight_max_kg=1.50,
  length_cm=20, width_cm=12, height_cm=8,
  ship_method='EMS',
  logistics_notes='Свечи, катушки, модули зажигания'
WHERE id = 17705;

-- 17706 Датчики
UPDATE public.parts_categories SET
  weight_min_kg=0.10, weight_avg_kg=0.30, weight_max_kg=0.80,
  length_cm=14, width_cm=7, height_cm=6,
  ship_method='EMS',
  logistics_notes='Лёгкие, компактные'
WHERE id = 17706;

-- 17707 Топливная система
UPDATE public.parts_categories SET
  weight_min_kg=0.50, weight_avg_kg=1.50, weight_max_kg=3.00,
  length_cm=22, width_cm=14, height_cm=12,
  ship_method='EMS',
  logistics_notes='ВНИМАНИЕ: топливный насос — опасный груз (горючее). Уточнять у перевозчика'
WHERE id = 17707;

-- 17708 Впуск и выпуск
UPDATE public.parts_categories SET
  weight_min_kg=0.50, weight_avg_kg=2.50, weight_max_kg=8.00,
  length_cm=45, width_cm=22, height_cm=15,
  ship_method='EMS_PREMIUM',
  logistics_notes='Выхлопные компоненты могут быть крупными'
WHERE id = 17708;

-- 17709 Клапаны и уплотнения
UPDATE public.parts_categories SET
  weight_min_kg=0.10, weight_avg_kg=0.40, weight_max_kg=1.00,
  length_cm=20, width_cm=12, height_cm=4,
  ship_method='EMS',
  logistics_notes='Прокладки, сальники, уплотнения'
WHERE id = 17709;

-- 17799 Прочее двигатель
UPDATE public.parts_categories SET
  weight_min_kg=0.30, weight_avg_kg=1.50, weight_max_kg=5.00,
  length_cm=25, width_cm=18, height_cm=12,
  ship_method='EMS',
  logistics_notes='Среднее значение — уточнять по конкретной детали'
WHERE id = 17799;

-- 178 / Коробка передач ──────────────────────────────────────────

-- 17801 АКПП (в сборе)
UPDATE public.parts_categories SET
  weight_min_kg=45.00, weight_avg_kg=70.00, weight_max_kg=110.00,
  length_cm=55, width_cm=42, height_cm=38,
  ship_method='SEA',
  logistics_notes='ТОЛЬКО МОРЕ. АКПП в сборе — 45-110 кг. EMS невозможен'
WHERE id = 17801;

-- 17802 МКПП (в сборе)
UPDATE public.parts_categories SET
  weight_min_kg=30.00, weight_avg_kg=45.00, weight_max_kg=65.00,
  length_cm=50, width_cm=38, height_cm=32,
  ship_method='SEA',
  logistics_notes='ТОЛЬКО МОРЕ. МКПП в сборе — 30-65 кг'
WHERE id = 17802;

-- 17803 Подушки КПП
UPDATE public.parts_categories SET
  weight_min_kg=0.80, weight_avg_kg=2.00, weight_max_kg=3.50,
  length_cm=18, width_cm=14, height_cm=10,
  ship_method='EMS',
  logistics_notes=''
WHERE id = 17803;

-- 17804 Сцепление
UPDATE public.parts_categories SET
  weight_min_kg=0.50, weight_avg_kg=8.00, weight_max_kg=12.00,
  length_cm=36, width_cm=36, height_cm=14,
  ship_method='EMS_PREMIUM',
  logistics_notes='Комплект диск+корзина ~8кг. Один выжимной подшипник ~0.5кг — разброс'
WHERE id = 17804;

-- 17899 Прочее КПП
UPDATE public.parts_categories SET
  weight_min_kg=0.50, weight_avg_kg=4.00, weight_max_kg=10.00,
  length_cm=25, width_cm=20, height_cm=15,
  ship_method='EMS_PREMIUM',
  logistics_notes='Уточнять по детали'
WHERE id = 17899;

-- 179 / Шасси ────────────────────────────────────────────────────

-- 17901 Тормозная система — ШИРОКАЯ, нужны L3
-- (weight_avg для fallback если L3 не найден)
UPDATE public.parts_categories SET
  weight_min_kg=0.20, weight_avg_kg=4.00, weight_max_kg=9.50,
  length_cm=36, width_cm=20, height_cm=10,
  ship_method='EMS_PREMIUM',
  logistics_notes='ШИРОКАЯ КАТЕГОРИЯ: колодки 1.5кг vs диски 9кг. Используй L3 подкатегории',
  requires_l3=TRUE
WHERE id = 17901;

-- 17902 Подвеска — ШИРОКАЯ, нужны L3
UPDATE public.parts_categories SET
  weight_min_kg=0.30, weight_avg_kg=4.50, weight_max_kg=12.00,
  length_cm=55, width_cm=22, height_cm=18,
  ship_method='EMS_PREMIUM',
  logistics_notes='ШИРОКАЯ КАТЕГОРИЯ: шаровая 1кг vs рычаг 7кг vs амортизатор 6кг. Используй L3',
  requires_l3=TRUE
WHERE id = 17902;

-- 17903 Рулевое управление
UPDATE public.parts_categories SET
  weight_min_kg=0.50, weight_avg_kg=5.50, weight_max_kg=14.00,
  length_cm=60, width_cm=18, height_cm=16,
  ship_method='EMS_PREMIUM',
  logistics_notes='Диапазон: наконечник 0.6кг vs рейка 12кг. Рейка — размер L=85см, проверять'
WHERE id = 17903;

-- 17904 Ступица и подшипники
UPDATE public.parts_categories SET
  weight_min_kg=1.50, weight_avg_kg=2.50, weight_max_kg=4.50,
  length_cm=22, width_cm=22, height_cm=12,
  ship_method='EMS',
  logistics_notes=''
WHERE id = 17904;

-- 17905 Приводные валы
UPDATE public.parts_categories SET
  weight_min_kg=4.00, weight_avg_kg=7.00, weight_max_kg=10.00,
  length_cm=90, width_cm=14, height_cm=14,
  ship_method='EMS_PREMIUM',
  logistics_notes='Длинная деталь. size_formula = 90+(14+14)*2 = 146см — OK для EMS Premium'
WHERE id = 17905;

-- 17999 Прочее шасси
UPDATE public.parts_categories SET
  weight_min_kg=0.50, weight_avg_kg=3.00, weight_max_kg=8.00,
  length_cm=30, width_cm=20, height_cm=14,
  ship_method='EMS',
  logistics_notes='Уточнять по детали'
WHERE id = 17999;

-- 180 / Кузов ────────────────────────────────────────────────────

-- 18001 Кузовные панели (крылья, двери, пороги)
UPDATE public.parts_categories SET
  weight_min_kg=3.00, weight_avg_kg=8.00, weight_max_kg=18.00,
  length_cm=110, width_cm=55, height_cm=10,
  ship_method='EMS_PREMIUM',
  logistics_notes='Крыло ~4кг / Дверь ~12кг. Объём.вес крыла = 110*55*10/5000=12.1кг — EMS_PREMIUM'
WHERE id = 18001;

-- 18002 Бамперы
UPDATE public.parts_categories SET
  weight_min_kg=4.00, weight_avg_kg=6.00, weight_max_kg=9.00,
  length_cm=185, width_cm=55, height_cm=42,
  ship_method='SEA',
  logistics_notes='ТОЛЬКО МОРЕ. Объём.вес = 185*55*42/5000 = 85.5кг. EMS Premium невозможен'
WHERE id = 18002;

-- 18003 Остекление
UPDATE public.parts_categories SET
  weight_min_kg=2.00, weight_avg_kg=8.00, weight_max_kg=20.00,
  length_cm=90, width_cm=60, height_cm=6,
  ship_method='EMS_PREMIUM',
  logistics_notes='ХРУПКОЕ! +20% к весу за усиленную упаковку. Лобовое стекло — только море'
WHERE id = 18003;

-- 18004 Зеркала
UPDATE public.parts_categories SET
  weight_min_kg=1.00, weight_avg_kg=2.00, weight_max_kg=3.50,
  length_cm=28, width_cm=22, height_cm=16,
  ship_method='EMS',
  logistics_notes='Хрупкие — усиленная упаковка'
WHERE id = 18004;

-- 18005 Освещение (фары, фонари)
UPDATE public.parts_categories SET
  weight_min_kg=1.50, weight_avg_kg=3.50, weight_max_kg=5.50,
  length_cm=55, width_cm=34, height_cm=28,
  ship_method='EMS_PREMIUM',
  logistics_notes='ХРУПКОЕ! Объём.вес фары = 55*34*28/5000=10.5кг. Усиленная упаковка обязательна'
WHERE id = 18005;

-- 18006 Уплотнители и молдинги
UPDATE public.parts_categories SET
  weight_min_kg=0.10, weight_avg_kg=0.50, weight_max_kg=2.00,
  length_cm=35, width_cm=10, height_cm=5,
  ship_method='EMS',
  logistics_notes='Лёгкие. Длинные уплотнители — проверять длину'
WHERE id = 18006;

-- 18099 Прочее кузов
UPDATE public.parts_categories SET
  weight_min_kg=0.50, weight_avg_kg=3.00, weight_max_kg=10.00,
  length_cm=35, width_cm=22, height_cm=15,
  ship_method='EMS',
  logistics_notes='Уточнять по детали'
WHERE id = 18099;

-- 181 / Салон ────────────────────────────────────────────────────

-- 18101 Сидения
UPDATE public.parts_categories SET
  weight_min_kg=8.00, weight_avg_kg=18.00, weight_max_kg=35.00,
  length_cm=62, width_cm=52, height_cm=60,
  ship_method='SEA',
  logistics_notes='ТОЛЬКО МОРЕ. Объём.вес = 62*52*60/5000=38.7кг. Сидение в сборе крупное'
WHERE id = 18101;

-- 18102 Панель приборов
UPDATE public.parts_categories SET
  weight_min_kg=2.00, weight_avg_kg=5.00, weight_max_kg=10.00,
  length_cm=75, width_cm=30, height_cm=20,
  ship_method='EMS_PREMIUM',
  logistics_notes=''
WHERE id = 18102;

-- 18103 Климат-контроль и вентиляция
UPDATE public.parts_categories SET
  weight_min_kg=0.50, weight_avg_kg=3.00, weight_max_kg=6.00,
  length_cm=38, width_cm=28, height_cm=22,
  ship_method='EMS',
  logistics_notes=''
WHERE id = 18103;

-- 18104 Ковры, обшивки и накладки
UPDATE public.parts_categories SET
  weight_min_kg=0.50, weight_avg_kg=2.00, weight_max_kg=5.00,
  length_cm=65, width_cm=45, height_cm=5,
  ship_method='EMS_PREMIUM',
  logistics_notes='Объём.вес ковра = 65*45*5/5000=2.9кг — вес OK, размер проверять'
WHERE id = 18104;

-- 18105 Электрика салона
UPDATE public.parts_categories SET
  weight_min_kg=0.10, weight_avg_kg=0.80, weight_max_kg=2.50,
  length_cm=22, width_cm=16, height_cm=8,
  ship_method='EMS',
  logistics_notes=''
WHERE id = 18105;

-- 18199 Прочее салон
UPDATE public.parts_categories SET
  weight_min_kg=0.20, weight_avg_kg=2.00, weight_max_kg=6.00,
  length_cm=28, width_cm=20, height_cm=14,
  ship_method='EMS',
  logistics_notes='Уточнять по детали'
WHERE id = 18199;

-- ───────────────────────────────────────────────────────────────────
-- ШАГ 5: Вставить L3 подкатегории для широких категорий
-- Нумерация: parent_id * 1000 + порядковый номер
-- Пример: 17901 * 1000 + 1 = 17901001  →  но это слишком длинное число
-- Используем: parent_id || lpad(seq::text, 2, '0') в text, но id INT
-- Лучше: начинаем с 900000 для L3 чтобы не конфликтовать с L2
-- L3 range: 900001 - 999999
-- ───────────────────────────────────────────────────────────────────

-- L3: 17701 — Масло и фильтры
INSERT INTO public.parts_categories
  (id, parent_id, name_ru, name_en, name_ko, slug, sort_order,
   weight_avg_kg, weight_min_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  (900101, 17701, 'Масляный фильтр',        'Oil Filter',             '오일 필터',    'filter-oil',          1, 0.400, 0.250, 0.600,  10, 10, 10, 'EMS', ''),
  (900102, 17701, 'Воздушный фильтр',       'Air Filter',             '에어 필터',    'filter-air',          2, 0.600, 0.350, 0.900,  28, 24,  6, 'EMS', ''),
  (900103, 17701, 'Салонный фильтр',        'Cabin Air Filter',       '에어컨 필터',  'filter-cabin',        3, 0.400, 0.250, 0.600,  32, 16,  4, 'EMS', ''),
  (900104, 17701, 'Топливный фильтр',       'Fuel Filter',            '연료 필터',    'filter-fuel',         4, 0.700, 0.400, 1.100,  16, 10, 10, 'EMS', 'Возможен опасный груз — уточнять'),
  (900105, 17701, 'Фильтр АКПП',            'Transmission Filter',    'ATF 필터',     'filter-transmission', 5, 0.500, 0.300, 0.800,  20, 14,  6, 'EMS', '')
ON CONFLICT (id) DO NOTHING;

-- L3: 17901 — Тормозная система
INSERT INTO public.parts_categories
  (id, parent_id, name_ru, name_en, name_ko, slug, sort_order,
   weight_avg_kg, weight_min_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  (900201, 17901, 'Колодки тормозные передние (к-т)', 'Brake Pads Front Set',   '앞 브레이크 패드', 'brake-pads-front',      1, 2.000, 1.200, 2.800,  26, 16,  8, 'EMS', ''),
  (900202, 17901, 'Колодки тормозные задние (к-т)',   'Brake Pads Rear Set',    '뒤 브레이크 패드', 'brake-pads-rear',       2, 1.400, 0.900, 2.000,  22, 13,  7, 'EMS', ''),
  (900203, 17901, 'Диск тормозной передний',          'Brake Disc Front',       '앞 브레이크 디스크','brake-disc-front',      3, 9.000, 6.500,12.000,  36, 36,  5, 'EMS_PREMIUM', ''),
  (900204, 17901, 'Диск тормозной задний',            'Brake Disc Rear',        '뒤 브레이크 디스크','brake-disc-rear',       4, 6.500, 4.500, 9.000,  31, 31,  4, 'EMS_PREMIUM', ''),
  (900205, 17901, 'Суппорт тормозной',                'Brake Caliper',          '브레이크 캘리퍼',  'brake-caliper',         5, 4.500, 3.000, 7.000,  22, 16, 13, 'EMS', ''),
  (900206, 17901, 'Тормозной шланг',                  'Brake Hose',             '브레이크 호스',    'brake-hose',            6, 0.250, 0.150, 0.400,  40,  6,  4, 'EMS', ''),
  (900207, 17901, 'Главный тормозной цилиндр',        'Brake Master Cylinder',  '마스터 실린더',    'brake-master-cylinder', 7, 1.800, 1.200, 2.500,  22, 12, 12, 'EMS', ''),
  (900208, 17901, 'Датчик АБС',                       'ABS Sensor',             'ABS 센서',         'abs-sensor',            8, 0.200, 0.120, 0.350,  10,  5,  5, 'EMS', '')
ON CONFLICT (id) DO NOTHING;

-- L3: 17902 — Подвеска
INSERT INTO public.parts_categories
  (id, parent_id, name_ru, name_en, name_ko, slug, sort_order,
   weight_avg_kg, weight_min_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  (900301, 17902, 'Амортизатор / стойка (1 шт)',   'Shock Absorber',         '쇽 업쇼버',      'shock-absorber',    1, 6.000, 4.000, 9.000,  65, 12, 12, 'EMS_PREMIUM', 'size_formula=65+(12+12)*2=113см — OK'),
  (900302, 17902, 'Пружина подвески (1 шт)',        'Coil Spring',            '코일 스프링',    'coil-spring',       2, 4.500, 3.000, 7.000,  38, 38, 32, 'EMS_PREMIUM', ''),
  (900303, 17902, 'Рычаг нижний',                  'Lower Control Arm',      '로어 암',        'control-arm-lower', 3, 7.000, 4.500,11.000,  55, 22, 12, 'EMS_PREMIUM', ''),
  (900304, 17902, 'Шаровая опора',                 'Ball Joint',             '볼 조인트',      'ball-joint',        4, 1.000, 0.600, 1.800,  16, 10, 10, 'EMS', ''),
  (900305, 17902, 'Стойка стабилизатора',           'Stabilizer Link',        '스태빌라이저 링크','stab-link',        5, 0.500, 0.250, 0.900,  42,  6,  6, 'EMS', ''),
  (900306, 17902, 'Втулка стабилизатора (к-т)',     'Stabilizer Bushing Set', '스태빌라이저 부시','stab-bushing',     6, 0.300, 0.150, 0.500,  12,  8,  6, 'EMS', ''),
  (900307, 17902, 'Опора стойки (подушка)',         'Strut Mount',            '스트러트 마운트', 'strut-mount',       7, 1.200, 0.700, 2.000,  18, 18, 10, 'EMS', ''),
  (900308, 17902, 'Ступица с подшипником',          'Wheel Hub Bearing',      '허브 베어링',    'wheel-hub-bearing', 8, 2.200, 1.500, 3.500,  22, 22, 12, 'EMS', '')
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────
-- ШАГ 6: VIEW для расчёта логистики — удобно использовать в API
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_category_logistics AS
SELECT
  c.id,
  c.parent_id,
  c.name_ru,
  c.name_en,
  c.slug,
  c.weight_avg_kg,
  c.weight_min_kg,
  c.weight_max_kg,
  c.length_cm,
  c.width_cm,
  c.height_cm,
  -- Объёмный вес
  ROUND((c.length_cm * c.width_cm * c.height_cm / 5000)::numeric, 3)
    AS vol_weight_kg,
  -- Расчётный вес (физ * 1.12 vs объёмный)
  GREATEST(
    ROUND((c.weight_avg_kg * 1.12)::numeric, 3),
    ROUND((c.length_cm * c.width_cm * c.height_cm / 5000)::numeric, 3)
  ) AS billed_weight_kg,
  -- Размерная формула для проверки EMS/EMS_PREMIUM
  ROUND((c.length_cm + (c.width_cm + c.height_cm) * 2)::numeric, 1)
    AS size_formula_cm,
  c.ship_method,
  c.logistics_notes,
  c.requires_l3,
  -- Уровень в иерархии
  CASE WHEN c.parent_id IS NULL THEN 1
       WHEN EXISTS (SELECT 1 FROM public.parts_categories p WHERE p.id = c.parent_id AND p.parent_id IS NULL) THEN 2
       ELSE 3 END AS level
FROM public.parts_categories c
WHERE c.weight_avg_kg IS NOT NULL;

-- ───────────────────────────────────────────────────────────────────
-- ШАГ 7: ФУНКЦИЯ для получения логистики по product
-- Использование: SELECT * FROM get_product_logistics(12345);
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_product_logistics(p_product_id BIGINT)
RETURNS TABLE (
  product_id      BIGINT,
  category_id     INT,
  category_name   TEXT,
  weight_kg       DECIMAL,
  billed_weight_kg DECIMAL,
  ship_method     TEXT,
  data_source     TEXT   -- 'actual' | 'category_l3' | 'category_l2' | 'unknown'
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pp.id AS product_id,
    -- Категория
    COALESCE(pp.category_id, NULL) AS category_id,
    cat.name_ru AS category_name,
    -- Вес: приоритет — реальный замер, потом норматив категории
    COALESCE(pp.weight_kg, cat.weight_avg_kg) AS weight_kg,
    -- Расчётный вес
    CASE
      WHEN pp.weight_kg IS NOT NULL THEN
        GREATEST(
          ROUND((pp.weight_kg * 1.12)::numeric, 3),
          ROUND((cat.length_cm * cat.width_cm * cat.height_cm / 5000)::numeric, 3)
        )
      ELSE
        GREATEST(
          ROUND((cat.weight_avg_kg * 1.12)::numeric, 3),
          ROUND((cat.length_cm * cat.width_cm * cat.height_cm / 5000)::numeric, 3)
        )
    END AS billed_weight_kg,
    -- Метод доставки
    COALESCE(pp.ship_method, cat.ship_method, 'CLARIFY') AS ship_method,
    -- Источник данных
    CASE
      WHEN pp.weight_kg IS NOT NULL THEN 'actual'
      WHEN cat.id IS NOT NULL AND cat.parent_id > 17999 THEN 'category_l3'
      WHEN cat.id IS NOT NULL THEN 'category_l2'
      ELSE 'unknown'
    END AS data_source
  FROM public.parts_products pp
  LEFT JOIN public.parts_categories cat ON cat.id = pp.category_id
  WHERE pp.id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────
-- ШАГ 8: Индексы для производительности
-- ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_parts_categories_parent ON public.parts_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_parts_categories_ship   ON public.parts_categories(ship_method);
CREATE INDEX IF NOT EXISTS idx_parts_products_category ON public.parts_products(category_id);
CREATE INDEX IF NOT EXISTS idx_parts_products_ship     ON public.parts_products(ship_method);

-- ───────────────────────────────────────────────────────────────────
-- ПРОВЕРКА РЕЗУЛЬТАТА
-- ───────────────────────────────────────────────────────────────────
-- SELECT id, name_ru, weight_avg_kg, billed_weight_kg, ship_method
-- FROM public.v_category_logistics
-- ORDER BY level, id;

-- SELECT ship_method, COUNT(*) FROM public.v_category_logistics GROUP BY ship_method;
