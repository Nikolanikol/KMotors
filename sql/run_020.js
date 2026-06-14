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

  const sql = fs.readFileSync(path.join(__dirname, '020_fix_prochee2.sql'), 'utf8');
  const statements = sql
    .split(/;/)
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 0);

  const labels = [
    // 17799
    'clamp → 900904 Крепёж',
    'glow/spark plug → 17705 Зажигание',
    'duct → 17708 Впуск',
    'cap cheap → 900910 Крышки',
    'heat shield cheap → 900910 Крышки',
    'blower motor → 17713 Кондиционер',
    // 17999
    'wheels generic → 900913 Диски',
    'TPMS → 900905 Датчики',
    'boot cheap → 17905 Приводные валы',
    'bumper rubber → 900904 Крепёж',
    'dynamic damper cheap → 900904',
    // 17899
    'knob all → 18108 Консоль',
    'button → 900907 Переключатели',
    'saft + позиция → 17905 Приводные валы',
    // 18199
    'bracket cheap → 900909 Кронштейны',
    'cap cheap → 900910 Крышки',
    'cover cheap → 900910 Крышки',
    'knob cheap → 900907 Переключатели',
    'duct → 18103 Климат',
  ];

  console.log(`\nВыполняю ${statements.length} statements...\n`);
  let total = 0;

  for (let i = 0; i < statements.length; i++) {
    try {
      const r = await c.query(statements[i]);
      const n = r.rowCount || 0;
      total += n;
      const mark = n > 0 ? '✓' : '·';
      console.log(`  [${mark}] ${(labels[i] || 'stmt ' + (i+1)).padEnd(40)} ${String(n).padStart(4)} шт`);
    } catch (e) {
      console.error(`  [✗] stmt ${i+1}: ${e.message}`);
    }
  }

  console.log(`\nВсего перемещено: ${total} товаров`);

  // ── Итоговый остаток ────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  ИТОГОВЫЙ ОСТАТОК В ПРОЧЕЕ (после патчей 019 + 020)');
  console.log('══════════════════════════════════════════════════════════');
  const { rows: rem } = await c.query(`
    SELECT cat.id, cat.name_ru, COUNT(p.id) AS cnt
    FROM parts_categories cat
    LEFT JOIN parts_products p ON p.subcategory_id = cat.id
    WHERE cat.id IN (17799, 18199, 17999, 17899, 18099)
    GROUP BY cat.id, cat.name_ru ORDER BY cnt DESC
  `);
  let totalProchee = 0;
  rem.forEach(r => {
    const flag = r.cnt < 500 ? '✓' : r.cnt < 1000 ? '△' : '⚠';
    console.log(`  [${r.id}] ${(r.name_ru||'').padEnd(28)} ${String(r.cnt).padStart(5)} шт  ${flag}`);
    totalProchee += parseInt(r.cnt);
  });
  console.log(`  ${'ИТОГО Прочее'.padEnd(28)} ${String(totalProchee).padStart(5)} шт`);

  // ── Финальная статистика всего каталога ────────────────────────────
  console.log('\n  Охват каталога после всех патчей:');
  const { rows: stats } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE subcategory_id IS NOT NULL)         AS has_subcat,
      COUNT(*) FILTER (WHERE subcategory_id >= 900000)           AS in_l3,
      COUNT(*) FILTER (WHERE subcategory_id IN (
        17799,18199,17999,17899,18099))                          AS in_prochee,
      COUNT(*)                                                   AS total
    FROM parts_products
  `);
  const s = stats[0];
  const pct = v => (parseInt(v) / parseInt(s.total) * 100).toFixed(1);
  console.log(`  Всего товаров:          ${s.total}`);
  console.log(`  Есть subcategory_id:    ${s.has_subcat} (${pct(s.has_subcat)}%)`);
  console.log(`  В L3 (вес по цене):     ${s.in_l3} (${pct(s.in_l3)}%)`);
  console.log(`  В Прочее (catch-all):   ${s.in_prochee} (${pct(s.in_prochee)}%)`);

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
