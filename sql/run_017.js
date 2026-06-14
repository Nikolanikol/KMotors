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

  const sqlFile = path.join(__dirname, '017_crosscut_small_parts.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  const statements = sql
    .split(/;/)
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 0);

  console.log(`Executing ${statements.length} statements...\n`);
  let totalRows = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      const result = await c.query(stmt);
      const rows = result.rowCount || 0;
      totalRows += rows;
      if (rows > 0) {
        const match = stmt.match(/subcategory_id\s*=\s*(\d+)/);
        const target = match ? match[1] : '?';
        const isInsert = stmt.toUpperCase().startsWith('INSERT');
        console.log(`  [${i + 1}/${statements.length}] ${isInsert ? 'INSERT' : '→ ' + target} — ${rows} row(s)`);
      }
    } catch (err) {
      console.error(`  [${i + 1}/${statements.length}] ERROR: ${err.message}`);
    }
  }
  console.log(`\nВсего затронуто: ${totalRows}`);

  // Verify the specific item
  const { rows: check } = await c.query(`
    SELECT p.part_number, p.name_en, p.subcategory_id, cat.name_ru, cat.weight_avg_kg
    FROM parts_products p
    JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE p.part_number = '29620K9500'
  `);
  console.log('\n=== Проверка: Actuator-Electric Sound Generator ===');
  if (check[0]) {
    console.log(`  БЫЛО: [17712] Стартер и генератор (5кг)`);
    console.log(`  СТАЛО: [${check[0].subcategory_id}] ${check[0].name_ru} (${check[0].weight_avg_kg}кг)`);
  }

  // New L3 counts
  console.log('\n=== Новые кросс-категорийные L3 ===');
  const { rows: counts } = await c.query(`
    SELECT cat.id, cat.name_ru, COUNT(p.id) AS cnt, cat.weight_min_kg, cat.weight_max_kg
    FROM parts_categories cat
    LEFT JOIN parts_products p ON p.subcategory_id = cat.id
    WHERE cat.id BETWEEN 900905 AND 900912
    GROUP BY cat.id, cat.name_ru, cat.weight_min_kg, cat.weight_max_kg
    ORDER BY cat.id
  `);
  counts.forEach(r => {
    console.log(`  ${r.id} ${r.name_ru.padEnd(28)} ${String(r.cnt).padStart(5)} шт  ${r.weight_min_kg}–${r.weight_max_kg}кг`);
  });

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
