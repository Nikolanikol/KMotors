require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // Fill parts_products.weight_kg from v_product_weight
  const r = await c.query(`
    UPDATE parts_products p
    SET weight_kg = w.estimated_weight_kg
    FROM v_product_weight w
    WHERE w.product_id = p.id
      AND w.estimated_weight_kg IS NOT NULL
  `);
  console.log('Updated weight_kg for', r.rowCount, 'products');

  // Verify
  const { rows: stats } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE weight_kg IS NOT NULL) as has_weight,
      COUNT(*) FILTER (WHERE weight_kg IS NULL) as no_weight,
      COUNT(*) as total
    FROM parts_products
  `);
  console.log('Has weight_kg:', stats[0].has_weight, '/', stats[0].total);

  // Sample check
  const { rows: sample } = await c.query(`
    SELECT part_number, name_en, price_krw, weight_kg, subcategory_id
    FROM parts_products
    WHERE subcategory_id = 900204
    ORDER BY price_krw
    LIMIT 5
  `);
  console.log('\nRear discs (cheapest):');
  sample.forEach(r => console.log('  ₩' + String(r.price_krw).padEnd(8), r.weight_kg + ' kg', r.name_en));

  // Bolt check
  const { rows: bolt } = await c.query("SELECT part_number, name_en, weight_kg, subcategory_id FROM parts_products WHERE part_number = '1129306287K'");
  console.log('\nBolt:', bolt[0]?.weight_kg, '(should be NULL → fallback to category)');

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
