require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const c = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const run = async (label, sql) => {
    const r = await c.query(sql);
    console.log(label.padEnd(38), r.rowCount, 'rows');
    return r.rowCount;
  };

  // ═══════════════════════════════════════════════════════════
  // 17901 ТОРМОЗНАЯ
  // ═══════════════════════════════════════════════════════════
  console.log('=== 17901 ТОРМОЗНАЯ ===');

  await run('900212 Accessories (pass1)',
    `UPDATE parts_products SET subcategory_id = 900212
     WHERE subcategory_id = 17901
       AND (name_en ILIKE '%spring%' OR name_en ILIKE '%bolt%' OR name_en ILIKE '%clip%'
            OR name_en ILIKE '%shim%' OR name_en ILIKE '%washer%' OR name_en ILIKE '%o-ring%'
            OR name_en ILIKE '%rubber pad%' OR name_en ILIKE '%pedal pad%'
            OR (name_en ILIKE '%dust%' AND name_en ILIKE '%cover%')
            OR (name_en ILIKE '%dust%' AND name_en ILIKE '%boot%'))`);

  await run('900201 Front pads',
    `UPDATE parts_products SET subcategory_id = 900201
     WHERE subcategory_id = 17901 AND name_en ILIKE '%pad%' AND name_en ILIKE '%front%'`);

  await run('900202 Rear pads',
    `UPDATE parts_products SET subcategory_id = 900202
     WHERE subcategory_id = 17901 AND name_en ILIKE '%pad%' AND name_en ILIKE '%rear%'`);

  await run('900203 Front disc',
    `UPDATE parts_products SET subcategory_id = 900203
     WHERE subcategory_id = 17901
       AND (name_en ILIKE '%disc%' OR name_en ILIKE '%rotor%')
       AND name_en ILIKE '%front%'
       AND name_en NOT ILIKE '%cover%' AND name_en NOT ILIKE '%piston%'
       AND name_en NOT ILIKE '%seal%' AND name_en NOT ILIKE '%kit%'`);

  await run('900204 Rear disc',
    `UPDATE parts_products SET subcategory_id = 900204
     WHERE subcategory_id = 17901
       AND (name_en ILIKE '%disc%' OR name_en ILIKE '%rotor%')
       AND name_en ILIKE '%rear%'
       AND name_en NOT ILIKE '%cover%' AND name_en NOT ILIKE '%piston%'
       AND name_en NOT ILIKE '%seal%' AND name_en NOT ILIKE '%kit%'`);

  await run('900205 Caliper',
    `UPDATE parts_products SET subcategory_id = 900205
     WHERE subcategory_id = 17901 AND name_en ILIKE '%caliper%'
       AND name_en NOT ILIKE '%kit%' AND name_en NOT ILIKE '%pin%'
       AND name_en NOT ILIKE '%guide%' AND name_en NOT ILIKE '%slider%'
       AND name_en NOT ILIKE '%bracket%' AND name_en NOT ILIKE '%bushing%'
       AND name_en NOT ILIKE '%spring%' AND name_en NOT ILIKE '%seal%'`);

  await run('900206 Hose/tube',
    `UPDATE parts_products SET subcategory_id = 900206
     WHERE subcategory_id = 17901
       AND (name_en ILIKE '%hose%' OR name_en ILIKE '%tube%' OR name_en ILIKE '%line%')`);

  await run('900207 Master cylinder',
    `UPDATE parts_products SET subcategory_id = 900207
     WHERE subcategory_id = 17901 AND name_en ILIKE '%master cylinder%'`);

  await run('900208 ABS',
    `UPDATE parts_products SET subcategory_id = 900208
     WHERE subcategory_id = 17901
       AND (name_en ILIKE '%abs%' OR name_en ILIKE '%anti-lock%')`);

  await run('900209 Drum',
    `UPDATE parts_products SET subcategory_id = 900209
     WHERE subcategory_id = 17901 AND name_en ILIKE '%drum%' AND name_en NOT ILIKE '%shoe%'`);

  await run('900210 Shoes',
    `UPDATE parts_products SET subcategory_id = 900210
     WHERE subcategory_id = 17901 AND name_en ILIKE '%shoe%'`);

  await run('900211 Booster',
    `UPDATE parts_products SET subcategory_id = 900211
     WHERE subcategory_id = 17901
       AND (name_en ILIKE '%booster%' OR name_en ILIKE '%vacuum%')`);

  await run('900212 Accessories (pass2)',
    `UPDATE parts_products SET subcategory_id = 900212
     WHERE subcategory_id = 17901
       AND (name_en ILIKE '%kit%' OR name_en ILIKE '%seal%' OR name_en ILIKE '%piston%'
            OR name_en ILIKE '%cover%' OR name_en ILIKE '%shield%' OR name_en ILIKE '%pin%'
            OR name_en ILIKE '%guide%' OR name_en ILIKE '%slider%' OR name_en ILIKE '%bushing%'
            OR name_en ILIKE '%bracket%' OR name_en ILIKE '%mounting%' OR name_en ILIKE '%chamber%'
            OR name_en ILIKE '%valve%' OR name_en ILIKE '%switch%' OR name_en ILIKE '%sensor%'
            OR name_en ILIKE '%indicator%' OR name_en ILIKE '%cylinder%' OR name_en ILIKE '%caliper%'
            OR name_en ILIKE '%disc%' OR name_en ILIKE '%rotor%' OR name_en ILIKE '%pad%'
            OR name_en ILIKE '%drum%')`);

  let rem = await c.query("SELECT COUNT(*) FROM parts_products WHERE subcategory_id = 17901");
  console.log('REMAINING on 17901:'.padEnd(38), rem.rows[0].count);

  // ═══════════════════════════════════════════════════════════
  // 17902 ПОДВЕСКА
  // ═══════════════════════════════════════════════════════════
  console.log('\n=== 17902 ПОДВЕСКА ===');

  await run('900304 Ball joint',
    `UPDATE parts_products SET subcategory_id = 900304
     WHERE subcategory_id = 17902 AND name_en ILIKE '%ball joint%'`);

  await run('900306 Bushing',
    `UPDATE parts_products SET subcategory_id = 900306
     WHERE subcategory_id = 17902 AND name_en ILIKE '%bushing%'`);

  await run('900305 Stabilizer link',
    `UPDATE parts_products SET subcategory_id = 900305
     WHERE subcategory_id = 17902 AND name_en ILIKE '%stabilizer%' AND name_en ILIKE '%link%'`);

  await run('900307 Strut mount',
    `UPDATE parts_products SET subcategory_id = 900307
     WHERE subcategory_id = 17902
       AND (name_en ILIKE '%strut mount%' OR name_en ILIKE '%strut support%' OR name_en ILIKE '%strut bearing%')`);

  await run('900303 Control arm',
    `UPDATE parts_products SET subcategory_id = 900303
     WHERE subcategory_id = 17902
       AND (name_en ILIKE '%control arm%' OR name_en ILIKE '%lower arm%' OR name_en ILIKE '%upper arm%' OR name_en ILIKE '%trailing arm%')`);

  await run('900302 Spring (no shock)',
    `UPDATE parts_products SET subcategory_id = 900302
     WHERE subcategory_id = 17902
       AND (name_en ILIKE '%spring%' OR name_en ILIKE '%coil%')
       AND name_en NOT ILIKE '%shock%' AND name_en NOT ILIKE '%absorber%'`);

  await run('900301 Shock/strut (incl combo)',
    `UPDATE parts_products SET subcategory_id = 900301
     WHERE subcategory_id = 17902
       AND (name_en ILIKE '%shock%' OR name_en ILIKE '%absorber%' OR name_en ILIKE '%strut%')`);

  await run('900305 Remaining link/stab',
    `UPDATE parts_products SET subcategory_id = 900305
     WHERE subcategory_id = 17902
       AND (name_en ILIKE '%stabilizer%' OR name_en ILIKE '%sway%' OR name_en ILIKE '%link%')`);

  rem = await c.query("SELECT COUNT(*) FROM parts_products WHERE subcategory_id = 17902");
  console.log('REMAINING on 17902:'.padEnd(38), rem.rows[0].count);

  // ═══════════════════════════════════════════════════════════
  // 17903 РУЛЕВОЕ
  // ═══════════════════════════════════════════════════════════
  console.log('\n=== 17903 РУЛЕВОЕ ===');

  await run('900607 Airbag',
    `UPDATE parts_products SET subcategory_id = 900607
     WHERE subcategory_id = 17903 AND name_en ILIKE '%airbag%'`);

  await run('900608 Switches',
    `UPDATE parts_products SET subcategory_id = 900608
     WHERE subcategory_id = 17903
       AND (name_en ILIKE '%switch%' OR name_en ILIKE '%remote control%')`);

  await run('900601 Steering rack/gear',
    `UPDATE parts_products SET subcategory_id = 900601
     WHERE subcategory_id = 17903
       AND (name_en ILIKE '%steering rack%' OR name_en ILIKE '%steering gear%' OR name_en ILIKE '%gear box%')`);

  await run('900602 Tie rod end',
    `UPDATE parts_products SET subcategory_id = 900602
     WHERE subcategory_id = 17903 AND name_en ILIKE '%tie rod end%'`);

  await run('900603 Tie rod',
    `UPDATE parts_products SET subcategory_id = 900603
     WHERE subcategory_id = 17903 AND name_en ILIKE '%tie rod%'`);

  await run('900604 PS pump/motor',
    `UPDATE parts_products SET subcategory_id = 900604
     WHERE subcategory_id = 17903 AND name_en ILIKE '%power steering%'
       AND (name_en ILIKE '%pump%' OR name_en ILIKE '%motor%')`);

  await run('900605 Column',
    `UPDATE parts_products SET subcategory_id = 900605
     WHERE subcategory_id = 17903
       AND (name_en ILIKE '%steering column%' OR name_en ILIKE '%column%')`);

  await run('900609 Shaft/joint',
    `UPDATE parts_products SET subcategory_id = 900609
     WHERE subcategory_id = 17903
       AND (name_en ILIKE '%shaft%' OR name_en ILIKE '%joint%' OR name_en ILIKE '%coupling%')
       AND name_en NOT ILIKE '%ball joint%'`);

  await run('900606 Steering wheel',
    `UPDATE parts_products SET subcategory_id = 900606
     WHERE subcategory_id = 17903
       AND (name_en ILIKE '%steering wheel%' OR name_en ILIKE '%wheel steering%'
            OR name_en ILIKE '%body-steering%' OR name_en ILIKE '%wheel-steering%')`);

  rem = await c.query("SELECT COUNT(*) FROM parts_products WHERE subcategory_id = 17903");
  console.log('REMAINING on 17903:'.padEnd(38), rem.rows[0].count);

  // ═══════════════════════════════════════════════════════════
  // 17703 ОХЛАЖДЕНИЕ, 18005 ОСВЕЩЕНИЕ, 18001 КУЗОВ, 18003 СТЁКЛА
  // ═══════════════════════════════════════════════════════════
  console.log('\n=== 17703 ОХЛАЖДЕНИЕ ===');
  await run('900401 Thermostat', `UPDATE parts_products SET subcategory_id = 900401 WHERE subcategory_id = 17703 AND name_en ILIKE '%thermostat%'`);
  await run('900402 Radiator', `UPDATE parts_products SET subcategory_id = 900402 WHERE subcategory_id = 17703 AND name_en ILIKE '%radiator%' AND name_en NOT ILIKE '%cap%' AND name_en NOT ILIKE '%hose%'`);
  await run('900403 Water pump', `UPDATE parts_products SET subcategory_id = 900403 WHERE subcategory_id = 17703 AND (name_en ILIKE '%water pump%' OR name_en ILIKE '%coolant pump%')`);
  await run('900404 Fan', `UPDATE parts_products SET subcategory_id = 900404 WHERE subcategory_id = 17703 AND name_en ILIKE '%fan%'`);
  await run('900405 Reservoir', `UPDATE parts_products SET subcategory_id = 900405 WHERE subcategory_id = 17703 AND (name_en ILIKE '%reservoir%' OR name_en ILIKE '%expansion%' OR name_en ILIKE '%overflow%')`);
  await run('900406 Hose/pipe', `UPDATE parts_products SET subcategory_id = 900406 WHERE subcategory_id = 17703 AND (name_en ILIKE '%hose%' OR name_en ILIKE '%pipe%' OR name_en ILIKE '%tube%')`);
  await run('900407 Cap', `UPDATE parts_products SET subcategory_id = 900407 WHERE subcategory_id = 17703 AND (name_en ILIKE '%cap%' OR name_en ILIKE '%lid%')`);
  rem = await c.query("SELECT COUNT(*) FROM parts_products WHERE subcategory_id = 17703");
  console.log('REMAINING on 17703:'.padEnd(38), rem.rows[0].count);

  console.log('\n=== 18005 ОСВЕЩЕНИЕ ===');
  await run('900501 Headlight', `UPDATE parts_products SET subcategory_id = 900501 WHERE subcategory_id = 18005 AND (name_en ILIKE '%headlight%' OR name_en ILIKE '%headlamp%' OR name_en ILIKE '%head lamp%')`);
  await run('900502 Tail light', `UPDATE parts_products SET subcategory_id = 900502 WHERE subcategory_id = 18005 AND (name_en ILIKE '%tail light%' OR name_en ILIKE '%tail lamp%' OR name_en ILIKE '%rear lamp%' OR name_en ILIKE '%rear light%')`);
  await run('900503 Fog light', `UPDATE parts_products SET subcategory_id = 900503 WHERE subcategory_id = 18005 AND name_en ILIKE '%fog%'`);
  await run('900506 Turn signal', `UPDATE parts_products SET subcategory_id = 900506 WHERE subcategory_id = 18005 AND (name_en ILIKE '%turn%' OR name_en ILIKE '%signal%' OR name_en ILIKE '%indicator%')`);
  await run('900507 License plate', `UPDATE parts_products SET subcategory_id = 900507 WHERE subcategory_id = 18005 AND (name_en ILIKE '%license%' OR name_en ILIKE '%number plate%')`);
  await run('900504 Bulb/lamp', `UPDATE parts_products SET subcategory_id = 900504 WHERE subcategory_id = 18005 AND (name_en ILIKE '%bulb%' OR name_en ILIKE '%lamp%' OR name_en ILIKE '%led%')`);
  await run('900505 Control module', `UPDATE parts_products SET subcategory_id = 900505 WHERE subcategory_id = 18005 AND (name_en ILIKE '%control%' OR name_en ILIKE '%module%' OR name_en ILIKE '%ballast%')`);
  rem = await c.query("SELECT COUNT(*) FROM parts_products WHERE subcategory_id = 18005");
  console.log('REMAINING on 18005:'.padEnd(38), rem.rows[0].count);

  console.log('\n=== 18001 КУЗОВ ===');
  await run('900701 Fender', `UPDATE parts_products SET subcategory_id = 900701 WHERE subcategory_id = 18001 AND name_en ILIKE '%fender%'`);
  await run('900702 Door', `UPDATE parts_products SET subcategory_id = 900702 WHERE subcategory_id = 18001 AND name_en ILIKE '%door%' AND name_en NOT ILIKE '%hood%' AND name_en NOT ILIKE '%bonnet%' AND name_en NOT ILIKE '%fuel filler%'`);
  await run('900703 Hood/bonnet', `UPDATE parts_products SET subcategory_id = 900703 WHERE subcategory_id = 18001 AND (name_en ILIKE '%hood%' OR name_en ILIKE '%bonnet%') AND name_en NOT ILIKE '%door%'`);
  await run('900704 Trunk/tailgate', `UPDATE parts_products SET subcategory_id = 900704 WHERE subcategory_id = 18001 AND (name_en ILIKE '%trunk%' OR name_en ILIKE '%tailgate%' OR name_en ILIKE '%liftgate%')`);
  await run('900705 Rocker/sill', `UPDATE parts_products SET subcategory_id = 900705 WHERE subcategory_id = 18001 AND (name_en ILIKE '%rocker%' OR name_en ILIKE '%sill%')`);
  await run('900704 Fuel filler', `UPDATE parts_products SET subcategory_id = 900704 WHERE subcategory_id = 18001 AND name_en ILIKE '%fuel filler%'`);
  rem = await c.query("SELECT COUNT(*) FROM parts_products WHERE subcategory_id = 18001");
  console.log('REMAINING on 18001:'.padEnd(38), rem.rows[0].count);

  console.log('\n=== 18003 ОСТЕКЛЕНИЕ ===');
  await run('900801 Windshield', `UPDATE parts_products SET subcategory_id = 900801 WHERE subcategory_id = 18003 AND (name_en ILIKE '%windshield%' OR name_en ILIKE '%front window%' OR name_en ILIKE '%front glass%')`);
  await run('900802 Rear window', `UPDATE parts_products SET subcategory_id = 900802 WHERE subcategory_id = 18003 AND (name_en ILIKE '%rear window%' OR name_en ILIKE '%rear glass%' OR name_en ILIKE '%back glass%')`);
  await run('900803 Side window', `UPDATE parts_products SET subcategory_id = 900803 WHERE subcategory_id = 18003 AND (name_en ILIKE '%side window%' OR name_en ILIKE '%side glass%' OR name_en ILIKE '%door glass%')`);
  await run('900804 Vent window', `UPDATE parts_products SET subcategory_id = 900804 WHERE subcategory_id = 18003 AND (name_en ILIKE '%vent window%' OR name_en ILIKE '%quarter%')`);
  rem = await c.query("SELECT COUNT(*) FROM parts_products WHERE subcategory_id = 18003");
  console.log('REMAINING on 18003:'.padEnd(38), rem.rows[0].count);

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
