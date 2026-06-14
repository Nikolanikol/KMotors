const { getClient } = require('./db');
const fs = require('fs');
const path = require('path');

async function main() {
  const c = getClient();
  await c.connect();

  const { rows: before } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE subcategory_id = 18106) AS doors,
      COUNT(*) FILTER (WHERE subcategory_id = 18113) AS glass,
      COUNT(*) FILTER (WHERE subcategory_id = 18103) AS climate,
      COUNT(*) FILTER (WHERE subcategory_id = 17708) AS intake
    FROM parts_products
  `);
  const b = before[0];
  console.log('══ ПАТЧ 027: Остаточные проблемы ══');
  console.log(`  ДО: Двери=${b.doors} | Стёкла=${b.glass} | Климат=${b.climate} | Впуск=${b.intake}`);
  console.log('');

  const sql = fs.readFileSync(path.join(__dirname, '027_residual_fixes.sql'), 'utf8');
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 10);

  const labels = [
    'INSERT L3 900927/900928/900929/900930',
    'Двери 18106 → 900927 (мелкая фурнитура < ₩20k)',
    'Стёкла 18113 → 900928 (мелкие компоненты < ₩15k)',
    'Климат 18103 → 900929 (мелкие детали < ₩15k)',
    'Впуск 17708 → 900930 (прокладки/< ₩15k)',
  ];

  let totalMoved = 0;
  for (let i = 0; i < statements.length; i++) {
    try {
      const r = await c.query(statements[i]);
      const n = r.rowCount || 0;
      totalMoved += (i > 0 ? n : 0);
      const icon = i === 0 ? '✚' : (n > 0 ? '✓' : '·');
      console.log(`  [${icon}] ${(labels[i] || `stmt ${i + 1}`).padEnd(50)} ${i > 0 ? String(n).padStart(4) + ' шт' : ''}`);
    } catch (e) {
      console.error(`  [✗] ${labels[i] || `stmt ${i}`}: ${e.message}`);
    }
  }

  const { rows: after } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE subcategory_id = 18106) AS doors,
      COUNT(*) FILTER (WHERE subcategory_id = 18113) AS glass,
      COUNT(*) FILTER (WHERE subcategory_id = 18103) AS climate,
      COUNT(*) FILTER (WHERE subcategory_id = 17708) AS intake,
      COUNT(*) FILTER (WHERE subcategory_id = 900927) AS l3_doors,
      COUNT(*) FILTER (WHERE subcategory_id = 900928) AS l3_glass,
      COUNT(*) FILTER (WHERE subcategory_id = 900929) AS l3_climate,
      COUNT(*) FILTER (WHERE subcategory_id = 900930) AS l3_intake
    FROM parts_products
  `);
  const a = after[0];

  console.log('');
  console.log('  ── Результат ──────────────────────────────────────');
  console.log(`  Двери:    ${b.doors} → ${a.doors} шт | +${a.l3_doors} → L3 900927 (0.12кг)`);
  console.log(`  Стёкла:   ${b.glass} → ${a.glass} шт | +${a.l3_glass} → L3 900928 (0.10кг)`);
  console.log(`  Климат:   ${b.climate} → ${a.climate} шт | +${a.l3_climate} → L3 900929 (0.10кг)`);
  console.log(`  Впуск:    ${b.intake} → ${a.intake} шт | +${a.l3_intake} → L3 900930 (0.08кг)`);
  console.log(`  Итого перемещено: ${totalMoved} шт`);

  // Финальный срез
  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log('  ФИНАЛЬНЫЙ ИТОГ: охват каталога (патчи 019-027)');
  console.log('══════════════════════════════════════════════════════');
  const { rows: stats } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE subcategory_id >= 900000
        AND subcategory_id != 900999)                              AS in_l3,
      COUNT(*) FILTER (WHERE subcategory_id IN (
        17799,18199,17999,17899,18099,900999))                     AS in_prochee,
      COUNT(*)                                                     AS total
    FROM parts_products
  `);
  const s = stats[0];
  const pct = v => (parseInt(v) / parseInt(s.total) * 100).toFixed(1);
  console.log(`  Всего товаров:                ${s.total}`);
  console.log(`  В L3 (точный ценовой вес):   ${s.in_l3}  (${pct(s.in_l3)}%)`);
  console.log(`  В catch-all Прочее:           ${s.in_prochee}  (${pct(s.in_prochee)}%)`);

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
