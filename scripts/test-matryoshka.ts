/**
 * Quick test for matryoshka packing algorithm.
 * Run: npx tsx scripts/test-matryoshka.ts
 */

// Direct import since this is a test script
import { packItems, BOXES } from "../src/lib/matryoshka";

function test(name: string, items: { weightKg: number; quantity: number; billedWeightKg: number }[]) {
  const result = packItems(items);
  console.log(`\n── ${name} ──`);
  console.log(`  Items: ${items.map(i => `${i.quantity}×${i.weightKg}kg`).join(", ")}`);
  console.log(`  Boxes: ${result.boxes.map(b => `${b.box.name}(${b.itemWeights.length}шт, ${b.totalItemsWeight.toFixed(2)}kg → billed ${b.billedWeightKg}kg)`).join(" + ")}`);
  console.log(`  Simple total:     ${result.simpleBilled.toFixed(3)} kg`);
  console.log(`  Matryoshka total: ${result.matryoshkaBilled.toFixed(3)} kg`);
  console.log(`  Final (MIN):      ${result.finalBilled.toFixed(3)} kg`);
  console.log(`  Savings:          ${result.savings.toFixed(3)} kg (${result.simpleBilled > 0 ? ((result.savings / result.simpleBilled) * 100).toFixed(1) : 0}%)`);
}

console.log("=== MATRYOSHKA PACKING TESTS ===\n");
console.log("Box configs:");
BOXES.forEach(b => console.log(`  ${b.name}: ${b.lengthCm}×${b.widthCm}×${b.heightCm} cm, vol=${b.volWeightKg}kg, max=${b.maxWeightKg}kg/${b.maxItems}шт, tare=${b.tareKg}kg`));

// Test 1: Single small item
test("Single bolt", [
  { weightKg: 0.05, quantity: 1, billedWeightKg: 0.5 },
]);

// Test 2: Multiple bolts (item count limit test)
test("20 bolts (should split by count limit)", [
  { weightKg: 0.05, quantity: 20, billedWeightKg: 0.5 },
]);

// Test 3: Mix of small and medium
test("5× filter (0.4kg) + 3× brake pads (0.8kg) + 10× bolt (0.05kg)", [
  { weightKg: 0.4, quantity: 5, billedWeightKg: 1.2 },
  { weightKg: 0.8, quantity: 3, billedWeightKg: 2.4 },
  { weightKg: 0.05, quantity: 10, billedWeightKg: 0.5 },
]);

// Test 4: Heavy single item (should not benefit)
test("Single heavy coil (2.5kg)", [
  { weightKg: 2.5, quantity: 1, billedWeightKg: 3.0 },
]);

// Test 5: Many medium items
test("10× filters (0.4kg each)", [
  { weightKg: 0.4, quantity: 10, billedWeightKg: 1.2 },
]);

// Test 6: Edge case — empty
test("Empty cart", []);

// Test 7: One item, qty 1, where matryoshka might be worse
test("Single item where matryoshka could be worse", [
  { weightKg: 0.3, quantity: 1, billedWeightKg: 0.34 },
]);

console.log("\n=== DONE ===");
