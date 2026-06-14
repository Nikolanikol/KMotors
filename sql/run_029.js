const { getClient } = require('./db');
const fs = require('fs');
const path = require('path');

async function main() {
  const c = getClient();
  await c.connect();

  // Снапшот ДО
  const { rows: b } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE subcategory_id = 17799)  AS prochee,
      COUNT(*) FILTER (WHERE subcategory_id = 17705)  AS ignition,
      COUNT(*) FILTER (WHERE subcategory_id = 900208) AS abs_sensor
    FROM parts_products
  `);
  const bef = b[0];
  console.log('══ ПАТЧ 029: Тяжёлые агрегаты, маховики, свечи, ABS ══');
  console.log(`  ДО: Прочее_двиг=${bef.prochee} | Зажигание=${bef.ignition} | ABS_сенсор=${bef.abs_sensor}`);
  console.log('');

  const sql = fs.readFileSync(path.join(__dirname, '029_heavy_parts_and_plugs.sql'), 'utf8');
  const stmts = sql
    .split(/;\s*\n/)
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 10);

  const labels = [
    'INSERT L3 900933/900934/900935/900936',
    'Прочее_двиг 17799 → 900933 (тяжёлые агрегаты)',
    'Прочее_двиг 17799 → 900934 (маховики)',
    'Зажигание 17705 → 900935 (свечи)',
    'ABS_датчик 900208 → 900936 (гидроблок ABS)',
  ];

  let totalMoved = 0;
  for (let i = 0; i < stmts.length; i++) {
    try {
      const r = await c.query(stmts[i]);
      const n = r.rowCount || 0;
      totalMoved += (i > 0 ? n : 0);
      const icon = i === 0 ? '✚' : (n > 0 ? '✓' : '·');
      console.log(`  [${icon}] ${(labels[i]||'stmt '+i).padEnd(52)} ${i > 0 ? String(n).padStart(4)+' шт' : ''}`);
    } catch(e) {
      console.error(`  [✗] ${labels[i]||'stmt '+i}: ${e.message}`);
    }
  }

  // Снапшот ПОСЛЕ
  const { rows: a } = await c.query(`
    SELECT
      COUNT(*) FILTER (WHERE subcategory_id = 17799)  AS prochee,
      COUNT(*) FILTER (WHERE subcategory_id = 17705)  AS ignition,
      COUNT(*) FILTER (WHERE subcategory_id = 900208) AS abs_sensor,
      COUNT(*) FILTER (WHERE subcategory_id = 900933) AS l3_heavy,
      COUNT(*) FILTER (WHERE subcategory_id = 900934) AS l3_flywheel,
      COUNT(*) FILTER (WHERE subcategory_id = 900935) AS l3_plugs,
      COUNT(*) FILTER (WHERE subcategory_id = 900936) AS l3_abs
    FROM parts_products
  `);
  const aft = a[0];

  console.log('');
  console.log('  ── Результат ───────────────────────────────────────────');
  console.log(`  Прочее_двиг:  ${bef.prochee} → ${aft.prochee} шт | +${aft.l3_heavy} агрегаты(60кг SEA) +${aft.l3_flywheel} маховики(9кг)`);
  console.log(`  Зажигание:    ${bef.ignition} → ${aft.ignition} шт | +${aft.l3_plugs} → свечи (0.10кг)`);
  console.log(`  ABS_датчик:   ${bef.abs_sensor} → ${aft.abs_sensor} шт | +${aft.l3_abs} → гидроблок ABS (3кг)`);
  console.log(`  Итого: ${totalMoved} шт перемещено`);

  // Проверяем — что попало в тяжёлые агрегаты
  console.log('');
  console.log('  ── Что в 900933 (тяжёлые)? ────────────────────────────');
  const { rows: heavy } = await c.query(`
    SELECT name_en, price_krw FROM parts_products
    WHERE subcategory_id = 900933
    ORDER BY price_krw DESC LIMIT 15
  `);
  heavy.forEach(r => console.log(`    ₩${String(r.price_krw).padStart(11)} | ${(r.name_en||'').substring(0,65)}`));

  // Что в маховиках
  console.log('');
  console.log('  ── Что в 900934 (маховики)? ────────────────────────────');
  const { rows: fw } = await c.query(`
    SELECT name_en, price_krw, weight_kg FROM parts_products
    WHERE subcategory_id = 900934
    ORDER BY price_krw DESC LIMIT 10
  `);
  fw.forEach(r => console.log(`    ${String(r.weight_kg||'?').padStart(5)}кг | ₩${String(r.price_krw).padStart(10)} | ${(r.name_en||'').substring(0,55)}`));

  // Что осталось в Прочее двигатель (самые дорогие — проверяем нет ли пропущенных)
  console.log('');
  console.log('  ── Остаток 17799 топ-15 дорогих (пропущенные?) ────────');
  const { rows: rem } = await c.query(`
    SELECT name_en, price_krw FROM parts_products
    WHERE subcategory_id = 17799
    ORDER BY price_krw DESC LIMIT 15
  `);
  rem.forEach(r => console.log(`    ₩${String(r.price_krw).padStart(10)} | ${(r.name_en||'').substring(0,65)}`));

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
