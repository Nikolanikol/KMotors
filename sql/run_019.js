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

  const sql = fs.readFileSync(path.join(__dirname, '019_fix_prochee.sql'), 'utf8');
  const statements = sql
    .split(/;/)
    .map(s => s.replace(/--[^\n]*/g, '').trim())
    .filter(s => s.length > 0);

  console.log(`\nВыполняю ${statements.length} statements...\n`);

  // Labels for each statement (in order)
  const labels = [
    'INSERT новые L3 (900913 диски, 900914 педали)',
    'Диски → 900913 (aluminum/alloy/steel wheel)',
    'Педали → 900914 (pedal/foot rest)',
    'Рукоятки КПП → 18108 Консоль (gear knob)',
    'ШРУСы → 17905 Приводные валы (cv joint/constant velocity)',
    'Спойлеры → 18112 Бампер (spoiler)',
    'Эмблемы → 18112 Бампер (emblem)',
    'Защита арок → 18099 Кузов (wheel guard)',
    'Провода → 900908 (extension cord/harness)',
    'Пыльники → 17905 Приводные валы (cv boot)',
    'Canister → 17707 Топливная (canister)',
    'Рычаги → 17999 Шасси (lower/control arm)',
    'Коленвал → 17799 Двигатель (crankshaft)',
  ];

  let totalMoved = 0;
  for (let i = 0; i < statements.length; i++) {
    try {
      const result = await c.query(statements[i]);
      const rows = result.rowCount || 0;
      totalMoved += rows;
      const label = labels[i] || `stmt ${i + 1}`;
      const marker = rows > 0 ? '✓' : '·';
      console.log(`  [${marker}] ${label}: ${rows} шт`);
    } catch (err) {
      console.error(`  [✗] stmt ${i + 1}: ${err.message}`);
    }
  }
  console.log(`\nВсего перемещено: ${totalMoved} товаров\n`);

  // ── Проверка: остаток в Прочее ──────────────────────────────────────
  console.log('══════════════════════════════════════════════════════════');
  console.log('  ОСТАТОК В ПРОЧЕЕ ПОСЛЕ ПАТЧА');
  console.log('══════════════════════════════════════════════════════════');
  const { rows: rem } = await c.query(`
    SELECT cat.id, cat.name_ru, COUNT(p.id) AS cnt
    FROM parts_categories cat
    LEFT JOIN parts_products p ON p.subcategory_id = cat.id
    WHERE cat.id IN (17799, 18199, 17999, 17899, 18099)
    GROUP BY cat.id, cat.name_ru
    ORDER BY cnt DESC
  `);
  rem.forEach(r => {
    const arrow = r.cnt < 500 ? ' ✓' : (r.cnt < 1000 ? ' △' : ' ⚠');
    console.log(`  [${r.id}] ${(r.name_ru||'').padEnd(28)} ${String(r.cnt).padStart(5)} шт${arrow}`);
  });

  // ── Новые L3 — сколько получили ────────────────────────────────────
  console.log('\n  Новые L3 категории:');
  const { rows: newCats } = await c.query(`
    SELECT cat.id, cat.name_ru, COUNT(p.id) AS cnt, cat.weight_avg_kg
    FROM parts_categories cat
    LEFT JOIN parts_products p ON p.subcategory_id = cat.id
    WHERE cat.id IN (900913, 900914)
    GROUP BY cat.id, cat.name_ru, cat.weight_avg_kg
    ORDER BY cat.id
  `);
  newCats.forEach(r => {
    console.log(`  [${r.id}] ${(r.name_ru||'').padEnd(28)} ${String(r.cnt).padStart(5)} шт  weight_avg=${r.weight_avg_kg}кг`);
  });

  // ── Проверка: приняли правильные категории ─────────────────────────
  console.log('\n  Принявшие категории:');
  const { rows: dest } = await c.query(`
    SELECT cat.id, cat.name_ru, COUNT(p.id) AS cnt
    FROM parts_categories cat
    LEFT JOIN parts_products p ON p.subcategory_id = cat.id
    WHERE cat.id IN (17905, 18108, 18112, 18099, 17707, 17999, 17799, 900908)
    GROUP BY cat.id, cat.name_ru
    ORDER BY cat.id
  `);
  dest.forEach(r => {
    console.log(`  [${r.id}] ${(r.name_ru||'').padEnd(32)} ${String(r.cnt).padStart(5)} шт`);
  });

  // ── Спот-чек: один диск ────────────────────────────────────────────
  console.log('\n  Спот-чек: пример диска:');
  const { rows: wheel } = await c.query(`
    SELECT p.part_number, p.name_en, p.subcategory_id,
           cat.name_ru, cat.weight_avg_kg
    FROM parts_products p
    JOIN parts_categories cat ON cat.id = p.subcategory_id
    WHERE p.subcategory_id = 900913
    ORDER BY p.price_krw DESC
    LIMIT 3
  `);
  wheel.forEach(r => {
    console.log(`  · [${r.subcategory_id}] ${r.name_en} → ${r.name_ru} (${r.weight_avg_kg}кг)`);
  });

  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
