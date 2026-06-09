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

  // Before count
  const { rows: before } = await c.query(`
    SELECT COUNT(*) AS cnt FROM parts_products WHERE subcategory_id IS NULL
  `);
  console.log(`BEFORE: ${before[0].cnt} товаров с NULL subcategory\n`);

  const sqlFile = path.join(__dirname, '016_classify_null_subcategory.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  const statements = sql
    .split(/;/)
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 0);

  console.log(`Executing ${statements.length} statements...\n`);
  let totalRows = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const isInsert = stmt.toUpperCase().startsWith('INSERT');
    const isUpdate = stmt.toUpperCase().startsWith('UPDATE');

    try {
      const result = await c.query(stmt);
      const rows = result.rowCount || 0;
      totalRows += rows;

      if (isInsert) {
        console.log(`  [${i + 1}/${statements.length}] INSERT — ${rows} row(s)`);
      } else if (isUpdate) {
        const match = stmt.match(/subcategory_id\s*=\s*(\d+)/);
        const target = match ? match[1] : '?';
        if (rows > 0) {
          console.log(`  [${i + 1}/${statements.length}] → ${target} — ${rows} row(s)`);
        }
      }
    } catch (err) {
      console.error(`  [${i + 1}/${statements.length}] ERROR: ${err.message}`);
      console.error(`  Statement: ${stmt.substring(0, 120)}...`);
    }
  }

  // After count
  const { rows: after } = await c.query(`
    SELECT COUNT(*) AS cnt FROM parts_products WHERE subcategory_id IS NULL
  `);

  console.log(`\n════════════════════════════════════════`);
  console.log(`  Всего строк затронуто: ${totalRows}`);
  console.log(`  NULL subcategory: ${before[0].cnt} → ${after[0].cnt}`);
  console.log(`════════════════════════════════════════`);

  // Breakdown by new category
  console.log('\nРаспределение по новым L2:');
  const { rows: dist } = await c.query(`
    SELECT p.subcategory_id, cat.name_ru, COUNT(*) AS cnt
    FROM parts_products p
    JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE p.subcategory_id IN (18106,18107,18108,18109,18110,18111,18112,18113,
                               17710,17711,17712,17713,17714,17715,
                               18199,17799,18101,18102,18103,18104,18105,18006)
    GROUP BY p.subcategory_id, cat.name_ru
    ORDER BY cnt DESC
  `);
  dist.forEach(r => {
    console.log(`  [${r.subcategory_id}] ${r.name_ru.padEnd(30)} ${String(r.cnt).padStart(5)}`);
  });

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
