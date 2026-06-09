require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // What's remaining on 17901?
  const { rows: brake } = await c.query("SELECT name_en FROM parts_products WHERE subcategory_id = 17901 LIMIT 40");
  console.log('=== 17901 REMAINING (sample 40) ===');
  brake.forEach(r => console.log(' ', r.name_en));

  // What's remaining on 17903?
  const { rows: steer } = await c.query("SELECT name_en FROM parts_products WHERE subcategory_id = 17903 LIMIT 30");
  console.log('\n=== 17903 REMAINING (sample 30) ===');
  steer.forEach(r => console.log(' ', r.name_en));

  // What's remaining on 18001?
  const { rows: body } = await c.query("SELECT name_en FROM parts_products WHERE subcategory_id = 18001");
  console.log('\n=== 18001 REMAINING ===');
  body.forEach(r => console.log(' ', r.name_en));

  // Full L3 counts
  const { rows: counts } = await c.query(`
    SELECT c.id, c.name_ru, COUNT(p.id) as cnt
    FROM parts_categories c
    LEFT JOIN parts_products p ON p.subcategory_id = c.id
    WHERE c.id >= 900000
    GROUP BY c.id, c.name_ru
    ORDER BY c.parent_id, c.id
  `);
  console.log('\n=== ALL L3 counts ===');
  counts.forEach(r => console.log(' ', String(r.id).padEnd(8), String(r.cnt).padEnd(6), r.name_ru));

  // L2 remaining
  const { rows: l2rem } = await c.query(`
    SELECT subcategory_id, COUNT(*) as cnt
    FROM parts_products
    WHERE subcategory_id IN (17701, 17901, 17902, 17903, 17703, 18005, 18001, 18003)
    GROUP BY subcategory_id ORDER BY cnt DESC
  `);
  console.log('\n=== L2 remaining (not moved to L3) ===');
  l2rem.forEach(r => console.log(' ', r.subcategory_id + ':', r.cnt));

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
