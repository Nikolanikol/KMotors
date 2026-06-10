const { getClient } = require('./db');
const fs = require('fs');
const path = require('path');

async function main() {
  const c = getClient();
  await c.connect();

  const { rows: before } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE subcategory_id = 18106) AS doors,
      COUNT(*) FILTER (WHERE subcategory_id = 18112) AS bumpers,
      COUNT(*) FILTER (WHERE subcategory_id = 17707) AS fuel
    FROM parts_products
  `);
  const b = before[0];
  console.log('══ ПАТЧ 025: Высокая численность ══');
  console.log(`  ДО: Двери=${b.doors} | Бампер=${b.bumpers} | Топливо=${b.fuel}`);
  console.log('');

  const sql = fs.readFileSync(path.join(__dirname, '025_high_count_categories.sql'), 'utf8');
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 10);

  const labels = [
    'INSERT L3 900919/900920/900921/900922',
    'Двери 18106 → 900919 (ручки и замки)',
    'Двери 18106 → 900920 (уплотнители)',
    'Бампер 18112 → 900921 (< ₩10k)',
    'Топливо 17707 → 900922 (< ₩12k + keywords)',
  ];

  let totalMoved = 0;
  for (let i = 0; i < statements.length; i++) {
    try {
      const r = await c.query(statements[i]);
      const n = r.rowCount || 0;
      totalMoved += (i > 0 ? n : 0);
      const label = labels[i] || `stmt ${i + 1}`;
      const icon = i === 0 ? '✚' : (n > 0 ? '✓' : '·');
      console.log(`  [${icon}] ${label.padEnd(48)} ${i > 0 ? String(n).padStart(4) + ' шт' : ''}`);
    } catch (e) {
      console.error(`  [✗] ${labels[i] || `stmt ${i}`}: ${e.message}`);
    }
  }

  const { rows: after } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE subcategory_id = 18106) AS doors,
      COUNT(*) FILTER (WHERE subcategory_id = 18112) AS bumpers,
      COUNT(*) FILTER (WHERE subcategory_id = 17707) AS fuel,
      COUNT(*) FILTER (WHERE subcategory_id = 900919) AS l3_handles,
      COUNT(*) FILTER (WHERE subcategory_id = 900920) AS l3_seals,
      COUNT(*) FILTER (WHERE subcategory_id = 900921) AS l3_bumper,
      COUNT(*) FILTER (WHERE subcategory_id = 900922) AS l3_fuel
    FROM parts_products
  `);
  const a = after[0];

  console.log('');
  console.log('  ── Результат ──────────────────────────────────────');
  console.log(`  Двери:    ${b.doors} → ${a.doors} шт | +${a.l3_handles} ручки (0.4кг) +${a.l3_seals} уплотн. (0.25кг)`);
  console.log(`  Бампер:   ${b.bumpers} → ${a.bumpers} шт | +${a.l3_bumper} → L3 900921 (0.06кг)`);
  console.log(`  Топливо:  ${b.fuel} → ${a.fuel} шт | +${a.l3_fuel} → L3 900922 (0.10кг)`);
  console.log(`  Итого перемещено: ${totalMoved} шт`);

  console.log('');
  console.log('  ── Примеры ───────────────────────────────────────');
  const { rows: ex } = await c.query(`
    SELECT subcategory_id, name_en, price_krw,
      CASE subcategory_id
        WHEN 900919 THEN 'Ручки→0.4кг'
        WHEN 900920 THEN 'Уплотн→0.25кг'
        WHEN 900921 THEN 'Бампер→0.06кг'
        WHEN 900922 THEN 'Топливо→0.1кг'
      END AS cat
    FROM parts_products
    WHERE subcategory_id IN (900919, 900920, 900921, 900922)
    ORDER BY subcategory_id, price_krw
    LIMIT 16
  `);
  ex.forEach(r =>
    console.log(`  [${r.cat}] ₩${String(r.price_krw).padStart(7)} | ${(r.name_en || '').substring(0, 55)}`)
  );

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
