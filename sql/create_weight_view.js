require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

async function main() {
  const c = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const sql = fs.readFileSync('sql/011_product_weight_view.sql', 'utf8');
  await c.query(sql);
  console.log('Materialized view created.');

  // Verify
  const { rows: stats } = await c.query(`
    SELECT
      COUNT(*) as total,
      ROUND(AVG(estimated_weight_kg)::numeric, 2) as avg_w,
      ROUND(MIN(estimated_weight_kg)::numeric, 2) as min_w,
      ROUND(MAX(estimated_weight_kg)::numeric, 2) as max_w
    FROM v_product_weight
  `);
  console.log('Total products with weight:', stats[0].total);
  console.log('Weight range:', stats[0].min_w, '-', stats[0].max_w, 'avg:', stats[0].avg_w);

  // Sample: rear brake discs — should show price→weight correlation
  const { rows: discs } = await c.query(`
    SELECT p.part_number, p.name_en, p.price_krw, w.price_pct, w.estimated_weight_kg
    FROM v_product_weight w
    JOIN parts_products p ON p.id = w.product_id
    WHERE w.subcategory_id = 900204
    ORDER BY p.price_krw
    LIMIT 10
  `);
  console.log('\n=== 900204 Rear Disc (price→weight) ===');
  discs.forEach(r => {
    console.log(
      '₩' + String(r.price_krw).padEnd(8),
      'pct=' + Number(r.price_pct).toFixed(2).padEnd(6),
      'w=' + Number(r.estimated_weight_kg).toFixed(1) + 'kg',
      r.name_en.substring(0, 50)
    );
  });

  // Sample: shock absorbers
  const { rows: shocks } = await c.query(`
    SELECT p.price_krw, w.price_pct, w.estimated_weight_kg, p.name_en
    FROM v_product_weight w
    JOIN parts_products p ON p.id = w.product_id
    WHERE w.subcategory_id = 900301
    ORDER BY p.price_krw
    LIMIT 5
  `);
  console.log('\n=== 900301 Shock Absorber (cheapest 5) ===');
  shocks.forEach(r => {
    console.log(
      '₩' + String(r.price_krw).padEnd(8),
      'pct=' + Number(r.price_pct).toFixed(2).padEnd(6),
      'w=' + Number(r.estimated_weight_kg).toFixed(1) + 'kg',
      r.name_en.substring(0, 50)
    );
  });

  const { rows: shocksHi } = await c.query(`
    SELECT p.price_krw, w.price_pct, w.estimated_weight_kg, p.name_en
    FROM v_product_weight w
    JOIN parts_products p ON p.id = w.product_id
    WHERE w.subcategory_id = 900301
    ORDER BY p.price_krw DESC
    LIMIT 5
  `);
  console.log('=== 900301 Shock Absorber (priciest 5) ===');
  shocksHi.forEach(r => {
    console.log(
      '₩' + String(r.price_krw).padEnd(8),
      'pct=' + Number(r.price_pct).toFixed(2).padEnd(6),
      'w=' + Number(r.estimated_weight_kg).toFixed(1) + 'kg',
      r.name_en.substring(0, 50)
    );
  });

  // Per-L3 stats
  const { rows: l3stats } = await c.query(`
    SELECT w.subcategory_id, c.name_ru,
      COUNT(*) as cnt,
      ROUND(MIN(w.estimated_weight_kg)::numeric, 2) as min_w,
      ROUND(AVG(w.estimated_weight_kg)::numeric, 2) as avg_w,
      ROUND(MAX(w.estimated_weight_kg)::numeric, 2) as max_w
    FROM v_product_weight w
    JOIN parts_categories c ON c.id = w.subcategory_id
    GROUP BY w.subcategory_id, c.name_ru
    ORDER BY w.subcategory_id
  `);
  console.log('\n=== Per-L3 weight distribution ===');
  l3stats.forEach(r => {
    console.log(
      String(r.subcategory_id).padEnd(8),
      String(r.cnt).padEnd(5),
      (r.min_w + '-' + r.max_w + ' avg=' + r.avg_w).padEnd(24),
      r.name_ru
    );
  });

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
