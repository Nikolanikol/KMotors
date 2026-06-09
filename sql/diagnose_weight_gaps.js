require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  // 1. Общая картина
  console.log('══════════════════════════════════════════════════════');
  console.log('  1. ОБЩАЯ КАРТИНА weight_kg');
  console.log('══════════════════════════════════════════════════════\n');

  const { rows: overview } = await c.query(`
    SELECT
      CASE
        WHEN subcategory_id IS NULL THEN 'A) NULL subcategory'
        WHEN subcategory_id >= 900000 AND weight_kg IS NOT NULL THEN 'B) L3 + weight_kg ✓'
        WHEN subcategory_id >= 900000 AND weight_kg IS NULL THEN 'C) L3 но БЕЗ weight_kg'
        WHEN subcategory_id < 900000 THEN 'D) L2 (нет L3 = нет weight)'
      END AS status,
      COUNT(*) AS cnt
    FROM parts_products
    GROUP BY 1
    ORDER BY 1
  `);
  overview.forEach(r => console.log(`  ${r.status.padEnd(35)} ${String(r.cnt).padStart(6)}`));

  // 2. Случай C: L3 но без weight — почему?
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  2. L3 БЕЗ weight_kg — ПОЧЕМУ?');
  console.log('══════════════════════════════════════════════════════\n');

  const { rows: l3noWeight } = await c.query(`
    SELECT p.subcategory_id, cat.name_ru, COUNT(*) AS cnt,
           cat.weight_min_kg, cat.weight_max_kg,
           MIN(p.price_krw) AS min_price, MAX(p.price_krw) AS max_price,
           COUNT(*) FILTER (WHERE p.price_krw = 0 OR p.price_krw IS NULL) AS zero_price
    FROM parts_products p
    JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE p.subcategory_id >= 900000
      AND p.weight_kg IS NULL
    GROUP BY p.subcategory_id, cat.name_ru, cat.weight_min_kg, cat.weight_max_kg
    ORDER BY cnt DESC
  `);
  if (l3noWeight.length === 0) {
    console.log('  Нет таких! Все L3 товары имеют weight_kg.');
  } else {
    l3noWeight.forEach(r => {
      console.log(`  [${r.subcategory_id}] ${r.name_ru.padEnd(30)} ${r.cnt} шт  price:₩${r.min_price}–₩${r.max_price}  zero_price:${r.zero_price}  cat_weight:${r.weight_min_kg}–${r.weight_max_kg}`);
    });
  }

  // 3. Случай D: L2 без L3 — разбивка по категориям
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  3. L2 ТОВАРЫ БЕЗ L3 — РАЗБИВКА');
  console.log('══════════════════════════════════════════════════════\n');

  const { rows: l2left } = await c.query(`
    SELECT p.subcategory_id, cat.name_ru, cat.name_en,
           cat.weight_avg_kg AS fallback_weight,
           COUNT(*) AS cnt,
           ROUND(AVG(p.price_krw)) AS avg_price
    FROM parts_products p
    JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE p.subcategory_id < 900000
    GROUP BY p.subcategory_id, cat.name_ru, cat.name_en, cat.weight_avg_kg
    ORDER BY cnt DESC
  `);
  let totalL2 = 0;
  l2left.forEach(r => {
    totalL2 += parseInt(r.cnt);
    console.log(`  [${r.subcategory_id}] ${r.name_ru.padEnd(28)} ${String(r.cnt).padStart(5)} шт  fallback=${r.fallback_weight || 'NULL'}кг  avg₩${r.avg_price}`);
  });
  console.log(`\n  ИТОГО L2: ${totalL2}`);

  // 4. Случай A: NULL subcategory — что фронтенд делает?
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  4. NULL SUBCATEGORY — ЧТО ПОЛУЧАЕТ КЛИЕНТ?');
  console.log('══════════════════════════════════════════════════════\n');

  const { rows: nullInfo } = await c.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE category_id IS NOT NULL) AS has_category,
      COUNT(*) FILTER (WHERE category_id IS NULL) AS no_category
    FROM parts_products
    WHERE subcategory_id IS NULL
  `);
  const ni = nullInfo[0];
  console.log(`  Всего NULL subcategory: ${ni.total}`);
  console.log(`  Из них с category_id: ${ni.has_category}`);
  console.log(`  Без category_id: ${ni.no_category}`);

  // Какие category_id у NULL subcategory
  const { rows: nullCats } = await c.query(`
    SELECT p.category_id, cat.name_ru, cat.name_en, COUNT(*) AS cnt
    FROM parts_products p
    LEFT JOIN parts_categories cat ON cat.id = p.category_id
    WHERE p.subcategory_id IS NULL
    GROUP BY p.category_id, cat.name_ru, cat.name_en
    ORDER BY cnt DESC
    LIMIT 15
  `);
  console.log('\n  Топ category_id:');
  nullCats.forEach(r => {
    console.log(`    [${r.category_id || 'NULL'}] ${(r.name_ru || 'NULL').padEnd(25)} ${String(r.cnt).padStart(6)}`);
  });

  // 5. Остаток в "Прочее" — keyword sample
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  5. ОСТАТОК В "ПРОЧЕЕ" — ТОП КЛЮЧЕВЫЕ СЛОВА');
  console.log('══════════════════════════════════════════════════════\n');

  for (const catId of [17999, 17899, 18099]) {
    const { rows: kw } = await c.query(`
      SELECT word, COUNT(*) AS cnt
      FROM (
        SELECT LOWER(unnest(string_to_array(
          regexp_replace(name_en, '[^a-zA-Z ]', ' ', 'g'), ' '
        ))) AS word
        FROM parts_products WHERE subcategory_id = $1
      ) w
      WHERE length(word) > 2
        AND word NOT IN ('assy','the','and','for','set','lh','rh','sub','with','front','rear','upper','lower','left','right','side')
      GROUP BY word ORDER BY cnt DESC LIMIT 15
    `, [catId]);
    const { rows: catName } = await c.query(`SELECT name_ru FROM parts_categories WHERE id = $1`, [catId]);
    console.log(`  ── [${catId}] ${catName[0]?.name_ru} (остаток) ──`);
    kw.forEach(k => console.log(`    ${k.word.padEnd(18)} ${String(k.cnt).padStart(4)}`));
    console.log('');
  }

  // 6. Фронтенд fallback chain
  console.log('══════════════════════════════════════════════════════');
  console.log('  6. ФРОНТЕНД — КАК РАБОТАЕТ FALLBACK СЕЙЧАС');
  console.log('══════════════════════════════════════════════════════\n');
  console.log('  weight = product.weight_kg ?? catLogistics.weight_avg_kg');
  console.log('');
  console.log('  Если product.weight_kg заполнен → точный per-product вес');
  console.log('  Если NULL → fallback на subcategory.weight_avg_kg');
  console.log('  Если subcategory NULL → ???  (нет fallback = нет доставки?)');
  console.log('');

  // Проверим что происходит для NULL subcategory на фронте
  const { rows: sample } = await c.query(`
    SELECT p.id, p.part_number, p.name_en, p.price_krw, p.weight_kg,
           p.subcategory_id, p.category_id
    FROM parts_products p
    WHERE p.subcategory_id IS NULL
    ORDER BY random() LIMIT 5
  `);
  console.log('  Примеры товаров без subcategory:');
  sample.forEach(r => {
    console.log(`    ${r.part_number} "${r.name_en}" — weight_kg=${r.weight_kg}, subcat=${r.subcategory_id}, cat=${r.category_id}`);
  });

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
