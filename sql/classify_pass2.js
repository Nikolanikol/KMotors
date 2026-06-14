require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const run = async (label, sql) => {
    const r = await c.query(sql);
    console.log(label.padEnd(42), r.rowCount, 'rows');
    return r.rowCount;
  };

  // ═══════════════════════════════════════════
  // 17901 ТОРМОЗНАЯ — pass 2
  // ═══════════════════════════════════════════
  console.log('=== 17901 pass 2 ===');

  // "Brake - Front" / "Front brake" = front caliper assembly → 900205
  await run('900205 Front brake assembly',
    `UPDATE parts_products SET subcategory_id = 900205
     WHERE subcategory_id = 17901
       AND (name_en ILIKE '%brake%front%' OR name_en ILIKE '%front%brake%')
       AND name_en NOT ILIKE '%pad%' AND name_en NOT ILIKE '%disc%'
       AND name_en NOT ILIKE '%hose%' AND name_en NOT ILIKE '%cable%'
       AND name_en NOT ILIKE '%plate%' AND name_en NOT ILIKE '%duct%'
       AND name_en NOT ILIKE '%reservoir%' AND name_en NOT ILIKE '%cap%'
       AND name_en NOT ILIKE '%fluid%'`);

  // "Brake - Rear" / "Rear brake" = rear caliper assembly → 900205
  await run('900205 Rear brake assembly',
    `UPDATE parts_products SET subcategory_id = 900205
     WHERE subcategory_id = 17901
       AND (name_en ILIKE '%brake%rear%' OR name_en ILIKE '%rear%brake%')
       AND name_en NOT ILIKE '%pad%' AND name_en NOT ILIKE '%disc%'
       AND name_en NOT ILIKE '%hose%' AND name_en NOT ILIKE '%cable%'
       AND name_en NOT ILIKE '%plate%' AND name_en NOT ILIKE '%drum%'
       AND name_en NOT ILIKE '%shoe%' AND name_en NOT ILIKE '%back plate%'
       AND name_en NOT ILIKE '%reservoir%' AND name_en NOT ILIKE '%cap%'
       AND name_en NOT ILIKE '%fluid%'`);

  // Parking brake cable → 900206 (hoses/cables)
  await run('900206 Parking brake cable',
    `UPDATE parts_products SET subcategory_id = 900206
     WHERE subcategory_id = 17901
       AND (name_en ILIKE '%parking brake cable%' OR name_en ILIKE '%cable parking%'
            OR name_en ILIKE '%cable%brake%')`);

  // All remaining 17901 → 900212 accessories
  await run('900212 All remaining brake',
    `UPDATE parts_products SET subcategory_id = 900212
     WHERE subcategory_id = 17901`);

  const rem1 = await c.query("SELECT COUNT(*) FROM parts_products WHERE subcategory_id = 17901");
  console.log('REMAINING 17901:'.padEnd(42), rem1.rows[0].count);

  // ═══════════════════════════════════════════
  // 17903 РУЛЕВОЕ — pass 2
  // ═══════════════════════════════════════════
  console.log('\n=== 17903 pass 2 ===');

  // "Gear Linkage-Steering" / "Gear-steering" / "Power Rack" → 900601 (рейка)
  await run('900601 Gear linkage / Power rack',
    `UPDATE parts_products SET subcategory_id = 900601
     WHERE subcategory_id = 17903
       AND (name_en ILIKE '%gear linkage%' OR name_en ILIKE '%gear-steering%'
            OR name_en ILIKE '%gears%linkage%' OR name_en ILIKE '%power rack%'
            OR name_en ILIKE '%pinion%valve%')`);

  // PS pump extras (reservoir, hose, bracket) → 900604 (ГУР area)
  await run('900604 PS reservoir/hose/bracket',
    `UPDATE parts_products SET subcategory_id = 900604
     WHERE subcategory_id = 17903
       AND name_en ILIKE '%power steering%'`);

  // Remaining steering → stay on L2 (misc)
  const rem2 = await c.query("SELECT COUNT(*) FROM parts_products WHERE subcategory_id = 17903");
  console.log('REMAINING 17903:'.padEnd(42), rem2.rows[0].count);

  if (parseInt(rem2.rows[0].count) > 0) {
    const { rows: leftover } = await c.query("SELECT name_en FROM parts_products WHERE subcategory_id = 17903 LIMIT 10");
    leftover.forEach(r => console.log('  ', r.name_en));
  }

  // ═══════════════════════════════════════════
  // 18001 КУЗОВ — pass 2
  // ═══════════════════════════════════════════
  console.log('\n=== 18001 pass 2 ===');

  await run('900704 Tail gate bumper',
    `UPDATE parts_products SET subcategory_id = 900704
     WHERE subcategory_id = 18001 AND name_en ILIKE '%tail gate%'`);

  // Remaining body → stay on L2
  const rem3 = await c.query("SELECT COUNT(*) FROM parts_products WHERE subcategory_id = 18001");
  console.log('REMAINING 18001:'.padEnd(42), rem3.rows[0].count);

  // ═══════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════
  console.log('\n=== FINAL L3 SUMMARY ===');
  const { rows: summary } = await c.query(`
    SELECT c.parent_id, c.id, c.name_ru, COUNT(p.id) as cnt
    FROM parts_categories c
    LEFT JOIN parts_products p ON p.subcategory_id = c.id
    WHERE c.id >= 900000
    GROUP BY c.parent_id, c.id, c.name_ru
    HAVING COUNT(p.id) > 0
    ORDER BY c.parent_id, c.id
  `);
  let curParent = null;
  let totalL3 = 0;
  summary.forEach(r => {
    if (r.parent_id !== curParent) {
      curParent = r.parent_id;
      console.log('\n  Parent:', r.parent_id);
    }
    console.log('    ' + String(r.id).padEnd(8) + String(r.cnt).padEnd(6) + r.name_ru);
    totalL3 += parseInt(r.cnt);
  });
  console.log('\n  Total on L3:', totalL3);

  const { rows: l2rem } = await c.query(`
    SELECT subcategory_id, COUNT(*) as cnt
    FROM parts_products
    WHERE subcategory_id IN (17701, 17901, 17902, 17903, 17703, 18005, 18001, 18003)
    GROUP BY subcategory_id ORDER BY cnt DESC
  `);
  let totalL2 = 0;
  console.log('\n  Still on L2:');
  l2rem.forEach(r => { console.log('    ' + r.subcategory_id + ': ' + r.cnt); totalL2 += parseInt(r.cnt); });
  console.log('  Total on L2:', totalL2);

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
