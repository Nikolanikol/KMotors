require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  // 1. Новые L3 категории — товаров в каждой
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  1. НОВЫЕ L3 КАТЕГОРИИ — ТОВАРОВ В КАЖДОЙ');
  console.log('══════════════════════════════════════════════════════\n');

  const { rows: newL3 } = await c.query(`
    SELECT c.id, c.name_ru, c.weight_min_kg, c.weight_avg_kg, c.weight_max_kg,
           COUNT(p.id) AS cnt
    FROM parts_categories c
    LEFT JOIN parts_products p ON p.subcategory_id = c.id
    WHERE c.id BETWEEN 900901 AND 901299
    GROUP BY c.id, c.name_ru, c.weight_min_kg, c.weight_avg_kg, c.weight_max_kg
    ORDER BY c.id
  `);
  let totalNew = 0;
  newL3.forEach(r => {
    totalNew += parseInt(r.cnt);
    console.log(`  ${r.id} ${r.name_ru.padEnd(34)} ${String(r.cnt).padStart(5)}шт  ${r.weight_min_kg}–${r.weight_max_kg}кг`);
  });
  console.log(`\n  ИТОГО в новых L3: ${totalNew}`);

  // 2. Все L3 (старые + новые)
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  2. ВСЕ L3 — ПОЛНАЯ КАРТИНА');
  console.log('══════════════════════════════════════════════════════\n');

  const { rows: allL3 } = await c.query(`
    SELECT c.id, c.name_ru, COUNT(p.id) AS cnt
    FROM parts_categories c
    LEFT JOIN parts_products p ON p.subcategory_id = c.id
    WHERE c.id >= 900000
    GROUP BY c.id, c.name_ru
    ORDER BY c.id
  `);
  let totalL3 = 0;
  allL3.forEach(r => {
    totalL3 += parseInt(r.cnt);
    console.log(`  ${r.id} ${r.name_ru.padEnd(34)} ${String(r.cnt).padStart(5)}`);
  });
  console.log(`\n  ИТОГО в L3: ${totalL3}`);

  // 3. Остаток в "Прочее"
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  3. ОСТАТОК В "ПРОЧЕЕ" (L2)');
  console.log('══════════════════════════════════════════════════════\n');

  const { rows: leftover } = await c.query(`
    SELECT p.subcategory_id, cat.name_ru, COUNT(*) AS cnt
    FROM parts_products p
    JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE p.subcategory_id IN (17999, 17899, 18099)
    GROUP BY p.subcategory_id, cat.name_ru
    ORDER BY cnt DESC
  `);
  leftover.forEach(r => {
    console.log(`  [${r.subcategory_id}] ${r.cat_name || r.name_ru} — ${r.cnt} шт`);
  });

  // 4. Spot-check: болт 1129306287K
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  4. SPOT-CHECK: БОЛТ 1129306287K');
  console.log('══════════════════════════════════════════════════════\n');

  const { rows: bolt } = await c.query(`
    SELECT p.part_number, p.name_en, p.price_krw, p.weight_kg, p.subcategory_id,
           cat.name_ru AS cat_name, cat.weight_avg_kg AS cat_weight
    FROM parts_products p
    LEFT JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE p.part_number = '1129306287K'
  `);
  if (bolt.length > 0) {
    const b = bolt[0];
    console.log(`  Part: ${b.part_number} "${b.name_en}"`);
    console.log(`  Price: ₩${b.price_krw}`);
    console.log(`  Category: [${b.subcategory_id}] ${b.cat_name}`);
    console.log(`  weight_kg: ${b.weight_kg}`);
    console.log(`  cat_weight_avg: ${b.cat_weight}`);
    console.log(`  БЫЛО: 1.500кг (Прочее двигатель) → СТАЛО: ${b.weight_kg || b.cat_weight}кг (${b.cat_name})`);
  }

  // 5. Spot-check: random items from each new category
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  5. SPOT-CHECK: ПРИМЕРЫ ИЗ НОВЫХ КАТЕГОРИЙ');
  console.log('══════════════════════════════════════════════════════\n');

  const spotCats = [900901, 900902, 900903, 900904, 901001, 901101, 901102, 901201];
  for (const catId of spotCats) {
    const { rows: catInfo } = await c.query(
      `SELECT name_ru FROM parts_categories WHERE id = $1`, [catId]
    );
    const { rows: items } = await c.query(`
      SELECT name_en, price_krw, weight_kg
      FROM parts_products
      WHERE subcategory_id = $1
      ORDER BY random()
      LIMIT 3
    `, [catId]);
    if (items.length > 0) {
      console.log(`  ── ${catId} ${catInfo[0]?.name_ru} ──`);
      items.forEach(i => {
        console.log(`    ${i.name_en.substring(0, 50).padEnd(51)} ₩${String(i.price_krw).padStart(7)}  ${i.weight_kg || '?'}кг`);
      });
    }
  }

  // 6. Подозрительные: крепёж, который НЕ попал в 900901-900904
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  6. КРЕПЁЖ, КОТОРЫЙ НЕ ПЕРЕНЕСЁН (проверить вручную)');
  console.log('══════════════════════════════════════════════════════\n');

  const { rows: missed } = await c.query(`
    SELECT p.subcategory_id, cat.name_ru AS cat_name, p.name_en, p.price_krw
    FROM parts_products p
    LEFT JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE LOWER(p.name_en) LIKE '%bolt%'
      AND p.subcategory_id NOT BETWEEN 900901 AND 900904
      AND p.subcategory_id IS DISTINCT FROM 900302
    ORDER BY p.price_krw DESC
    LIMIT 15
  `);
  missed.forEach(r => {
    console.log(`  [${r.subcategory_id || 'NULL'}] ${(r.cat_name || 'NULL').padEnd(25)} ${r.name_en.substring(0, 50).padEnd(51)} ₩${r.price_krw}`);
  });

  // 7. Общая статистика weight_kg
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  7. WEIGHT_KG — ДО И ПОСЛЕ');
  console.log('══════════════════════════════════════════════════════\n');

  const { rows: ws } = await c.query(`
    SELECT
      CASE
        WHEN weight_kg IS NULL THEN 'NULL'
        WHEN weight_kg < 0.05 THEN '<50г'
        WHEN weight_kg < 0.3 THEN '50-300г'
        WHEN weight_kg < 1 THEN '300г-1кг'
        WHEN weight_kg < 5 THEN '1-5кг'
        WHEN weight_kg < 15 THEN '5-15кг'
        ELSE '>15кг'
      END AS weight_range,
      COUNT(*) AS cnt
    FROM parts_products
    GROUP BY 1
    ORDER BY MIN(COALESCE(weight_kg, -1))
  `);
  console.log('  БЫЛО: NULL=43445, заполнено=5244 (10.8%)');
  console.log('  СТАЛО:');
  let totalFilled = 0;
  ws.forEach(r => {
    if (r.weight_range !== 'NULL') totalFilled += parseInt(r.cnt);
    console.log(`    ${r.weight_range.padEnd(10)} ${String(r.cnt).padStart(6)}`);
  });
  console.log(`  Заполнено: ${totalFilled} / 48689 (${((totalFilled / 48689) * 100).toFixed(1)}%)`);

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
