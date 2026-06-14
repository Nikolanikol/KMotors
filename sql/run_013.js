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

  const sqlFile = path.join(__dirname, '013_catalog_restructure.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  // Split by semicolons but keep track of statement index
  const statements = sql
    .split(/;/)
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 0);

  console.log(`Executing ${statements.length} statements...\n`);

  let inserts = 0;
  let updates = 0;
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
        inserts++;
        console.log(`  [${i + 1}/${statements.length}] INSERT — ${rows} row(s)`);
      } else if (isUpdate) {
        updates++;
        // Extract target category from SET subcategory_id = XXXXXX
        const match = stmt.match(/subcategory_id\s*=\s*(\d+)/);
        const target = match ? match[1] : '?';
        console.log(`  [${i + 1}/${statements.length}] UPDATE → ${target} — ${rows} row(s)`);
      }
    } catch (err) {
      console.error(`  [${i + 1}/${statements.length}] ERROR: ${err.message}`);
      console.error(`  Statement: ${stmt.substring(0, 100)}...`);
    }
  }

  console.log(`\n════════════════════════════════════════`);
  console.log(`  INSERTs: ${inserts}`);
  console.log(`  UPDATEs: ${updates}`);
  console.log(`  Всего строк затронуто: ${totalRows}`);
  console.log(`════════════════════════════════════════`);

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
