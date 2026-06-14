-- ═══════════════════════════════════════════════════════════════════════
-- ПАТЧ 018: Добавить размеры для L2 категорий без dimensions
--
-- Причина: v_category_logistics вычисляет ship_method из size_formula.
-- Если length_cm/width_cm/height_cm = NULL → size_f = NULL → ELSE 'SEA'.
-- Результат: даже шланг на 0.8кг показывает "Только морем".
-- ═══════════════════════════════════════════════════════════════════════

-- ── Двигатель: новые L2 ──────────────────────────────────────────────
UPDATE parts_categories SET length_cm = 30, width_cm = 25, height_cm = 20
WHERE id = 17710; -- Выхлопная система (avg 6кг — каталитики крупные)

UPDATE parts_categories SET length_cm = 35, width_cm = 30, height_cm = 25
WHERE id = 17711; -- Турбонаддув (avg 6кг)

UPDATE parts_categories SET length_cm = 28, width_cm = 22, height_cm = 20
WHERE id = 17712; -- Стартер и генератор (avg 5кг)

UPDATE parts_categories SET length_cm = 30, width_cm = 25, height_cm = 20
WHERE id = 17713; -- Кондиционер (avg 4кг)

UPDATE parts_categories SET length_cm = 30, width_cm = 6, height_cm = 5
WHERE id = 17714; -- Шланги и патрубки (avg 0.5кг)

UPDATE parts_categories SET length_cm = 20, width_cm = 12, height_cm = 8
WHERE id = 17715; -- Электрика двигателя (avg 0.5кг)

-- ── Салон: новые L2 ──────────────────────────────────────────────────
UPDATE parts_categories SET length_cm = 100, width_cm = 55, height_cm = 8
WHERE id = 18106; -- Двери и компоненты (avg 2.5кг)

UPDATE parts_categories SET length_cm = 14, width_cm = 10, height_cm = 8
WHERE id = 18107; -- Замки и ручки (avg 0.4кг)

UPDATE parts_categories SET length_cm = 40, width_cm = 25, height_cm = 15
WHERE id = 18108; -- Консоль и подлокотники (avg 1.5кг)

UPDATE parts_categories SET length_cm = 35, width_cm = 20, height_cm = 8
WHERE id = 18109; -- Козырьки и потолок (avg 0.8кг)

UPDATE parts_categories SET length_cm = 30, width_cm = 18, height_cm = 12
WHERE id = 18110; -- Зеркала (avg 2.5кг)

UPDATE parts_categories SET length_cm = 30, width_cm = 20, height_cm = 12
WHERE id = 18111; -- Освещение (avg 1.0кг)

UPDATE parts_categories SET length_cm = 45, width_cm = 20, height_cm = 10
WHERE id = 18112; -- Бампер и аксессуары (avg 1.5кг)

UPDATE parts_categories SET length_cm = 60, width_cm = 40, height_cm = 2
WHERE id = 18113; -- Стёкла (avg 5кг)

-- ── Существующие L2 без размеров ─────────────────────────────────────
-- Проверим и зафиксим все категории где dims = NULL но weight есть
UPDATE parts_categories SET length_cm = 12, width_cm = 10, height_cm = 8
WHERE id = 17701 AND length_cm IS NULL; -- Масло и фильтры

UPDATE parts_categories SET length_cm = 20, width_cm = 15, height_cm = 10
WHERE id = 17702 AND length_cm IS NULL; -- Опоры двигателя

UPDATE parts_categories SET length_cm = 20, width_cm = 12, height_cm = 8
WHERE id = 17704 AND length_cm IS NULL; -- Ремни, ролики

UPDATE parts_categories SET length_cm = 10, width_cm = 6, height_cm = 5
WHERE id = 17705 AND length_cm IS NULL; -- Зажигание

UPDATE parts_categories SET length_cm = 8, width_cm = 5, height_cm = 4
WHERE id = 17706 AND length_cm IS NULL; -- Датчики

UPDATE parts_categories SET length_cm = 20, width_cm = 15, height_cm = 10
WHERE id = 17707 AND length_cm IS NULL; -- Топливная система

UPDATE parts_categories SET length_cm = 40, width_cm = 25, height_cm = 15
WHERE id = 17708 AND length_cm IS NULL; -- Впуск и выпуск

UPDATE parts_categories SET length_cm = 10, width_cm = 8, height_cm = 5
WHERE id = 17709 AND length_cm IS NULL; -- Клапаны и уплотнения

UPDATE parts_categories SET length_cm = 20, width_cm = 15, height_cm = 10
WHERE id = 17799 AND length_cm IS NULL; -- Прочее двигатель

UPDATE parts_categories SET length_cm = 120, width_cm = 60, height_cm = 8
WHERE id = 17801 AND length_cm IS NULL; -- АКПП

UPDATE parts_categories SET length_cm = 100, width_cm = 50, height_cm = 8
WHERE id = 17802 AND length_cm IS NULL; -- МКПП

UPDATE parts_categories SET length_cm = 20, width_cm = 15, height_cm = 12
WHERE id = 17803 AND length_cm IS NULL; -- Подушки КПП

UPDATE parts_categories SET length_cm = 30, width_cm = 30, height_cm = 15
WHERE id = 17804 AND length_cm IS NULL; -- Сцепление

UPDATE parts_categories SET length_cm = 25, width_cm = 15, height_cm = 12
WHERE id = 17899 AND length_cm IS NULL; -- Прочее КПП

UPDATE parts_categories SET length_cm = 18, width_cm = 14, height_cm = 10
WHERE id = 17904 AND length_cm IS NULL; -- Ступица

UPDATE parts_categories SET length_cm = 60, width_cm = 12, height_cm = 10
WHERE id = 17905 AND length_cm IS NULL; -- Приводные валы

UPDATE parts_categories SET length_cm = 25, width_cm = 18, height_cm = 12
WHERE id = 17999 AND length_cm IS NULL; -- Прочее шасси

UPDATE parts_categories SET length_cm = 110, width_cm = 25, height_cm = 8
WHERE id = 18002 AND length_cm IS NULL; -- Бамперы

UPDATE parts_categories SET length_cm = 20, width_cm = 15, height_cm = 3
WHERE id = 18006 AND length_cm IS NULL; -- Уплотнители

UPDATE parts_categories SET length_cm = 30, width_cm = 20, height_cm = 12
WHERE id = 18099 AND length_cm IS NULL; -- Прочее кузов

UPDATE parts_categories SET length_cm = 50, width_cm = 40, height_cm = 30
WHERE id = 18101 AND length_cm IS NULL; -- Сиденья

UPDATE parts_categories SET length_cm = 60, width_cm = 40, height_cm = 15
WHERE id = 18102 AND length_cm IS NULL; -- Панель приборов

UPDATE parts_categories SET length_cm = 30, width_cm = 25, height_cm = 20
WHERE id = 18103 AND length_cm IS NULL; -- Климат-контроль

UPDATE parts_categories SET length_cm = 50, width_cm = 30, height_cm = 5
WHERE id = 18104 AND length_cm IS NULL; -- Ковры, обшивка

UPDATE parts_categories SET length_cm = 15, width_cm = 10, height_cm = 6
WHERE id = 18105 AND length_cm IS NULL; -- Электрика салона

UPDATE parts_categories SET length_cm = 25, width_cm = 18, height_cm = 12
WHERE id = 18199 AND length_cm IS NULL; -- Прочее салон
