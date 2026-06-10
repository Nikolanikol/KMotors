const { getClient } = require('./db');
const fs = require('fs');
const path = require('path');

async function main() {
  const c = getClient();
  await c.connect();

  const { rows: before } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE subcategory_id = 17715) AS elec,
      COUNT(*) FILTER (WHERE subcategory_id = 18111) AS lights,
      COUNT(*) FILTER (WHERE subcategory_id = 17711) AS turbo,
      COUNT(*) FILTER (WHERE subcategory_id = 17804) AS clutch
    FROM parts_products
  `);
  const b = before[0];
  console.log('══ ПАТЧ 026: Остальные приоритетные категории ══');
  console.log(`  ДО: Электрика=${b.elec} | Освещение=${b.lights} | Турбо=${b.turbo} | Сцепление=${b.clutch}`);
  console.log('');

  const sql = fs.readFileSync(path.join(__dirname, '026_remaining_categories.sql'), 'utf8');
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 10);

  const labels = [
    'INSERT L3 900923/900924/900925/900926',
    'Электрика 17715 → 900923 (разъёмы/датчики)',
    'Освещение 18111 → 900924 (лампы/мелкое)',
    'Турбо 17711 → 900925 (прокладки/мелкое)',
    'Сцепление 17804 → 900926 (< ₩15k)',
  ];

  let totalMoved = 0;
  for (let i = 0; i < statements.length; i++) {
    try {
      const r = await c.query(statements[i]);
      const n = r.rowCount || 0;
      totalMoved += (i > 0 ? n : 0);
      const label = labels[i] || `stmt ${i + 1}`;
      const icon = i === 0 ? '✚' : (n > 0 ? '✓' : '·');
      console.log(`  [${icon}] ${label.padEnd(50)} ${i > 0 ? String(n).padStart(4) + ' шт' : ''}`);
    } catch (e) {
      console.error(`  [✗] ${labels[i] || `stmt ${i}`}: ${e.message}`);
    }
  }

  const { rows: after } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE subcategory_id = 17715) AS elec,
      COUNT(*) FILTER (WHERE subcategory_id = 18111) AS lights,
      COUNT(*) FILTER (WHERE subcategory_id = 17711) AS turbo,
      COUNT(*) FILTER (WHERE subcategory_id = 17804) AS clutch,
      COUNT(*) FILTER (WHERE subcategory_id = 900923) AS l3_elec,
      COUNT(*) FILTER (WHERE subcategory_id = 900924) AS l3_lights,
      COUNT(*) FILTER (WHERE subcategory_id = 900925) AS l3_turbo,
      COUNT(*) FILTER (WHERE subcategory_id = 900926) AS l3_clutch
    FROM parts_products
  `);
  const a = after[0];

  console.log('');
  console.log('  ── Результат ──────────────────────────────────────');
  console.log(`  Электрика:  ${b.elec} → ${a.elec} шт | +${a.l3_elec} → L3 900923 (0.08кг)`);
  console.log(`  Освещение:  ${b.lights} → ${a.lights} шт | +${a.l3_lights} → L3 900924 (0.06кг)`);
  console.log(`  Турбо:      ${b.turbo} → ${a.turbo} шт | +${a.l3_turbo} → L3 900925 (0.15кг)`);
  console.log(`  Сцепление:  ${b.clutch} → ${a.clutch} шт | +${a.l3_clutch} → L3 900926 (0.10кг)`);
  console.log(`  Итого перемещено: ${totalMoved} шт`);

  // Итоговый срез всего каталога
  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log('  ИТОГ: охват каталога после патчей 024-026');
  console.log('══════════════════════════════════════════════════════');
  const { rows: stats } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE subcategory_id >= 900000
        AND subcategory_id != 900999)                              AS in_l3,
      COUNT(*) FILTER (WHERE subcategory_id IN (
        17799,18199,17999,17899,18099,900999))                     AS in_prochee,
      COUNT(*) FILTER (WHERE subcategory_id = 900999)             AS in_staging,
      COUNT(*)                                                     AS total
    FROM parts_products
  `);
  const s = stats[0];
  const pct = v => (parseInt(v) / parseInt(s.total) * 100).toFixed(1);
  console.log(`  Всего товаров:                 ${s.total}`);
  console.log(`  В L3 (точный вес):             ${s.in_l3}  (${pct(s.in_l3)}%)`);
  console.log(`  В catch-all Прочее:            ${s.in_prochee}  (${pct(s.in_prochee)}%)`);
  console.log(`  В staging 900999:              ${s.in_staging}  (${pct(s.in_staging)}%)`);

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
