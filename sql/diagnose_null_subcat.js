require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  // 1. Какие L2 уже существуют под 181 (Салон) и 177 (Двигатель)?
  console.log('══════════════════════════════════════════════════════');
  console.log('  1. СУЩЕСТВУЮЩИЕ L2 ПОДКАТЕГОРИИ');
  console.log('══════════════════════════════════════════════════════\n');

  const { rows: existingL2 } = await c.query(`
    SELECT c.id, c.parent_id, c.name_ru, c.name_en, c.weight_avg_kg,
           COUNT(p.id) AS products_count
    FROM parts_categories c
    LEFT JOIN parts_products p ON p.subcategory_id = c.id
    WHERE c.parent_id IN (
      SELECT id FROM parts_categories WHERE id IN (177, 181)
      UNION
      SELECT id FROM parts_categories WHERE parent_id IN (177, 181)
    )
    OR c.id IN (177, 181)
    GROUP BY c.id, c.parent_id, c.name_ru, c.name_en, c.weight_avg_kg
    ORDER BY c.parent_id NULLS FIRST, c.id
  `);
  existingL2.forEach(r => {
    const indent = r.parent_id ? '    ' : '  ';
    console.log(`${indent}[${r.id}] ${r.name_ru || r.name_en} (${r.name_en})  ${r.products_count} шт  weight=${r.weight_avg_kg || '-'}кг`);
  });

  // 2. Полная структура категорий (L1 → L2)
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  2. ПОЛНОЕ ДЕРЕВО КАТЕГОРИЙ');
  console.log('══════════════════════════════════════════════════════\n');

  const { rows: tree } = await c.query(`
    SELECT c.id, c.parent_id, c.name_ru, c.name_en,
           (SELECT COUNT(*) FROM parts_products WHERE subcategory_id = c.id) AS prod_count,
           (SELECT COUNT(*) FROM parts_products WHERE category_id = c.id AND subcategory_id IS NULL) AS null_sub_count
    FROM parts_categories c
    WHERE c.id < 900000
    ORDER BY c.parent_id NULLS FIRST, c.id
  `);
  tree.forEach(r => {
    const indent = r.parent_id ? '    ' : '  ';
    const nullMark = parseInt(r.null_sub_count) > 0 ? `  ⚠ ${r.null_sub_count} NULL subcat` : '';
    console.log(`${indent}[${r.id}] ${(r.name_ru || r.name_en || '').padEnd(30)} ${String(r.prod_count).padStart(5)} in L2${nullMark}`);
  });

  // 3. NULL subcategory: keyword clusters для 181 (Салон)
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  3. NULL SUBCAT — КЛАСТЕРЫ ДЛЯ [181] САЛОН (19577 шт)');
  console.log('══════════════════════════════════════════════════════\n');

  const salonClusters = [
    { label: 'Зеркала/Mirror', pattern: "LOWER(name_en) LIKE '%mirror%' OR LOWER(name_en) LIKE '%rearview%'" },
    { label: 'Двери/Door', pattern: "LOWER(name_en) LIKE '%door%' AND LOWER(name_en) NOT LIKE '%mirror%'" },
    { label: 'Трим/панели интерьера', pattern: "LOWER(name_en) LIKE '%trim%' OR LOWER(name_en) LIKE '%panel%' OR LOWER(name_en) LIKE '%garnish%'" },
    { label: 'Ручки/Handle', pattern: "LOWER(name_en) LIKE '%handle%'" },
    { label: 'Консоль/Console', pattern: "LOWER(name_en) LIKE '%console%'" },
    { label: 'Бампер/Bumper', pattern: "LOWER(name_en) LIKE '%bumper%'" },
    { label: 'Молдинги/Molding', pattern: "LOWER(name_en) LIKE '%molding%' OR LOWER(name_en) LIKE '%moulding%'" },
    { label: 'Пол/Floor', pattern: "LOWER(name_en) LIKE '%floor%' OR LOWER(name_en) LIKE '%carpet%' OR LOWER(name_en) LIKE '%mat%'" },
    { label: 'Стекло/Glass/Window', pattern: "LOWER(name_en) LIKE '%window%' OR LOWER(name_en) LIKE '%glass%'" },
    { label: 'Сиденья/Seat', pattern: "LOWER(name_en) LIKE '%seat%'" },
    { label: 'Фары/Light/Lamp', pattern: "LOWER(name_en) LIKE '%light%' OR LOWER(name_en) LIKE '%lamp%' OR LOWER(name_en) LIKE '%bulb%'" },
    { label: 'Замки/Lock/Latch', pattern: "LOWER(name_en) LIKE '%lock%' OR LOWER(name_en) LIKE '%latch%'" },
    { label: 'Ремни безопасности', pattern: "LOWER(name_en) LIKE '%belt%' OR LOWER(name_en) LIKE '%seat belt%'" },
    { label: 'Крышки/Cover', pattern: "LOWER(name_en) LIKE '%cover%'" },
    { label: 'Кронштейны/Bracket', pattern: "LOWER(name_en) LIKE '%bracket%' OR LOWER(name_en) LIKE '%mounting%'" },
    { label: 'Шланги/Hose', pattern: "LOWER(name_en) LIKE '%hose%' OR LOWER(name_en) LIKE '%pipe%' OR LOWER(name_en) LIKE '%tube%'" },
    { label: 'Датчики/Sensor', pattern: "LOWER(name_en) LIKE '%sensor%'" },
    { label: 'Электрика/Wiring', pattern: "LOWER(name_en) LIKE '%wire%' OR LOWER(name_en) LIKE '%harness%' OR LOWER(name_en) LIKE '%connector%'" },
    { label: 'Педали', pattern: "LOWER(name_en) LIKE '%pedal%'" },
    { label: 'Солнцезащитный козырёк', pattern: "LOWER(name_en) LIKE '%visor%' OR LOWER(name_en) LIKE '%sun%'" },
  ];
  let accounted181 = 0;
  for (const cl of salonClusters) {
    const { rows } = await c.query(`
      SELECT COUNT(*) AS cnt, ROUND(AVG(price_krw)) AS avg_price,
             MIN(price_krw) AS min_p, MAX(price_krw) AS max_p
      FROM parts_products
      WHERE category_id = 181 AND subcategory_id IS NULL AND (${cl.pattern})
    `);
    const cnt = parseInt(rows[0].cnt);
    if (cnt > 0) {
      accounted181 += cnt;
      console.log(`  ${cl.label.padEnd(30)} ${String(cnt).padStart(5)} шт  avg₩${rows[0].avg_price}  (₩${rows[0].min_p}–₩${rows[0].max_p})`);
    }
  }
  console.log(`\n  Учтено: ~${accounted181} (с пересечениями) / 19577`);

  // 4. NULL subcategory: keyword clusters для 177 (Двигатель)
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  4. NULL SUBCAT — КЛАСТЕРЫ ДЛЯ [177] ДВИГАТЕЛЬ (12302 шт)');
  console.log('══════════════════════════════════════════════════════\n');

  const engineClusters = [
    { label: 'Шланги/Hose/Pipe', pattern: "LOWER(name_en) LIKE '%hose%' OR LOWER(name_en) LIKE '%pipe%' OR LOWER(name_en) LIKE '%tube%'" },
    { label: 'Датчики/Sensor', pattern: "LOWER(name_en) LIKE '%sensor%'" },
    { label: 'Радиатор/Cooling', pattern: "LOWER(name_en) LIKE '%radiator%' OR LOWER(name_en) LIKE '%cooling%' OR LOWER(name_en) LIKE '%coolant%'" },
    { label: 'Масло/Oil', pattern: "LOWER(name_en) LIKE '%oil%'" },
    { label: 'Воздух/Air/Intake', pattern: "LOWER(name_en) LIKE '%air%' OR LOWER(name_en) LIKE '%intake%'" },
    { label: 'Топливо/Fuel', pattern: "LOWER(name_en) LIKE '%fuel%'" },
    { label: 'Насос/Pump', pattern: "LOWER(name_en) LIKE '%pump%'" },
    { label: 'Ремни/Belt/Pulley', pattern: "LOWER(name_en) LIKE '%belt%' OR LOWER(name_en) LIKE '%pulley%' OR LOWER(name_en) LIKE '%tensioner%'" },
    { label: 'Прокладки/Gasket', pattern: "LOWER(name_en) LIKE '%gasket%' OR LOWER(name_en) LIKE '%seal%'" },
    { label: 'Крышки/Cover', pattern: "LOWER(name_en) LIKE '%cover%' OR LOWER(name_en) LIKE '%cap%'" },
    { label: 'Кронштейн/Bracket', pattern: "LOWER(name_en) LIKE '%bracket%' OR LOWER(name_en) LIKE '%mount%'" },
    { label: 'Электрика/Wire', pattern: "LOWER(name_en) LIKE '%wire%' OR LOWER(name_en) LIKE '%harness%' OR LOWER(name_en) LIKE '%connector%'" },
    { label: 'Выхлоп/Exhaust', pattern: "LOWER(name_en) LIKE '%exhaust%' OR LOWER(name_en) LIKE '%catalytic%' OR LOWER(name_en) LIKE '%muffler%'" },
    { label: 'Турбо/Turbo', pattern: "LOWER(name_en) LIKE '%turbo%' OR LOWER(name_en) LIKE '%intercooler%'" },
    { label: 'Компрессор/AC', pattern: "LOWER(name_en) LIKE '%compressor%' OR LOWER(name_en) LIKE '%condenser%' OR LOWER(name_en) LIKE '%evaporator%'" },
    { label: 'Свечи/Spark', pattern: "LOWER(name_en) LIKE '%spark%' OR LOWER(name_en) LIKE '%ignition%' OR LOWER(name_en) LIKE '%coil%'" },
    { label: 'Стартер/Генератор', pattern: "LOWER(name_en) LIKE '%starter%' OR LOWER(name_en) LIKE '%alternator%' OR LOWER(name_en) LIKE '%generator%'" },
    { label: 'Помпа/Water pump', pattern: "LOWER(name_en) LIKE '%water pump%'" },
    { label: 'Клапан/Valve', pattern: "LOWER(name_en) LIKE '%valve%'" },
  ];
  let accounted177 = 0;
  for (const cl of engineClusters) {
    const { rows } = await c.query(`
      SELECT COUNT(*) AS cnt, ROUND(AVG(price_krw)) AS avg_price,
             MIN(price_krw) AS min_p, MAX(price_krw) AS max_p
      FROM parts_products
      WHERE category_id = 177 AND subcategory_id IS NULL AND (${cl.pattern})
    `);
    const cnt = parseInt(rows[0].cnt);
    if (cnt > 0) {
      accounted177 += cnt;
      console.log(`  ${cl.label.padEnd(30)} ${String(cnt).padStart(5)} шт  avg₩${rows[0].avg_price}  (₩${rows[0].min_p}–₩${rows[0].max_p})`);
    }
  }
  console.log(`\n  Учтено: ~${accounted177} (с пересечениями) / 12302`);

  // 5. Примеры товаров которые НЕ попадают ни в один кластер
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  5. ПРИМЕРЫ НЕКЛАССИФИЦИРУЕМЫХ (не попали в кластеры)');
  console.log('══════════════════════════════════════════════════════\n');

  const { rows: uncl } = await c.query(`
    SELECT name_en, price_krw, category_id
    FROM parts_products
    WHERE subcategory_id IS NULL
      AND LOWER(name_en) NOT LIKE '%mirror%' AND LOWER(name_en) NOT LIKE '%door%'
      AND LOWER(name_en) NOT LIKE '%trim%' AND LOWER(name_en) NOT LIKE '%panel%'
      AND LOWER(name_en) NOT LIKE '%handle%' AND LOWER(name_en) NOT LIKE '%hose%'
      AND LOWER(name_en) NOT LIKE '%sensor%' AND LOWER(name_en) NOT LIKE '%cover%'
      AND LOWER(name_en) NOT LIKE '%bracket%' AND LOWER(name_en) NOT LIKE '%light%'
      AND LOWER(name_en) NOT LIKE '%lamp%' AND LOWER(name_en) NOT LIKE '%bumper%'
      AND LOWER(name_en) NOT LIKE '%console%' AND LOWER(name_en) NOT LIKE '%seat%'
      AND LOWER(name_en) NOT LIKE '%wire%' AND LOWER(name_en) NOT LIKE '%fuel%'
      AND LOWER(name_en) NOT LIKE '%oil%' AND LOWER(name_en) NOT LIKE '%belt%'
      AND LOWER(name_en) NOT LIKE '%gasket%' AND LOWER(name_en) NOT LIKE '%garnish%'
      AND LOWER(name_en) NOT LIKE '%molding%' AND LOWER(name_en) NOT LIKE '%radiator%'
      AND LOWER(name_en) NOT LIKE '%floor%' AND LOWER(name_en) NOT LIKE '%window%'
      AND LOWER(name_en) NOT LIKE '%lock%' AND LOWER(name_en) NOT LIKE '%exhaust%'
      AND LOWER(name_en) NOT LIKE '%valve%' AND LOWER(name_en) NOT LIKE '%air%'
      AND LOWER(name_en) NOT LIKE '%pump%' AND LOWER(name_en) NOT LIKE '%mount%'
    ORDER BY random() LIMIT 20
  `);
  uncl.forEach(r => {
    console.log(`  [${r.category_id}] ${r.name_en.substring(0, 65).padEnd(66)} ₩${r.price_krw}`);
  });

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
