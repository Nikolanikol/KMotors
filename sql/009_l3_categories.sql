-- ═══════════════════════════════════════════════════════════════════
-- ПАТЧ 009: L3 подкатегории для широких L2 категорий
--
-- Проблема: L2 категории используют средний вес по всей категории,
-- что даёт неточную оценку доставки для конкретных деталей.
-- Например: Система охлаждения weight_avg=4кг, но термостат ~0.25кг.
--
-- Добавляем L3 для:
--   17703 — Система охлаждения      (900401–900407)
--   18005 — Освещение               (900501–900507)
--   17903 — Рулевое управление      (900601–900606)
--   18001 — Кузовные панели         (900701–900705)
--   18003 — Остекление              (900801–900804)
-- ═══════════════════════════════════════════════════════════════════

-- Пометить L2 как требующие L3 (если ещё не помечены)
UPDATE public.parts_categories
SET requires_l3 = TRUE
WHERE id IN (17703, 18005, 17903, 18001, 18003);

-- ── L3: 17703 Система охлаждения ─────────────────────────────────
INSERT INTO public.parts_categories
  (id, parent_id, name_ru, name_en, name_ko, slug,
   sort_order, weight_avg_kg, weight_min_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  (900401, 17703, 'Термостат',              'Thermostat',            '서모스탯',        'thermostat',            1, 0.250, 0.150, 0.400,  10,  8,  6, 'EMS', ''),
  (900402, 17703, 'Радиатор охлаждения',    'Cooling Radiator',      '라디에이터',      'radiator-cooling',      2, 6.000, 3.500, 9.000,  65, 45,  4, 'EMS_PREMIUM', 'Плоская деталь, vol=65*45*4/6000=1.95кг, billed по packed'),
  (900403, 17703, 'Водяной насос',          'Water Pump',            '워터 펌프',        'water-pump',            3, 1.500, 0.800, 2.500,  18, 16, 14, 'EMS', ''),
  (900404, 17703, 'Вентилятор охлаждения',  'Cooling Fan',           '냉각 팬',          'cooling-fan',           4, 2.000, 1.000, 4.000,  48, 48, 10, 'EMS', 'vol=48*48*10/6000=3.84кг'),
  (900405, 17703, 'Расширительный бачок',   'Coolant Reservoir',     '냉각수 탱크',      'coolant-reservoir',     5, 0.600, 0.350, 1.200,  22, 16, 14, 'EMS', ''),
  (900406, 17703, 'Патрубок охлаждения',    'Coolant Hose',          '냉각 호스',        'coolant-hose',          6, 0.300, 0.100, 0.600,  40,  8,  6, 'EMS', ''),
  (900407, 17703, 'Крышка радиатора',       'Radiator Cap',          '라디에이터 캡',    'radiator-cap',          7, 0.150, 0.080, 0.250,   8,  8,  5, 'EMS', '')
ON CONFLICT (id) DO NOTHING;

-- ── L3: 18005 Освещение ───────────────────────────────────────────
INSERT INTO public.parts_categories
  (id, parent_id, name_ru, name_en, name_ko, slug,
   sort_order, weight_avg_kg, weight_min_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  (900501, 18005, 'Фара передняя',          'Headlight Assembly',    '헤드라이트',      'headlight',             1, 3.500, 2.000, 5.500,  55, 34, 28, 'EMS', 'ХРУПКОЕ. vol=55*34*28/6000=8.73кг, billed=packed=3.975кг'),
  (900502, 18005, 'Фонарь задний',          'Tail Light Assembly',   '테일 라이트',     'taillight',             2, 2.000, 1.000, 3.500,  44, 28, 20, 'EMS', 'ХРУПКОЕ'),
  (900503, 18005, 'Противотуманная фара',   'Fog Light',             '안개등',           'fog-light',             3, 0.600, 0.300, 1.200,  22, 16, 10, 'EMS', ''),
  (900504, 18005, 'Лампа (1 шт)',           'Bulb',                  '전구',             'bulb',                  4, 0.080, 0.030, 0.200,  12,  5,  5, 'EMS', ''),
  (900505, 18005, 'Блок управления светом', 'Lighting Control Unit', '라이트 컨트롤',   'light-control-unit',    5, 0.400, 0.200, 0.800,  16, 12,  6, 'EMS', ''),
  (900506, 18005, 'Указатель поворота',     'Turn Signal Light',     '방향 지시등',     'turn-signal',           6, 0.500, 0.200, 1.000,  20, 14,  8, 'EMS', ''),
  (900507, 18005, 'Подсветка номерного знака', 'License Plate Light','번호판 등',        'license-plate-light',   7, 0.120, 0.060, 0.250,  12,  6,  4, 'EMS', '')
ON CONFLICT (id) DO NOTHING;

-- ── L3: 17903 Рулевое управление ─────────────────────────────────
INSERT INTO public.parts_categories
  (id, parent_id, name_ru, name_en, name_ko, slug,
   sort_order, weight_avg_kg, weight_min_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  (900601, 17903, 'Рулевая рейка',          'Steering Rack',         '스티어링 랙',     'steering-rack',         1, 8.000, 5.000,14.000,  85, 12, 12, 'EMS_PREMIUM', 'Длинная деталь. size=85+(12+12)*2=133см'),
  (900602, 17903, 'Наконечник рулевой тяги','Tie Rod End',           '타이로드 엔드',   'tie-rod-end',           2, 0.500, 0.300, 0.900,  22,  6,  6, 'EMS', ''),
  (900603, 17903, 'Рулевая тяга',           'Tie Rod',               '타이로드',         'tie-rod',               3, 1.200, 0.700, 2.000,  42,  6,  6, 'EMS', ''),
  (900604, 17903, 'Насос ГУР',              'Power Steering Pump',   '파워 스티어링 펌프','power-steering-pump',  4, 3.500, 2.000, 5.500,  22, 20, 18, 'EMS', ''),
  (900605, 17903, 'Рулевая колонка',        'Steering Column',       '스티어링 컬럼',   'steering-column',       5, 4.000, 2.500, 6.000,  80, 12, 12, 'EMS', 'size=80+(12+12)*2=128см'),
  (900606, 17903, 'Рулевое колесо',         'Steering Wheel',        '스티어링 휠',     'steering-wheel',        6, 1.800, 1.000, 3.000,  38, 38,  8, 'EMS', 'vol=38*38*8/6000=1.93кг')
ON CONFLICT (id) DO NOTHING;

-- ── L3: 18001 Кузовные панели ────────────────────────────────────
INSERT INTO public.parts_categories
  (id, parent_id, name_ru, name_en, name_ko, slug,
   sort_order, weight_avg_kg, weight_min_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  (900701, 18001, 'Крыло переднее',         'Front Fender',          '앞 펜더',          'fender-front',          1, 5.000, 3.000, 8.000, 110, 55,  8, 'EMS_PREMIUM', 'vol=110*55*8/6000=8.07кг'),
  (900702, 18001, 'Дверь в сборе',          'Door Assembly',         '도어 어셈블리',   'door-assembly',         2,12.000, 8.000,18.000, 130, 85, 12, 'EMS_PREMIUM', 'vol=130*85*12/6000=22.1кг, billed=GREATEST(packed,vol)'),
  (900703, 18001, 'Капот',                  'Hood',                  '후드',             'hood',                  3, 8.000, 5.000,14.000, 160, 90,  6, 'EMS_PREMIUM', 'vol=160*90*6/6000=14.4кг'),
  (900704, 18001, 'Крышка багажника',       'Trunk Lid',             '트렁크 리드',     'trunk-lid',             4, 7.000, 4.000,12.000, 145, 90,  5, 'EMS_PREMIUM', 'vol=145*90*5/6000=10.9кг'),
  (900705, 18001, 'Порог (1 шт)',           'Rocker Panel',          '사이드 실',        'rocker-panel',          5, 3.500, 2.000, 6.000, 150, 14,  8, 'EMS_PREMIUM', 'size=150+(14+8)*2=194см')
ON CONFLICT (id) DO NOTHING;

-- ── L3: 18003 Остекление ─────────────────────────────────────────
INSERT INTO public.parts_categories
  (id, parent_id, name_ru, name_en, name_ko, slug,
   sort_order, weight_avg_kg, weight_min_kg, weight_max_kg,
   length_cm, width_cm, height_cm, ship_method, logistics_notes)
VALUES
  (900801, 18003, 'Лобовое стекло',         'Windshield',            '앞 유리',          'windshield',            1,18.000,12.000,25.000, 140, 70,  1, 'EMS_PREMIUM', 'ХРУПКОЕ. vol=140*70*1/6000=1.6кг, но реальный вес >30кг → SEA при weight_avg>30'),
  (900802, 18003, 'Стекло заднее',          'Rear Window',           '뒤 유리',          'rear-window',           2,10.000, 6.000,16.000, 130, 65,  1, 'EMS_PREMIUM', 'ХРУПКОЕ'),
  (900803, 18003, 'Стекло боковое (1 шт)',  'Side Window Glass',     '사이드 유리',     'side-window',           3, 3.500, 1.500, 6.000,  80, 45,  1, 'EMS', 'ХРУПКОЕ. vol=80*45*1/6000=0.6кг'),
  (900804, 18003, 'Форточка (1 шт)',        'Vent Window',           '삼각 유리',        'vent-window',           4, 1.500, 0.800, 3.000,  35, 25,  1, 'EMS', 'ХРУПКОЕ')
ON CONFLICT (id) DO NOTHING;

-- ── Проверка после применения ─────────────────────────────────────
-- SELECT id, parent_id, name_ru, weight_avg_kg, ship_method
-- FROM parts_categories
-- WHERE id BETWEEN 900401 AND 900899
-- ORDER BY id;
