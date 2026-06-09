require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  const patterns = [
    { label: 'sensor', where: "LOWER(p.name_en) LIKE '%sensor%'" },
    { label: 'actuator/solenoid', where: "LOWER(p.name_en) SIMILAR TO '%(actuator|solenoid)%'" },
    { label: 'switch', where: "LOWER(p.name_en) LIKE '%switch%'" },
    { label: 'relay', where: "LOWER(p.name_en) LIKE '%relay%'" },
    { label: 'module/ecu/control unit', where: "LOWER(p.name_en) SIMILAR TO '%(module|ecu|control unit)%'" },
    { label: 'wire/harness/cable/connector', where: "LOWER(p.name_en) SIMILAR TO '%(wire|wiring|harness|cable|connector)%'" },
    { label: 'bracket/mount (<30k)', where: "LOWER(p.name_en) SIMILAR TO '%(bracket|mounting)%' AND p.price_krw < 30000" },
    { label: 'cover/cap/shield (<25k)', where: "LOWER(p.name_en) SIMILAR TO '%(cover|cap|shield|guard)%' AND p.price_krw < 25000" },
    { label: 'hose/tube/pipe (<30k)', where: "LOWER(p.name_en) SIMILAR TO '%(hose|tube|pipe)%' AND p.price_krw < 30000" },
    { label: 'motor (not starter, <80k)', where: "LOWER(p.name_en) LIKE '%motor%' AND LOWER(p.name_en) NOT LIKE '%starter motor%' AND p.price_krw < 80000" },
  ];

  console.log('════════════════════════════════════════════════════════════');
  console.log('  МЕЛКИЕ ДЕТАЛИ В ТЯЖЁЛЫХ КАТЕГОРИЯХ (cat weight > 1кг)');
  console.log('════════════════════════════════════════════════════════════\n');

  let grandTotal = 0;

  for (const p of patterns) {
    const { rows } = await c.query(`
      SELECT p.subcategory_id, cat.name_ru, cat.weight_avg_kg,
             COUNT(*) AS cnt, ROUND(AVG(p.price_krw)) AS avg_price
      FROM parts_products p
      JOIN parts_categories cat ON cat.id = p.subcategory_id
      WHERE ${p.where}
        AND p.subcategory_id NOT BETWEEN 900901 AND 900910
        AND COALESCE(cat.weight_avg_kg, 2) > 1
      GROUP BY p.subcategory_id, cat.name_ru, cat.weight_avg_kg
      ORDER BY cnt DESC
      LIMIT 10
    `);
    const total = rows.reduce((s, r) => s + parseInt(r.cnt), 0);
    grandTotal += total;
    console.log(`── ${p.label} (${total} в тяжёлых категориях) ──`);
    rows.forEach(r => {
      console.log(`  [${r.subcategory_id}] ${(r.name_ru||'?').padEnd(30)} ${String(r.cnt).padStart(4)} шт  weight=${r.weight_avg_kg||'?'}кг  avg₩${r.avg_price}`);
    });
    console.log('');
  }

  console.log(`════════════════════════════════════════════════════════════`);
  console.log(`  ИТОГО: ~${grandTotal} (с пересечениями между группами)`);
  console.log(`════════════════════════════════════════════════════════════`);

  // Уже в правильных лёгких категориях (900901-900910) — не трогаем
  const { rows: ok } = await c.query(`
    SELECT COUNT(*) AS cnt FROM parts_products
    WHERE subcategory_id BETWEEN 900901 AND 900910
  `);
  console.log(`\n  Уже в кросс-категорийных L3 (крепёж и т.д.): ${ok[0].cnt}`);

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
