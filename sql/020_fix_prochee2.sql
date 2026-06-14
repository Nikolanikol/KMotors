-- ═══════════════════════════════════════════════════════════════════════
-- ПАТЧ 020: Второй проход Прочее — доочистка оставшихся групп
-- ═══════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  [17799] ПРОЧЕЕ ДВИГАТЕЛЬ                                           ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- 1. Clamp → Крепёж (900904) — все хомуты/зажимы, avg ₩3447
UPDATE parts_products SET subcategory_id = 900904
WHERE subcategory_id = 17799
  AND LOWER(name_en) SIMILAR TO '%(clamp|hose clamp|pipe clamp|band clamp|spring clamp)%';

-- 2. Glow plugs → Зажигание (17705)
UPDATE parts_products SET subcategory_id = 17705
WHERE subcategory_id = 17799
  AND LOWER(name_en) SIMILAR TO '%(glow plug|spark plug|ignition plug)%';

-- 3. Duct → Впуск и выпуск (17708) — воздуховоды
UPDATE parts_products SET subcategory_id = 17708
WHERE subcategory_id = 17799
  AND LOWER(name_en) SIMILAR TO '%(duct|air duct|intake duct|breather duct)%'
  AND LOWER(name_en) NOT SIMILAR TO '%(a/c duct|hvac duct|cabin duct|dashboard duct|instrument duct)%';

-- 4. Cap дешёвые → Крышки мелкие (900910) — крышечки < ₩15k
UPDATE parts_products SET subcategory_id = 900910
WHERE subcategory_id = 17799
  AND LOWER(name_en) SIMILAR TO '%(^cap|filler cap|drain cap|dust cap|valve cap|oil cap|radiator cap)%'
  AND price_krw < 15000;

-- 5. Guard/Protector дешёвые → Крышки мелкие (900910) — щитки < ₩20k
UPDATE parts_products SET subcategory_id = 900910
WHERE subcategory_id = 17799
  AND LOWER(name_en) SIMILAR TO '%(heat shield|heat guard|heat protector|heat insulator|heat shield)%'
  AND price_krw < 20000;

-- 6. Blower motor → Кондиционер (17713)
UPDATE parts_products SET subcategory_id = 17713
WHERE subcategory_id = 17799
  AND LOWER(name_en) SIMILAR TO '%(blower motor|blower fan|heater blower|hvac blower)%';


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  [17999] ПРОЧЕЕ ШАССИ                                               ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- 7. Wheels (generic) → Колёсные диски (900913) — цена > ₩50k = реальный диск
UPDATE parts_products SET subcategory_id = 900913
WHERE subcategory_id = 17999
  AND LOWER(name_en) SIMILAR TO '%(^wheels?$|^wheels? \()%'
  AND price_krw > 50000;

-- 8. TPMS → Датчики и актуаторы (900905)
UPDATE parts_products SET subcategory_id = 900905
WHERE subcategory_id = 17999
  AND LOWER(name_en) SIMILAR TO '%(tpms|tire pressure|tyre pressure|valve stem sensor)%';

-- 9. Boot дешёвые → Приводные валы (17905) — пыльники < ₩10k
UPDATE parts_products SET subcategory_id = 17905
WHERE subcategory_id = 17999
  AND LOWER(name_en) SIMILAR TO '%(^boot|cv boot|axle boot|joint boot|drive.*boot)%'
  AND price_krw < 10000;

-- 10. Bumper rubber / stopper → Крепёж (900904) — мелкие резинки
UPDATE parts_products SET subcategory_id = 900904
WHERE subcategory_id = 17999
  AND LOWER(name_en) SIMILAR TO '%(bumper rubber|rubber bumper|bump stop|rubber stopper|rubber stop|stopper rubber)%'
  AND price_krw < 15000;

-- 11. Dynamic damper / vibration damper мелкие → Крепёж (900904)
UPDATE parts_products SET subcategory_id = 900904
WHERE subcategory_id = 17999
  AND LOWER(name_en) SIMILAR TO '%(dynamic damper|vibration damper|anti.*vibration)%'
  AND price_krw < 20000;


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  [17899] ПРОЧЕЕ КПП                                                 ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- 12. Gear shift knob (все оставшиеся) → Консоль (18108)
--     Используем ILIKE — надёжнее SIMILAR TO для этого паттерна
UPDATE parts_products SET subcategory_id = 18108
WHERE subcategory_id = 17899
  AND LOWER(name_en) LIKE '%knob%';

-- 13. Button → Переключатели (900907)
UPDATE parts_products SET subcategory_id = 900907
WHERE subcategory_id = 17899
  AND LOWER(name_en) SIMILAR TO '%(button|push button|release button|selector button)%';

-- 14. Saft (полуоси) → Приводные валы (17905)
--     Берём только если есть позиционный маркер front/rear/left/right
UPDATE parts_products SET subcategory_id = 17905
WHERE subcategory_id = 17899
  AND LOWER(name_en) SIMILAR TO '%saft%'
  AND LOWER(name_en) SIMILAR TO '%(front|rear|left|right|lh|rh|lf|rf|lr|rr)%';


-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║  [18199] ПРОЧЕЕ САЛОН                                               ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- 15. Bracket дешёвые → Кронштейны мелкие (900909) — avg ₩7799, < ₩20k
UPDATE parts_products SET subcategory_id = 900909
WHERE subcategory_id = 18199
  AND LOWER(name_en) SIMILAR TO '%(bracket|mounting bracket|support bracket)%'
  AND price_krw < 20000;

-- 16. Cap очень дешёвые → Крышки мелкие (900910) — avg ₩2161, < ₩5k
UPDATE parts_products SET subcategory_id = 900910
WHERE subcategory_id = 18199
  AND LOWER(name_en) SIMILAR TO '%(^cap|tow hook.*cap|hole cap|plug cap|end cap)%'
  AND price_krw < 8000;

-- 17. Cover дешёвые → Крышки мелкие (900910) — < ₩12k
UPDATE parts_products SET subcategory_id = 900910
WHERE subcategory_id = 18199
  AND LOWER(name_en) SIMILAR TO '%(cover)%'
  AND price_krw < 12000
  AND LOWER(name_en) NOT SIMILAR TO '%(seat cover|steering cover|door cover|panel cover|engine cover|cargo cover)%';

-- 18. Knob дешёвые → Переключатели (900907) — ручки/крутилки, avg ₩3549
UPDATE parts_products SET subcategory_id = 900907
WHERE subcategory_id = 18199
  AND LOWER(name_en) LIKE '%knob%'
  AND price_krw < 15000;

-- 19. Duct салон → Климат (18103) — воздуховоды салона
UPDATE parts_products SET subcategory_id = 18103
WHERE subcategory_id = 18199
  AND LOWER(name_en) SIMILAR TO '%(a/c duct|hvac duct|ventilation duct|cabin duct|air vent duct|instrument duct|register duct|side duct|center duct)%';
