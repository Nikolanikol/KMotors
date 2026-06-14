-- ═══════════════════════════════════════════════════════════════════════
-- ПАТЧ 021: Рычаги КПП → Консоль (18108)
--
-- Lever-Gear Shift и Lever Complete-Gear Shift (37 шт) — это ручка/рычаг
-- в салоне автомобиля. Вес 0.3–1.5кг.
-- Сейчас получают вес категории 17899 КПП = 4.0кг → неверно.
-- После: вес 18108 Консоль = 1.5кг → корректнее.
--
-- НЕ трогаем: release fork shaft (внутренняя деталь КПП)
-- ═══════════════════════════════════════════════════════════════════════

UPDATE parts_products
SET subcategory_id = 18108
WHERE subcategory_id = 17899
  AND LOWER(name_en) SIMILAR TO '%(lever.*gear.*shift|lever.*gear shift|gear.*shift.*lever|gear lever)%'
  AND LOWER(name_en) NOT SIMILAR TO '%(release fork|fork shaft|clutch fork|fork lever)%';
