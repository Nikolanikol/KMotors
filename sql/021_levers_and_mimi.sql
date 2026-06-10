-- ═══════════════════════════════════════════════════════════════════════
-- ПАТЧ 021: Рычаги КПП → Консоль + Mimi сборки → Опоры двигателя
--
-- 1. Lever-Gear Shift (37 шт) из 17899 → 18108 (Консоль)
--    Вес: 4.0кг → 1.5кг
--
-- 2. Engine/Transmission Mimi (88 шт) из 17799 → 17702 (Опоры двигателя)
--    "Mimi" = опора двигателя/КПП (engine/transmission mount).
--    Вес: 1.5кг → 3.5кг (точнее для комплектов 3-4 штуки)
--
-- 3. Mimi из 900909 → 17702 (случайно попали через паттерн "bracket")
-- ═══════════════════════════════════════════════════════════════════════


-- ── 1. Рычаги КПП → Консоль (18108) ────────────────────────────────
UPDATE parts_products
SET subcategory_id = 18108
WHERE subcategory_id = 17899
  AND LOWER(name_en) SIMILAR TO
    '%(lever.*gear|gear.*lever|gear shift lever|lever.*gear shift|gear.*shift.*lever)%'
  AND LOWER(name_en) NOT SIMILAR TO
    '%(release fork|fork shaft|clutch fork|fork lever|selector fork)%';


-- ── 2. Mimi из Прочее двигатель → Опоры двигателя и КПП (17702) ─────
UPDATE parts_products
SET subcategory_id = 17702
WHERE subcategory_id = 17799
  AND LOWER(name_en) LIKE '%mimi%';


-- ── 3. Mimi из Кронштейны мелкие → Опоры двигателя и КПП (17702) ────
--    Эти 13 шт попали туда случайно через паттерн "bracket" в патче 020
UPDATE parts_products
SET subcategory_id = 17702
WHERE subcategory_id = 900909
  AND LOWER(name_en) LIKE '%mimi%';
