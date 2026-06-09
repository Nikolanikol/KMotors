require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const run = async (label, sql) => {
    const r = await c.query(sql);
    console.log(label.padEnd(30), r.rowCount, 'rows');
  };

  // 17903 remaining — power steering units/pumps/packs
  await run('900604 PS units', "UPDATE parts_products SET subcategory_id = 900604 WHERE subcategory_id = 17903 AND (name_en ILIKE '%power%' OR name_en ILIKE '%pump%' OR name_en ILIKE '%hydraulic%' OR name_en ILIKE '%motor%')");

  // Remaining 17903 → stay (misc)
  const r17903 = await c.query("SELECT name_en FROM parts_products WHERE subcategory_id = 17903");
  console.log('17903 still remaining:', r17903.rows.length);
  r17903.rows.forEach(r => console.log('  ', r.name_en));

  // 17701 filters
  await run('900101 Oil filter', "UPDATE parts_products SET subcategory_id = 900101 WHERE subcategory_id = 17701 AND name_en ILIKE '%oil filter%'");
  await run('900102 Air filter', "UPDATE parts_products SET subcategory_id = 900102 WHERE subcategory_id = 17701 AND name_en ILIKE '%air filter%'");
  await run('900103 Cabin filter', "UPDATE parts_products SET subcategory_id = 900103 WHERE subcategory_id = 17701 AND (name_en ILIKE '%cabin%' OR name_en ILIKE '%pollen%')");
  await run('900104 Fuel filter', "UPDATE parts_products SET subcategory_id = 900104 WHERE subcategory_id = 17701 AND name_en ILIKE '%fuel filter%'");
  await run('900105 Trans filter', "UPDATE parts_products SET subcategory_id = 900105 WHERE subcategory_id = 17701 AND (name_en ILIKE '%transmission%' OR name_en ILIKE '%atf%')");

  const r17701 = await c.query("SELECT name_en FROM parts_products WHERE subcategory_id = 17701");
  console.log('17701 still remaining:', r17701.rows.length);
  r17701.rows.forEach(r => console.log('  ', r.name_en));

  // Final summary
  console.log('\n=== FINAL TOTALS ===');
  const { rows: l3 } = await c.query("SELECT COUNT(*) FROM parts_products WHERE subcategory_id >= 900000");
  console.log('Total on L3:', l3[0].count);

  const { rows: l2 } = await c.query("SELECT subcategory_id, COUNT(*) as cnt FROM parts_products WHERE subcategory_id IN (17701, 17901, 17902, 17903, 17703, 18005, 18001, 18003) GROUP BY subcategory_id ORDER BY cnt DESC");
  let l2total = 0;
  l2.forEach(r => { console.log('L2 remaining:', r.subcategory_id, '=', r.cnt); l2total += parseInt(r.cnt); });
  console.log('L2 total remaining:', l2total);

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
