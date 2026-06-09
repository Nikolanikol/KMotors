require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  // 1. Полная карта L2 категорий с количеством товаров
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('  1. ВСЕ L2 КАТЕГОРИИ С ТОВАРАМИ (не L3)');
  console.log('════════════════════════════════════════════════════════════\n');

  const { rows: l2cats } = await c.query(`
    SELECT
      p.subcategory_id,
      cat.name_ru AS cat_name,
      cat.name_en AS cat_name_en,
      cat.weight_avg_kg,
      COUNT(*) AS cnt,
      ROUND(AVG(p.price_krw)) AS avg_price,
      MIN(p.price_krw) AS min_price,
      MAX(p.price_krw) AS max_price
    FROM parts_products p
    JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE p.subcategory_id < 900000
      AND p.subcategory_id IS NOT NULL
    GROUP BY p.subcategory_id, cat.name_ru, cat.name_en, cat.weight_avg_kg
    ORDER BY cnt DESC
  `);
  l2cats.forEach(r => {
    console.log(`  [${r.subcategory_id}] ${r.cat_name} (${r.cat_name_en}) — ${r.cnt} шт, avg₩${r.avg_price}, weight=${r.weight_avg_kg}кг`);
  });

  // 2. Для каждой крупной L2 — топ-20 name_en паттернов
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('  2. ТИПЫ ТОВАРОВ В КРУПНЫХ L2 (keyword breakdown)');
  console.log('════════════════════════════════════════════════════════════\n');

  const bigL2 = l2cats.filter(r => parseInt(r.cnt) >= 10);
  for (const cat of bigL2) {
    console.log(`\n── [${cat.subcategory_id}] ${cat.cat_name} (${cat.cnt} шт) ──`);

    const { rows: keywords } = await c.query(`
      SELECT
        word,
        COUNT(*) AS cnt,
        ROUND(AVG(price_krw)) AS avg_price
      FROM (
        SELECT
          p.price_krw,
          LOWER(unnest(string_to_array(
            regexp_replace(p.name_en, '[^a-zA-Z ]', ' ', 'g'),
            ' '
          ))) AS word
        FROM parts_products p
        WHERE p.subcategory_id = $1
      ) words
      WHERE length(word) > 2
        AND word NOT IN ('assy','the','and','for','set','lh','rh','sub','with','front','rear','upper','lower','left','right')
      GROUP BY word
      ORDER BY cnt DESC
      LIMIT 25
    `, [cat.subcategory_id]);
    keywords.forEach(k => console.log(`    ${k.word.padEnd(20)} ${String(k.cnt).padStart(4)}  avg₩${k.avg_price}`));
  }

  // 3. Крепёж и мелочь: поиск по всему каталогу
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('  3. КРЕПЁЖ/МЕЛОЧЬ ПО ВСЕМУ КАТАЛОГУ (bolt/nut/screw/washer/clip/pin/gasket/seal/o-ring)');
  console.log('════════════════════════════════════════════════════════════\n');

  const { rows: fasteners } = await c.query(`
    SELECT
      COALESCE(cat.name_ru, 'NULL') AS cat_name,
      p.subcategory_id,
      COUNT(*) AS cnt,
      ROUND(AVG(p.price_krw)) AS avg_price,
      MIN(p.price_krw) AS min_price,
      MAX(p.price_krw) AS max_price
    FROM parts_products p
    LEFT JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE p.name_en ~* '\m(bolt|screw|nut|stud|washer|clip|pin|rivet|gasket|seal|o-ring|grommet|plug|cap nut|spring pin|dowel)\M'
    GROUP BY cat.name_ru, p.subcategory_id
    ORDER BY cnt DESC
  `);
  let totalFasteners = 0;
  fasteners.forEach(r => {
    totalFasteners += parseInt(r.cnt);
    console.log(`  [${r.subcategory_id || 'NULL'}] ${r.cat_name.padEnd(30)} ${String(r.cnt).padStart(5)} шт  avg₩${r.avg_price}  (₩${r.min_price}–₩${r.max_price})`);
  });
  console.log(`\n  ИТОГО КРЕПЁЖ: ${totalFasteners} шт`);

  // 4. Прокладки/уплотнения — тоже мелочь с неправильным весом
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('  4. ПРОКЛАДКИ/УПЛОТНЕНИЯ ПО ВСЕМУ КАТАЛОГУ');
  console.log('════════════════════════════════════════════════════════════\n');

  const { rows: seals } = await c.query(`
    SELECT
      COALESCE(cat.name_ru, 'NULL') AS cat_name,
      p.subcategory_id,
      COUNT(*) AS cnt,
      ROUND(AVG(p.price_krw)) AS avg_price
    FROM parts_products p
    LEFT JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE p.name_en ~* '\m(gasket|packing|seal ring|oil seal|valve stem seal)\M'
      AND p.name_en !~* '\m(bolt|screw|nut)\M'
    GROUP BY cat.name_ru, p.subcategory_id
    ORDER BY cnt DESC
  `);
  seals.forEach(r => {
    console.log(`  [${r.subcategory_id || 'NULL'}] ${r.cat_name.padEnd(30)} ${String(r.cnt).padStart(5)} шт  avg₩${r.avg_price}`);
  });

  // 5. Ремни/цепи ГРМ — тоже часто в "Прочее двигатель"
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('  5. РЕМНИ/ЦЕПИ/ФИЛЬТРЫ В "ПРОЧЕЕ"');
  console.log('════════════════════════════════════════════════════════════\n');

  const { rows: belts } = await c.query(`
    SELECT
      COALESCE(cat.name_ru, 'NULL') AS cat_name,
      p.subcategory_id,
      p.name_en,
      p.price_krw
    FROM parts_products p
    LEFT JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE p.subcategory_id IN (17999, 17899, 17799)
      AND p.name_en ~* '\m(belt|chain|filter|pump|sensor|switch|relay|motor|actuator|compressor|condenser|evaporator|hose|pipe|tube|cable|wire|harness)\M'
    ORDER BY p.subcategory_id, p.name_en
    LIMIT 80
  `);
  belts.forEach(r => {
    console.log(`  [${r.subcategory_id}] ${r.cat_name.padEnd(20)} ${r.name_en.padEnd(55)} ₩${r.price_krw}`);
  });

  // 6. Товары с subcategory_id = NULL — сколько и что
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('  6. ТОВАРЫ БЕЗ SUBCATEGORY (NULL) — keyword breakdown');
  console.log('════════════════════════════════════════════════════════════\n');

  const { rows: nullKw } = await c.query(`
    SELECT
      word,
      COUNT(*) AS cnt,
      ROUND(AVG(price_krw)) AS avg_price
    FROM (
      SELECT
        p.price_krw,
        LOWER(unnest(string_to_array(
          regexp_replace(p.name_en, '[^a-zA-Z ]', ' ', 'g'),
          ' '
        ))) AS word
      FROM parts_products p
      WHERE p.subcategory_id IS NULL
    ) words
    WHERE length(word) > 2
      AND word NOT IN ('assy','the','and','for','set','lh','rh','sub','with')
    GROUP BY word
    ORDER BY cnt DESC
    LIMIT 40
  `);
  nullKw.forEach(k => console.log(`    ${k.word.padEnd(20)} ${String(k.cnt).padStart(5)}  avg₩${k.avg_price}`));

  // 7. Текущее распределение weight_kg — сколько заполнено / NULL / подозрительно
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('  7. WEIGHT_KG — ОБЩЕЕ СОСТОЯНИЕ');
  console.log('════════════════════════════════════════════════════════════\n');

  const { rows: weightStats } = await c.query(`
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
    ORDER BY
      CASE
        WHEN weight_kg IS NULL THEN 0
        WHEN weight_kg < 0.05 THEN 1
        WHEN weight_kg < 0.3 THEN 2
        WHEN weight_kg < 1 THEN 3
        WHEN weight_kg < 5 THEN 4
        WHEN weight_kg < 15 THEN 5
        ELSE 6
      END
  `);
  weightStats.forEach(r => console.log(`  ${r.weight_range.padEnd(10)} ${String(r.cnt).padStart(6)} шт`));

  // 8. Подозрительные: крепёж с weight_kg > 0.5
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('  8. ПОДОЗРИТЕЛЬНЫЕ: крепёж с weight_kg > 0.5 кг');
  console.log('════════════════════════════════════════════════════════════\n');

  const { rows: suspFast } = await c.query(`
    SELECT p.part_number, p.name_en, p.weight_kg, p.price_krw,
           COALESCE(cat.name_ru, 'NULL') AS cat_name, p.subcategory_id
    FROM parts_products p
    LEFT JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE p.name_en ~* '\m(bolt|screw|nut|stud|washer|clip|pin|rivet|grommet|plug)\M'
      AND p.weight_kg > 0.5
    ORDER BY p.weight_kg DESC
    LIMIT 20
  `);
  suspFast.forEach(r => {
    console.log(`  ${r.part_number.padEnd(16)} ${r.name_en.substring(0, 45).padEnd(46)} ${r.weight_kg}кг  ₩${r.price_krw}  [${r.cat_name}]`);
  });

  // 9. L3 категории — текущий состав
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('  9. ТЕКУЩИЕ L3 КАТЕГОРИИ — состав');
  console.log('════════════════════════════════════════════════════════════\n');

  const { rows: l3cats } = await c.query(`
    SELECT
      c.id, c.parent_id, c.name_ru,
      COUNT(p.id) AS product_count,
      c.weight_min_kg, c.weight_avg_kg, c.weight_max_kg
    FROM parts_categories c
    LEFT JOIN parts_products p ON p.subcategory_id = c.id
    WHERE c.id >= 900000
    GROUP BY c.id, c.parent_id, c.name_ru, c.weight_min_kg, c.weight_avg_kg, c.weight_max_kg
    ORDER BY c.id
  `);
  l3cats.forEach(r => {
    console.log(`  ${r.id} ${r.name_ru.padEnd(30)} ${String(r.product_count).padStart(5)} шт  ${r.weight_min_kg}–${r.weight_max_kg}кг (avg ${r.weight_avg_kg})`);
  });

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
