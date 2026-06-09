require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // "Wheel - Steering" / "Wheel Assembly - Steering" → 900606
  const r1 = await c.query("UPDATE parts_products SET subcategory_id = 900606 WHERE subcategory_id = 17903 AND (name_en ILIKE '%wheel%steering%' OR name_en ILIKE '%wheel assembly%steering%')");
  console.log('900606 Wheel-Steering:', r1.rowCount);

  // Yoke-Steering → steering shaft
  const r2 = await c.query("UPDATE parts_products SET subcategory_id = 900609 WHERE subcategory_id = 17903 AND name_en ILIKE '%yoke%'");
  console.log('900609 Yoke:', r2.rowCount);

  // Lead-steering → stay on L2
  const rem = await c.query("SELECT name_en FROM parts_products WHERE subcategory_id = 17903");
  console.log('17903 remaining:', rem.rows.length);
  rem.rows.forEach(r => console.log('  ', r.name_en));

  // Final
  const { rows: l3 } = await c.query("SELECT COUNT(*) FROM parts_products WHERE subcategory_id >= 900000");
  const { rows: l2 } = await c.query("SELECT SUM(cnt)::int as total FROM (SELECT COUNT(*) as cnt FROM parts_products WHERE subcategory_id IN (17701,17901,17902,17903,17703,18005,18001,18003) GROUP BY subcategory_id) t");
  console.log('\nL3:', l3[0].count, '| L2 remaining:', l2[0].total);

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
