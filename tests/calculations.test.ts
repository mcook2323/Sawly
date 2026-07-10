import assert from "node:assert/strict";
import test from "node:test";
import { BENCH_DIMENSION_LIMITS, generateBenchPlan, validateBenchInputs } from "../calculations/bench";
import { chooseStockLength, generateShoppingList } from "../calculations/materials";
import { generateTablePlan, TABLE_DIMENSION_LIMITS, validateTableInputs } from "../calculations/table";

test("Outdoor Table accepts exact boundaries and rejects invalid dimensions", () => {
  for (const length of [TABLE_DIMENSION_LIMITS.length.min, TABLE_DIMENSION_LIMITS.length.max]) {
    const inputs = { length, width: 36, height: 30, wood: "pine" as const, style: "modern" as const };
    assert.equal(validateTableInputs(inputs), true);
    assert.equal(generateTablePlan(inputs).inputs.length, length);
  }
  const invalid = { length: 35, width: 36, height: 30, wood: "pine" as const, style: "modern" as const };
  assert.equal(validateTableInputs(invalid), false);
  assert.throws(() => generateTablePlan(invalid), RangeError);
});

test("Outdoor Bench accepts exact boundaries and rejects invalid dimensions", () => {
  const minimum = { length: BENCH_DIMENSION_LIMITS.length.min, depth: BENCH_DIMENSION_LIMITS.depth.min, seatHeight: BENCH_DIMENSION_LIMITS.seatHeight.min, wood: "pine" as const };
  const maximum = { length: BENCH_DIMENSION_LIMITS.length.max, depth: BENCH_DIMENSION_LIMITS.depth.max, seatHeight: BENCH_DIMENSION_LIMITS.seatHeight.max, wood: "pine" as const };
  assert.equal(validateBenchInputs(minimum), true);
  assert.equal(validateBenchInputs(maximum), true);
  assert.equal(generateBenchPlan(maximum).dimensions[0].value, 96);
  const invalid = { ...minimum, depth: 15 };
  assert.equal(validateBenchInputs(invalid), false);
  assert.throws(() => generateBenchPlan(invalid), RangeError);
});

test("material multipliers deterministically increase lumber pricing", () => {
  const base = { length: 60, depth: 18, seatHeight: 18 };
  const pine = generateBenchPlan({ ...base, wood: "pine" });
  const cedar = generateBenchPlan({ ...base, wood: "cedar" });
  const treated = generateBenchPlan({ ...base, wood: "treated" });
  const pineList = generateShoppingList(pine.cutList, []);
  const cedarList = generateShoppingList(cedar.cutList, []);
  const treatedList = generateShoppingList(treated.cutList, []);
  assert.ok(cedarList.estimatedCostRangeCents.minCents > treatedList.estimatedCostRangeCents.minCents);
  assert.ok(treatedList.estimatedCostRangeCents.minCents > pineList.estimatedCostRangeCents.minCents);
});

test("stock selection chooses the least-waste purchasable length", () => {
  assert.equal(chooseStockLength(60, 180), 96);
  assert.equal(chooseStockLength(100, 200), 120);
});

test("shopping totals and waste equal their line-item calculations", () => {
  const plan = generateBenchPlan({ length: 60, depth: 18, seatHeight: 18, wood: "pine" });
  const list = generateShoppingList(plan.cutList, plan.hardware);
  const min = [...list.lumber, ...list.hardware].reduce((sum, item) => sum + item.estimatedLineCostRangeCents.minCents, 0);
  const max = [...list.lumber, ...list.hardware].reduce((sum, item) => sum + item.estimatedLineCostRangeCents.maxCents, 0);
  assert.deepEqual(list.estimatedCostRangeCents, { minCents: min, maxCents: max });
  const cut = list.lumber.reduce((sum, item) => sum + item.totalCutLengthInches, 0);
  const purchased = list.lumber.reduce((sum, item) => sum + item.quantity * item.stockLengthInches, 0);
  assert.equal(list.estimatedWastePercent, Math.round(((purchased - cut) / cut) * 100));
});
