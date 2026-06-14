require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  const patterns = [
    { label: 'sensor', sql: "name_en ~* '\\msensor\\M'" },
    { label: 'actuator/solenoid', sql: "name_en ~* '\\m(actuator|solenoid)\\M'" },
    { label: 'switch', sql: "name_en ~* '\\mswitch\\M'" },
    { label: 'relay', sql: "name_en ~* '\\mrelay\\M'" },
    { label: 'module/ecu/unit', sql: "name_en ~* '\\m(module|ecu|control unit)\\M'" },
    { label: 'wire/harness/cable', sql: "name_en ~* '\\m(wire|wiring|harness|cable|connector)\\M'" },
    { label: 'bracket/mount (cheap)', sql: "name_en ~* '\\m(bracket|mounting)\\M' AND price_krw < 30000" },
    { label: 'cover/cap/shield (cheap)', sql: "name_en ~* '\\m(cover|cap|shield|guard)\\M' AND price_krw < 25000" },
    { label: 'hose/tube/pipe (cheap)', sql: "name_en ~* '\\m(hose|tube|pipe|line)\\M' AND price_krw < 30000" },
    { label: 'motor (small)', sql: "name_en ~* '\\m(motor)\\M' AND name_en !~* '\\m(starter motor)\\M' AND price_krw < 80000" },
  ];

  console.log('══════════════════════════════════════════════════════');
  console.log('  МЕЛКИЕ ДЕТАЛИ В ТЯЖЁЛЫХ КАТЕГОРИЯХ (L2 weight_avg > 1кг)');
  console.log('══════════════════════════════════════════════════════\n');

  for (const p of patterns) {
    const { rows } = await c.query(`
      SELECT
        CASE
          WHEN p.subcategory_id >= 900000 THEN 'L3'
          ELSE 'L2'
        END AS level,
        p.subcategory_id,
        cat.name_ru,
        cat.weight_avg_kg,
        COUNT(*) AS cnt,
        ROUND(AVG(p.price_krw)) AS avg_price
      FROM parts_products p
      JOIN parts_categories cat ON cat.id = p.subcategory_id
      WHERE ${p.sql}
        AND (p.subcategory_id < 900000 OR p.subcategory_id BETWEEN 900200 AND 900899)
        AND p.subcategory_id NOT BETWEEN 900901 AND 900999
      GROUP BY 1, 2, 3, 4
      HAVING cat.weight_avg_kg > 1 OR cat.weight_avg_kg IS NULL
      ORDER BY cnt DESC
      LIMIT 8
    `);
    if (rows.length > 0) {
      const total = rows.reduce((s, r) => s + parseInt(r.cnt), 0);
      console.log(`── ${p.label} (${total} в тяжёлых) ──`);
      rows.forEach(r => {
        console.log(`  [${r.subcategory_id}] ${(r.name_ru||'?').padEnd(28)} ${String(r.cnt).padStart(4)} шт  cat_wt=${r.weight_avg_kg||'?'}кг  avg₩${r.avg_price}`);
      });
      console.log('');
    }
  }

  // Общий подсчёт
  console.log('══════════════════════════════════════════════════════');
  console.log('  ИТОГО: сколько мелочи пострадает');
  console.log('══════════════════════════════════════════════════════\n');

  const { rows: totals } = await c.query(`
    SELECT
      'sensor/actuator/solenoid' AS type,
      COUNT(*) AS cnt
    FROM parts_products p
    JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE name_en ~* '\\m(sensor|actuator|solenoid)\\M'
      AND p.subcategory_id NOT BETWEEN 900901 AND 900999
      AND (cat.weight_avg_kg > 1 OR cat.weight_min_kg > 0.5)
    UNION ALL
    SELECT 'switch/relay/module' AS type,
      COUNT(*)
    FROM parts_products p
    JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE name_en ~* '\\m(switch|relay|module|ecu|control unit)\\M'
      AND p.subcategory_id NOT BETWEEN 900901 AND 900999
      AND (cat.weight_avg_kg > 1 OR cat.weight_min_kg > 0.5)
    UNION ALL
    SELECT 'wire/harness/cable' AS type,
      COUNT(*)
    FROM parts_products p
    JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE name_en ~* '\\m(wire|wiring|harness|cable|connector)\\M'
      AND p.subcategory_id NOT BETWEEN 900901 AND 900999
      AND (cat.weight_avg_kg > 0.8 OR cat.weight_min_kg > 0.5)
    UNION ALL
    SELECT 'bracket/mount (cheap)' AS type,
      COUNT(*)
    FROM parts_products p
    JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE name_en ~* '\\m(bracket|mounting)\\M'
      AND price_krw < 30000
      AND p.subcategory_id NOT BETWEEN 900901 AND 901999
      AND (cat.weight_avg_kg > 1.5 OR cat.weight_min_kg > 1)
    UNION ALL
    SELECT 'cover/cap/shield (cheap)' AS type,
      COUNT(*)
    FROM parts_products p
    JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE name_en ~* '\\m(cover|cap|shield|guard)\\M'
      AND price_krw < 25000
      AND p.subcategory_id NOT BETWEEN 900901 AND 901999
      AND (cat.weight_avg_kg > 1 OR cat.weight_min_kg > 0.5)
  `);
  let grandTotal = 0;
  totals.forEach(r => {
    grandTotal += parseInt(r.cnt);
    console.log(`  ${r.type.padEnd(28)} ${String(r.cnt).padStart(5)}`);
  });
  console.log(`\n  ИТОГО: ~${grandTotal} (с пересечениями)`);

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
