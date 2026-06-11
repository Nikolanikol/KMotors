/**
 * matryoshka.ts
 * -------------
 * Box-packing algorithm for EMS shipping cost optimization.
 *
 * Uses official Korea Post boxes (우체국 박스 1호-5호).
 * Groups multiple EMS items into shared boxes to reduce
 * total billed weight vs billing each item individually.
 *
 * Safety: result is never MORE expensive than simple per-item sum.
 */

/* ── Korea Post Box Definitions ─────────────────────────────────────────── */

export interface BoxType {
  name: string;          // "1호", "2호", etc.
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volWeightKg: number;   // L×W×H / 6000 (EMS standard)
  maxWeightKg: number;   // practical weight capacity
  maxItems: number;      // max items per box
  tareKg: number;        // box + packing materials weight
}

export const BOXES: BoxType[] = [
  {
    name: "1호",
    lengthCm: 22, widthCm: 19, heightCm: 9,
    volWeightKg: 0.627,   // 22*19*9 / 6000
    maxWeightKg: 2,
    maxItems: 8,
    tareKg: 0.15,
  },
  {
    name: "2호",
    lengthCm: 27, widthCm: 18, heightCm: 15,
    volWeightKg: 1.215,   // 27*18*15 / 6000
    maxWeightKg: 5,
    maxItems: 12,
    tareKg: 0.20,
  },
  {
    name: "3호",
    lengthCm: 34, widthCm: 25, heightCm: 21,
    volWeightKg: 2.975,   // 34*25*21 / 6000
    maxWeightKg: 10,
    maxItems: 15,
    tareKg: 0.30,
  },
  {
    name: "4호",
    lengthCm: 41, widthCm: 31, heightCm: 28,
    volWeightKg: 5.931,   // 41*31*28 / 6000
    maxWeightKg: 20,
    maxItems: 20,
    tareKg: 0.50,
  },
  {
    name: "5호",
    lengthCm: 48, widthCm: 38, heightCm: 34,
    volWeightKg: 10.336,  // 48*38*34 / 6000
    maxWeightKg: 30,
    maxItems: 25,
    tareKg: 0.70,
  },
];

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface PackItem {
  /** actual weight of one unit in kg */
  weightKg: number;
  /** how many units the customer ordered */
  quantity: number;
  /** per-unit billed weight (old method, for MIN comparison) */
  billedWeightKg: number;
}

export interface PackedBox {
  box: BoxType;
  itemWeights: number[];  // weight of each item placed in this box
  totalItemsWeight: number;
  billedWeightKg: number; // MAX((items + tare) * 1.12, volWeight)
}

export interface PackResult {
  boxes: PackedBox[];
  matryoshkaBilled: number;  // sum of all box billed weights
  simpleBilled: number;      // old method: sum of individual billed weights
  finalBilled: number;       // MIN(matryoshka, simple) — customer never overpays
  savings: number;           // simpleBilled - finalBilled
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Find the smallest box that can hold an item of given weight */
function smallestBoxFor(weightKg: number): BoxType {
  for (const box of BOXES) {
    if (weightKg + box.tareKg <= box.maxWeightKg) return box;
  }
  return BOXES[BOXES.length - 1]; // fallback: largest box
}

/** Calculate billed weight for a packed box */
function calcBoxBilled(box: BoxType, totalItemsWeight: number): number {
  const packed = (totalItemsWeight + box.tareKg) * 1.12;
  return round3(Math.max(packed, box.volWeightKg));
}

/* ── Main Algorithm ──────────────────────────────────────────────────────── */

/**
 * Pack EMS items into Korea Post boxes using First Fit Decreasing.
 *
 * 1. Expand items by quantity into individual units
 * 2. Sort by weight descending (heavy items first)
 * 3. For each unit, try to fit into an existing open box
 *    (check weight cap + item count limit)
 * 4. If no box fits → open a new box (smallest suitable)
 * 5. Calculate billed weight per box
 * 6. Return MIN(matryoshka total, simple total)
 */
export function packItems(items: PackItem[]): PackResult {
  // Simple billed total (old method)
  const simpleBilled = round3(
    items.reduce((s, i) => s + i.billedWeightKg * i.quantity, 0)
  );

  // If no items or single item with qty 1 — no packing benefit
  if (items.length === 0) {
    return { boxes: [], matryoshkaBilled: 0, simpleBilled: 0, finalBilled: 0, savings: 0 };
  }

  // Step 1: Expand into individual units
  const units: number[] = [];
  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      units.push(item.weightKg);
    }
  }

  // Step 2: Sort descending by weight
  units.sort((a, b) => b - a);

  // Step 3-4: First Fit Decreasing bin packing
  const openBoxes: { box: BoxType; itemWeights: number[]; totalWeight: number }[] = [];

  for (const w of units) {
    let placed = false;

    // Try to fit into existing boxes
    for (const ob of openBoxes) {
      const newWeight = ob.totalWeight + w;
      if (newWeight + ob.box.tareKg <= ob.box.maxWeightKg && ob.itemWeights.length < ob.box.maxItems) {
        // Fits! But check if we need to upgrade box size
        if (newWeight + ob.box.tareKg <= ob.box.maxWeightKg) {
          ob.itemWeights.push(w);
          ob.totalWeight = newWeight;
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      // Open a new box
      const box = smallestBoxFor(w);
      openBoxes.push({ box, itemWeights: [w], totalWeight: w });
    }
  }

  // Step 4.5: Optimize box sizes — downgrade boxes that are underfilled
  for (const ob of openBoxes) {
    const needed = smallestBoxFor(ob.totalWeight);
    if (BOXES.indexOf(needed) < BOXES.indexOf(ob.box)) {
      // Check item count still fits
      if (ob.itemWeights.length <= needed.maxItems) {
        ob.box = needed;
      }
    }
  }

  // Step 5: Calculate billed weight per box
  const packedBoxes: PackedBox[] = openBoxes.map((ob) => ({
    box: ob.box,
    itemWeights: ob.itemWeights,
    totalItemsWeight: round3(ob.totalWeight),
    billedWeightKg: calcBoxBilled(ob.box, ob.totalWeight),
  }));

  const matryoshkaBilled = round3(
    packedBoxes.reduce((s, b) => s + b.billedWeightKg, 0)
  );

  // Step 6: Customer never overpays
  const finalBilled = Math.min(matryoshkaBilled, simpleBilled);

  return {
    boxes: packedBoxes,
    matryoshkaBilled,
    simpleBilled,
    finalBilled: round3(finalBilled),
    savings: round3(simpleBilled - finalBilled),
  };
}
