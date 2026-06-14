require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  // 3. Крепёж по всему каталогу (ILIKE вместо regex)
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  3. КРЕПЁЖ ПО ВСЕМУ КАТАЛОГУ');
  console.log('══════════════════════════════════════════════════════\n');

  const fastenerTypes = ['bolt', 'screw', 'nut', 'stud', 'washer', 'clip', 'pin', 'rivet', 'gasket', 'seal', 'o-ring', 'grommet', 'plug'];
  for (const ft of fastenerTypes) {
    const { rows } = await c.query(`
      SELECT
        CASE
          WHEN subcategory_id IS NULL THEN 'NULL'
          WHEN subcategory_id >= 900000 THEN 'L3:' || subcategory_id::text
          ELSE 'L2:' || subcategory_id::text
        END AS cat_type,
        COALESCE((SELECT name_ru FROM parts_categories WHERE id = p.subcategory_id), 'NULL') AS cat_name,
        COUNT(*) AS cnt,
        ROUND(AVG(p.price_krw)) AS avg_price
      FROM parts_products p
      WHERE LOWER(p.name_en) LIKE '%' || $1 || '%'
      GROUP BY 1, 2
      ORDER BY cnt DESC
    `, [ft]);
    if (rows.length > 0) {
      const total = rows.reduce((s, r) => s + parseInt(r.cnt), 0);
      console.log(`  ── ${ft.toUpperCase()} (${total} total) ──`);
      rows.forEach(r => console.log(`    ${r.cat_type.padEnd(14)} ${r.cat_name.padEnd(30)} ${String(r.cnt).padStart(5)}`));
      console.log('');
    }
  }

  // 7. Weight_kg состояние
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  7. WEIGHT_KG — ОБЩЕЕ СОСТОЯНИЕ');
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
  ws.forEach(r => console.log(`  ${r.weight_range.padEnd(10)} ${String(r.cnt).padStart(6)}`));

  // 8. Подозрительные: крепёж с weight_kg > 0.5
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  8. ПОДОЗРИТЕЛЬНЫЕ: крепёж с weight > 0.5кг');
  console.log('══════════════════════════════════════════════════════\n');

  const { rows: susp } = await c.query(`
    SELECT p.part_number, p.name_en, p.weight_kg, p.price_krw,
           COALESCE(cat.name_ru, 'NULL') AS cat_name, p.subcategory_id
    FROM parts_products p
    LEFT JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE (LOWER(p.name_en) LIKE '%bolt%' OR LOWER(p.name_en) LIKE '%screw%'
           OR LOWER(p.name_en) LIKE '%nut%' OR LOWER(p.name_en) LIKE '%washer%'
           OR LOWER(p.name_en) LIKE '%clip%' OR LOWER(p.name_en) LIKE '%pin%')
      AND p.weight_kg > 0.5
    ORDER BY p.weight_kg DESC
    LIMIT 20
  `);
  if (susp.length === 0) {
    console.log('  Нет (все крепёжные товары с weight_kg ≤ 0.5 или NULL)');
  } else {
    susp.forEach(r => {
      console.log(`  ${r.part_number.padEnd(16)} ${r.name_en.substring(0, 50).padEnd(51)} ${r.weight_kg}кг ₩${r.price_krw} [${r.cat_name}]`);
    });
  }

  // 9. L3 текущий состав
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  9. ТЕКУЩИЕ L3 КАТЕГОРИИ');
  console.log('══════════════════════════════════════════════════════\n');

  const { rows: l3 } = await c.query(`
    SELECT c.id, c.parent_id, c.name_ru,
      COUNT(p.id) AS cnt,
      c.weight_min_kg, c.weight_avg_kg, c.weight_max_kg
    FROM parts_categories c
    LEFT JOIN parts_products p ON p.subcategory_id = c.id
    WHERE c.id >= 900000
    GROUP BY c.id, c.parent_id, c.name_ru, c.weight_min_kg, c.weight_avg_kg, c.weight_max_kg
    ORDER BY c.id
  `);
  l3.forEach(r => {
    console.log(`  ${r.id} ${r.name_ru.padEnd(32)} ${String(r.cnt).padStart(5)}шт  ${r.weight_min_kg}–${r.weight_max_kg}кг`);
  });

  // 10. Что в "Прочее" (17999, 17899, 18099) — подробный разбор по типам
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  10. ПРОЧЕЕ ШАССИ (17999) — КЛАСТЕРЫ ПО ТИПУ ТОВАРА');
  console.log('══════════════════════════════════════════════════════\n');

  const clusters = [
    { label: 'Колёсные диски (aluminum/wheels)', pattern: "LOWER(name_en) LIKE '%aluminum%' OR LOWER(name_en) LIKE '%wheels%' OR LOWER(name_en) LIKE '%alloy%'" },
    { label: 'Болты/крепёж', pattern: "LOWER(name_en) LIKE '%bolt%' OR LOWER(name_en) LIKE '%screw%' OR LOWER(name_en) LIKE '%nut %' OR LOWER(name_en) LIKE '%washer%'" },
    { label: 'Амортизаторы/стойки', pattern: "LOWER(name_en) LIKE '%shock%' OR LOWER(name_en) LIKE '%strut%' OR LOWER(name_en) LIKE '%absorber%'" },
    { label: 'Рычаги/arms', pattern: "LOWER(name_en) LIKE '%control arm%' OR LOWER(name_en) LIKE '%lower arm%' OR LOWER(name_en) LIKE '%upper arm%' OR LOWER(name_en) LIKE '%trailing arm%'" },
    { label: 'Стабилизатор', pattern: "LOWER(name_en) LIKE '%stabilizer%' OR LOWER(name_en) LIKE '%sway bar%'" },
    { label: 'Рулевое', pattern: "LOWER(name_en) LIKE '%steering%'" },
    { label: 'Втулки/bushing', pattern: "LOWER(name_en) LIKE '%bush%' OR LOWER(name_en) LIKE '%bushing%'" },
    { label: 'Шланги/tubes', pattern: "LOWER(name_en) LIKE '%hose%' OR LOWER(name_en) LIKE '%tube%' OR LOWER(name_en) LIKE '%pipe%'" },
    { label: 'Кронштейны/bracket', pattern: "LOWER(name_en) LIKE '%bracket%' OR LOWER(name_en) LIKE '%mounting%'" },
    { label: 'Датчики/switch', pattern: "LOWER(name_en) LIKE '%switch%' OR LOWER(name_en) LIKE '%sensor%'" },
    { label: 'Пружины', pattern: "LOWER(name_en) LIKE '%spring%' OR LOWER(name_en) LIKE '%coil%'" },
    { label: 'Крышки/cover', pattern: "LOWER(name_en) LIKE '%cover%' OR LOWER(name_en) LIKE '%cap%'" },
  ];
  let accounted = 0;
  for (const cl of clusters) {
    const { rows } = await c.query(`
      SELECT COUNT(*) AS cnt, ROUND(AVG(price_krw)) AS avg_price,
             MIN(price_krw) AS min_p, MAX(price_krw) AS max_p
      FROM parts_products
      WHERE subcategory_id = 17999 AND (${cl.pattern})
    `);
    const cnt = parseInt(rows[0].cnt);
    accounted += cnt;
    if (cnt > 0) {
      console.log(`  ${cl.label.padEnd(30)} ${String(cnt).padStart(5)} шт  avg₩${rows[0].avg_price}  (₩${rows[0].min_p}–₩${rows[0].max_p})`);
    }
  }
  console.log(`\n  Учтено: ${accounted} / 4477. Остаток: ${4477 - accounted}`);

  // 11. Прочее КПП (17899) — кластеры
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  11. ПРОЧЕЕ КПП (17899) — КЛАСТЕРЫ ПО ТИПУ');
  console.log('══════════════════════════════════════════════════════\n');

  const clusters2 = [
    { label: 'ШРУС/CV Joint', pattern: "LOWER(name_en) LIKE '%joint%' OR LOWER(name_en) LIKE '%velocity%' OR LOWER(name_en) LIKE '%cv %'" },
    { label: 'Шестерни/gear', pattern: "LOWER(name_en) LIKE '%gear%'" },
    { label: 'Вал/shaft', pattern: "LOWER(name_en) LIKE '%shaft%' OR LOWER(name_en) LIKE '%axle%'" },
    { label: 'Пыльники/boot', pattern: "LOWER(name_en) LIKE '%boot%' OR LOWER(name_en) LIKE '%dust%'" },
    { label: 'Рычаг переключения/shift', pattern: "LOWER(name_en) LIKE '%shift%' OR LOWER(name_en) LIKE '%lever%' OR LOWER(name_en) LIKE '%knob%'" },
    { label: 'Масло/oil', pattern: "LOWER(name_en) LIKE '%oil%'" },
    { label: 'Дифференциал', pattern: "LOWER(name_en) LIKE '%differential%'" },
    { label: 'Подшипники/bearing', pattern: "LOWER(name_en) LIKE '%bearing%'" },
    { label: 'Болты/крепёж', pattern: "LOWER(name_en) LIKE '%bolt%' OR LOWER(name_en) LIKE '%screw%' OR LOWER(name_en) LIKE '%nut %' OR LOWER(name_en) LIKE '%washer%'" },
    { label: 'Кольца/ring', pattern: "LOWER(name_en) LIKE '%ring%'" },
    { label: 'Кронштейн/bracket', pattern: "LOWER(name_en) LIKE '%bracket%'" },
    { label: 'Клапан/valve', pattern: "LOWER(name_en) LIKE '%valve%'" },
  ];
  accounted = 0;
  for (const cl of clusters2) {
    const { rows } = await c.query(`
      SELECT COUNT(*) AS cnt, ROUND(AVG(price_krw)) AS avg_price,
             MIN(price_krw) AS min_p, MAX(price_krw) AS max_p
      FROM parts_products
      WHERE subcategory_id = 17899 AND (${cl.pattern})
    `);
    const cnt = parseInt(rows[0].cnt);
    accounted += cnt;
    if (cnt > 0) {
      console.log(`  ${cl.label.padEnd(30)} ${String(cnt).padStart(5)} шт  avg₩${rows[0].avg_price}  (₩${rows[0].min_p}–₩${rows[0].max_p})`);
    }
  }
  console.log(`\n  Учтено: ${accounted} / 3167. Остаток: ${3167 - accounted}`);

  // 12. Прочее кузов (18099) — кластеры
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  12. ПРОЧЕЕ КУЗОВ (18099) — КЛАСТЕРЫ ПО ТИПУ');
  console.log('══════════════════════════════════════════════════════\n');

  const clusters3 = [
    { label: 'Наклейки/label/emission', pattern: "LOWER(name_en) LIKE '%label%' OR LOWER(name_en) LIKE '%emission%' OR LOWER(name_en) LIKE '%sticker%'" },
    { label: 'Крепёж/bolt/bracket', pattern: "LOWER(name_en) LIKE '%bolt%' OR LOWER(name_en) LIKE '%bracket%' OR LOWER(name_en) LIKE '%mounting%'" },
    { label: 'Подрамник/crossmember', pattern: "LOWER(name_en) LIKE '%cross%' OR LOWER(name_en) LIKE '%member%' OR LOWER(name_en) LIKE '%subframe%'" },
    { label: 'Крыло/fender', pattern: "LOWER(name_en) LIKE '%fender%'" },
    { label: 'Изоляция/insulator', pattern: "LOWER(name_en) LIKE '%insulator%' OR LOWER(name_en) LIKE '%insulation%'" },
    { label: 'Рычаги/arm', pattern: "LOWER(name_en) LIKE '%arm%'" },
    { label: 'Топливо/fuel', pattern: "LOWER(name_en) LIKE '%fuel%' OR LOWER(name_en) LIKE '%tire%'" },
    { label: 'Опора/support', pattern: "LOWER(name_en) LIKE '%support%'" },
  ];
  accounted = 0;
  for (const cl of clusters3) {
    const { rows } = await c.query(`
      SELECT COUNT(*) AS cnt, ROUND(AVG(price_krw)) AS avg_price
      FROM parts_products
      WHERE subcategory_id = 18099 AND (${cl.pattern})
    `);
    const cnt = parseInt(rows[0].cnt);
    accounted += cnt;
    if (cnt > 0) {
      console.log(`  ${cl.label.padEnd(30)} ${String(cnt).padStart(5)} шт  avg₩${rows[0].avg_price}`);
    }
  }
  console.log(`\n  Учтено: ${accounted} / 859. Остаток: ${859 - accounted}`);

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
