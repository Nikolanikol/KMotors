require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // Find the bolt
  const { rows } = await c.query(`
    SELECT p.id, p.part_number, p.name_en, p.name_ru, p.price_krw,
           p.category_id, p.subcategory_id,
           w.estimated_weight_kg, w.price_pct, w.subcategory_id as w_subcat,
           cat.name_ru as cat_name, cat.weight_avg_kg as cat_weight
    FROM parts_products p
    LEFT JOIN v_product_weight w ON w.product_id = p.id
    LEFT JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE p.part_number = '1129306287K'
  `);
  console.log('=== Bolt 1129306287K ===');
  rows.forEach(r => console.log(JSON.stringify(r, null, 2)));

  // How many products have subcategory_id that's NOT an L3 and NOT one of the known L2s?
  const { rows: nulls } = await c.query(`
    SELECT
      CASE
        WHEN subcategory_id IS NULL THEN 'NULL'
        WHEN subcategory_id >= 900000 THEN 'L3'
        ELSE 'L2: ' || subcategory_id::text
      END as cat_type,
      COUNT(*) as cnt
    FROM parts_products
    GROUP BY 1
    ORDER BY cnt DESC
    LIMIT 20
  `);
  console.log('\n=== Product distribution by subcategory type ===');
  nulls.forEach(r => console.log('  ' + r.cat_type.padEnd(15), r.cnt));

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
