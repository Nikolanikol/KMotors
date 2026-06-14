-- ═══════════════════════════════════════════════════════════════════════
-- ПАТЧ 023: Рассортировка staging 900999 по типам
--
-- Порядок: от самого конкретного к общему.
-- Остаток в 900999 — generic "Spare", "Pad", "Holder" без ключевых слов.
-- Вес в 900999 = 0.05кг — уже правильный для всех.
-- ═══════════════════════════════════════════════════════════════════════


-- ── 1. Garnish/молдинги → Прочее кузов (18099) ──────────────────────
UPDATE parts_products SET subcategory_id = 18099
WHERE subcategory_id = 900999
  AND LOWER(name_en) SIMILAR TO '%(garnish|garish|moulding|molding|trim)%';


-- ── 2. Фурнитура запасного колеса → Прочее шасси (17999) ────────────
UPDATE parts_products SET subcategory_id = 17999
WHERE subcategory_id = 900999
  AND LOWER(name_en) SIMILAR TO '%(spare tire|spare wheel|spare tyre)%';


-- ── 3. Шайбы, резьба, кольца, пружины, болты → Крепёж (900904) ──────
UPDATE parts_products SET subcategory_id = 900904
WHERE subcategory_id = 900999
  AND LOWER(name_en) SIMILAR TO
    '%(washa|washer|shim|thread|ring snap|snap ring|circlip|spring|' ||
    'nipple|bolt|bold|nut|screw|rivet|pin|stopper|clamp)%';


-- ── 4. Резиновые изоляторы, втулки, creep → Крепёж (900904) ─────────
UPDATE parts_products SET subcategory_id = 900904
WHERE subcategory_id = 900999
  AND LOWER(name_en) SIMILAR TO
    '%(creep|bush|bushing|grommet|rubber|insulator|cushion|damper|' ||
    'sil|silicone|color insulator|vibration)%';


-- ── 5. Заглушки и крышки мелкие → Крышки мелкие (900910) ────────────
UPDATE parts_products SET subcategory_id = 900910
WHERE subcategory_id = 900999
  AND LOWER(name_en) SIMILAR TO
    '%(cap|plug|blind|cover|boot|skirt|bellows|dust seal)%';


-- ── 6. Держатели и направляющие → Кронштейны мелкие (900909) ─────────
UPDATE parts_products SET subcategory_id = 900909
WHERE subcategory_id = 900999
  AND LOWER(name_en) SIMILAR TO
    '%(holder|guide|load guide|bracket|clip|retainer)%';


-- ── 7. Прокладки и уплотнения → Крепёж (900904) ─────────────────────
UPDATE parts_products SET subcategory_id = 900904
WHERE subcategory_id = 900999
  AND LOWER(name_en) SIMILAR TO
    '%(gasket|seal|sealing|pad sealing|o.ring|o ring)%';
