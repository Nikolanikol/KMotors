require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const c = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  const sqlFile = path.join(__dirname, '018_fix_l2_dimensions.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  const statements = sql.split(/;/).map(s => s.replace(/--[^\n]*/g, '').trim()).filter(s => s.length > 0);

  let updated = 0;
  for (const stmt of statements) {
    const result = await c.query(stmt);
    updated += result.rowCount || 0;
  }
  console.log(`Updated dimensions for ${updated} categories`);

  // Verify: ship_method after fix
  console.log('\n=== ship_method ПОСЛЕ фикса ===');
  const { rows } = await c.query(`
    SELECT id, name_ru, ship_method, weight_avg_kg, packed_weight_kg, size_formula_cm
    FROM v_category_logistics
    WHERE id IN (17710,17711,17712,17713,17714,17715,
                 18106,18107,18108,18109,18110,18111,18112,18113,
                 17799,18199,17701,17801,17802,17804,17899,17904,17999,18002,18101)
    ORDER BY id
  `);
  rows.forEach(r => {
    const flag = r.ship_method === 'SEA' ? ' ⚠' : ' ✓';
    console.log(`  [${r.id}] ${(r.name_ru||'').padEnd(28)} method=${(r.ship_method||'?').padEnd(12)} wt=${r.weight_avg_kg}кг  packed=${r.packed_weight_kg}кг  size=${r.size_formula_cm}см${flag}`);
  });

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
