import assert from "node:assert/strict";
import test from "node:test";
import { BENCH_DIMENSION_LIMITS, generateBenchPlan, validateBenchInputs } from "../calculations/bench";
import { chooseStockLength, generateShoppingList } from "../calculations/materials";
import { generateTablePlan, TABLE_DIMENSION_LIMITS, validateTableInputs } from "../calculations/table";
import { matchProjectTemplate } from "../lib/ai/matcher";
import { parseDesignRequest } from "../lib/ai/parser";
import { readSavedDesignRequests, saveDesignRequest, SAVED_DESIGN_REQUESTS_KEY } from "../lib/ai/savedRequests";
import { getConversationQuestions, updateConversationAnswer } from "../lib/ai/conversation";
import { confidenceBand, scoreDesignProfile } from "../lib/ai/guidedMatcher";
import { buildDesignProfile } from "../lib/ai/profile";
import { decideConversationSubmission, restartAllowed, type ConversationSnapshot } from "../lib/ai/conversationSession";
import { shouldSubmitIdeaKey } from "../lib/ai/promptSubmission";

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

test("design parser extracts deterministic project details", () => {
  const request = parseDesignRequest("84 inch cedar modern outdoor table for 8");
  assert.equal(request.projectType, "table");
  assert.equal(request.material, "cedar");
  assert.equal(request.dimensions.length, 84);
  assert.equal(request.style, "modern");
  assert.equal(request.capacity, 8);
});

test("design matcher selects supported templates and rejects unsupported ideas", () => {
  const match = matchProjectTemplate(parseDesignRequest("Large cedar patio table"));
  assert.equal(match?.projectId, "outdoor-table");
  assert.equal(match?.prefill.material, "cedar");
  assert.equal(matchProjectTemplate(parseDesignRequest("Outdoor kitchen with a grill")), null);
});

test("saved design requests persist once, deduplicate, and tolerate corrupted storage", () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) } } });
  const parsed = parseDesignRequest("Outdoor kitchen with a grill");
  assert.equal(saveDesignRequest({ prompt: parsed.raw, parsed }).created, true);
  assert.equal(saveDesignRequest({ prompt: "  outdoor KITCHEN with a grill ", parsed }).created, false);
  assert.equal(readSavedDesignRequests().length, 1);
  values.set(SAVED_DESIGN_REQUESTS_KEY, "{broken");
  assert.deepEqual(readSavedDesignRequests(), []);
  delete (globalThis as { window?: unknown }).window;
});

test("guided question flow depends on parsed details and prior answers", () => {
  const request = parseDesignRequest("Something for extra seating");
  const initial = buildDesignProfile(request, {});
  assert.equal(getConversationQuestions(initial, {})[0]?.id, "projectType");
  const answers = { projectType: "bench", environment: "outdoor" } as const;
  const updated = buildDesignProfile(request, answers);
  const questions = getConversationQuestions(updated, answers);
  assert.equal(questions[0]?.id, "intendedUse");
  assert.ok(questions.some((question) => question.id === "capacity" && question.prompt.includes("fit comfortably")));
});

test("Design Profile combines parser output with conversational answers", () => {
  const request = parseDesignRequest("cedar table");
  const profile = buildDesignProfile(request, { environment: "outdoor", dimensions: "84 × 40 × 30", capacity: 8, budget: "100-250", style: "modern", intendedUse: "family dining" });
  assert.equal(profile.material, "cedar");
  assert.equal(profile.dimensions.length, 84);
  assert.equal(profile.dimensions.width, 40);
  assert.equal(profile.capacity, 8);
  assert.equal(profile.environment, "outdoor");
  assert.ok(profile.completeness >= 80);
});

test("guided matching returns high, medium, and low confidence bands", () => {
  const highProfile = buildDesignProfile(parseDesignRequest("84 inch cedar outdoor table for 8"), { intendedUse: "family dining", budget: "100-250" });
  const high = scoreDesignProfile(highProfile);
  assert.equal(high.band, "high");
  assert.equal(high.matches[0]?.projectId, "outdoor-table");
  const mediumProfile = buildDesignProfile(parseDesignRequest("outdoor seating"), { environment: "outdoor", intendedUse: "casual seating", budget: "flexible", material: "unspecified", style: "unspecified", dimensions: "skip" });
  const medium = scoreDesignProfile(mediumProfile);
  assert.equal(medium.band, "medium");
  assert.equal(medium.matches.length, 2);
  const lowProfile = buildDesignProfile(parseDesignRequest("outdoor kitchen with a grill"), { environment: "outdoor", intendedUse: "cooking", budget: "250-500", material: "cedar", style: "modern", dimensions: "96 × 30" });
  assert.equal(scoreDesignProfile(lowProfile).band, "low");
  assert.equal(confidenceBand(0.8), "high");
  assert.equal(confidenceBand(0.5), "medium");
});

test("prompt-derived table details are not asked again", () => {
  const request = parseDesignRequest("Outdoor cedar table for 8");
  const profile = buildDesignProfile(request, {});
  assert.equal(profile.projectType, "table");
  assert.equal(profile.environment, "outdoor");
  assert.equal(profile.material, "cedar");
  assert.equal(profile.capacity, 8);
  const ids = getConversationQuestions(profile, {}).map((question) => question.id);
  for (const resolved of ["projectType", "environment", "material", "capacity"]) assert.ok(!ids.includes(resolved as never));
});

test("ambiguous seating and furniture prompts ask project-type clarification", () => {
  for (const prompt of ["Outdoor seating", "Patio furniture", "Backyard seating"]) {
    const request = parseDesignRequest(prompt);
    const question = getConversationQuestions(buildDesignProfile(request, {}), {})[0];
    assert.equal(question?.id, "projectType");
    assert.deepEqual(question?.options?.map((option) => option.label), ["Outdoor Table", "Outdoor Bench", "Something else"]);
  }
});

test("prompt-derived dimensions are not requested again", () => {
  const request = parseDesignRequest("72 inch outdoor table");
  const questions = getConversationQuestions(buildDesignProfile(request, {}), {});
  assert.ok(!questions.some((question) => question.id === "dimensions"));
});

test("editing project type invalidates dependent answers and updates later questions", () => {
  const before = { projectType: "table", environment: "outdoor", capacity: 8, dimensions: "84 × 40 × 30", intendedUse: "dining" } as const;
  const updated = updateConversationAnswer(before, ["projectType", "environment", "intendedUse", "dimensions", "capacity"], "projectType", "bench");
  assert.equal(updated.answers.capacity, undefined);
  assert.equal(updated.answers.dimensions, undefined);
  const profile = buildDesignProfile(parseDesignRequest("Outdoor seating"), updated.answers);
  const capacity = getConversationQuestions(profile, updated.answers).find((question) => question.id === "capacity");
  assert.ok(capacity?.prompt.includes("fit comfortably"));
});

test("Something else remains unsupported and never forces a table or bench", () => {
  const answers = { projectType: "unknown", environment: "outdoor", intendedUse: "casual seating", dimensions: "skip", capacity: "skip", material: "unspecified", style: "unspecified", budget: "flexible" } as const;
  const profile = buildDesignProfile(parseDesignRequest("Outdoor seating"), answers);
  const result = scoreDesignProfile(profile);
  assert.equal(profile.projectTypeExplicitlyOther, true);
  assert.equal(result.band, "low");
  assert.deepEqual(result.matches, []);
});

test("Enter submits an idea while Shift+Enter preserves a newline", () => {
  assert.equal(shouldSubmitIdeaKey("Enter", false), true);
  assert.equal(shouldSubmitIdeaKey("Enter", true), false);
  assert.equal(shouldSubmitIdeaKey("a", false), false);
});

test("same normalized idea resumes an active conversation", () => {
  const active: ConversationSnapshot = { prompt: "Outdoor cedar table", normalizedPrompt: "outdoor cedar table", answers: { intendedUse: "dining" }, answerOrder: ["intendedUse"], completed: false, updatedAt: new Date().toISOString() };
  const result = decideConversationSubmission(active, "  OUTDOOR   cedar TABLE ", []);
  assert.equal(result.decision, "resume");
  assert.deepEqual(result.snapshot?.answers, active.answers);
});

test("same completed idea reopens its result", () => {
  const complete: ConversationSnapshot = { prompt: "Outdoor bench", normalizedPrompt: "outdoor bench", answers: { intendedUse: "seating" }, answerOrder: ["intendedUse"], completed: true, updatedAt: new Date().toISOString() };
  const result = decideConversationSubmission(null, "outdoor BENCH", [complete]);
  assert.equal(result.decision, "reopen");
  assert.equal(result.snapshot?.completed, true);
});

test("a different idea starts a new conversation", () => {
  const active: ConversationSnapshot = { prompt: "Outdoor table", normalizedPrompt: "outdoor table", answers: { intendedUse: "dining" }, answerOrder: ["intendedUse"], completed: false, updatedAt: new Date().toISOString() };
  const result = decideConversationSubmission(active, "garage workbench", []);
  assert.equal(result.decision, "start");
  assert.equal(result.snapshot, null);
});

test("restart clears answered conversations only after confirmation", () => {
  assert.equal(restartAllowed(3, false), false);
  assert.equal(restartAllowed(3, true), true);
  assert.equal(restartAllowed(0, false), true);
});
