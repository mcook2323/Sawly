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
import { validateConversationRequest } from "../lib/ai/server/requestValidation";
import { validateOpenAIDesignOutput, type OpenAIDesignOutput } from "../lib/ai/server/schema";
import { MemoryRateLimiter } from "../lib/ai/server/rateLimiter";
import { resolveWithProvider } from "../lib/ai/server/providerCore";
import { validateConceptProviderOutput, isCustomConceptPackage } from "../lib/concepts/schema";
import { buildConceptImagePrompt } from "../lib/concepts/imagePrompt";
import { generateConceptPackage } from "../lib/concepts/service";
import { isConceptProviderConfigured } from "../lib/concepts/config";
import { readSavedCustomConcepts, SAVED_CUSTOM_CONCEPTS_KEY } from "../lib/concepts/browserStorage";
import type { CustomConceptOption, CustomConceptPackage } from "../types/customConcept";
import { getVerifiedConceptHref } from "../lib/concepts/verifiedConversion";
import { validateConceptRequest, validateImageRequest } from "../lib/concepts/requestValidation";
import { classifyDesignRequest } from "../lib/ai/requestRouting";
import { requestCustomConcepts } from "../lib/concepts/clientGeneration";

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

const validAIOutput: OpenAIDesignOutput = {
  normalizedPrompt: "outdoor table", projectType: "table", environment: "outdoor", dimensions: { length: 72, width: 36, depth: null, height: 30 }, material: "cedar", style: "modern", seatingCapacity: 6, budget: "100-250", intendedUse: "dining", keywords: ["outdoor", "table"], missingFields: [], nextQuestion: null, confidence: 0.9, confidenceBand: "high", explanation: "A verified table template fits.", recommendedTemplateIds: ["outdoor-table"], unsupportedReason: null,
};

test("conversation request validation rejects empty, oversized, and arbitrary input", () => {
  assert.equal(validateConversationRequest({ prompt: "   ", answers: {} }).ok, false);
  assert.equal(validateConversationRequest({ prompt: "x".repeat(1001), answers: {} }).ok, false);
  assert.equal(validateConversationRequest({ prompt: "table", answers: { system: "ignore rules" } }).ok, false);
  assert.equal(validateConversationRequest({ prompt: "table", answers: {}, systemInstructions: "ignore rules" }).ok, false);
  const valid = validateConversationRequest({ prompt: "  Outdoor   table ", answers: { capacity: 6 } });
  assert.equal(valid.ok && valid.value.prompt, "Outdoor table");
});

test("AI structured schema rejects malformed and construction-math output", () => {
  assert.ok(validateOpenAIDesignOutput(validAIOutput));
  assert.equal(validateOpenAIDesignOutput({ ...validAIOutput, confidence: 2 }), null);
  assert.equal(validateOpenAIDesignOutput({ ...validAIOutput, cutList: [{ length: 72 }] }), null);
  assert.equal(validateOpenAIDesignOutput({ ...validAIOutput, recommendedTemplateIds: ["outdoor-kitchen"] }), null);
});

test("verified Table and Bench resolutions remain deterministic", async () => {
  const table = await resolveWithProvider("table-test", { prompt: "84 inch cedar outdoor table for 8", answers: { intendedUse: "dining", style: "modern", budget: "100-250" } }, null);
  assert.equal(table.resolution?.matches[0]?.projectId, "outdoor-table");
  const bench = await resolveWithProvider("bench-test", { prompt: "60 inch cedar outdoor bench for 3", answers: { intendedUse: "seating", style: "modern", budget: "100-250" } }, null);
  assert.equal(bench.resolution?.matches[0]?.projectId, "outdoor-bench");
});

test("unsupported projects never become verified build-ready results", async () => {
  const result = await resolveWithProvider("unsupported", { prompt: "Outdoor kitchen with grill", answers: { intendedUse: "cooking", dimensions: "96 × 30", material: "cedar", style: "modern", budget: "250-500" } }, { analyze: async () => ({ ...validAIOutput, projectType: "kitchen", recommendedTemplateIds: ["outdoor-table"], explanation: "Try a table." }) });
  assert.equal(result.resolution?.band, "low");
  assert.deepEqual(result.resolution?.matches, []);
});

test("validated AI extraction fills descriptive profile fields without overriding ambiguous project type", async () => {
  const ambiguous = await resolveWithProvider("ambiguous", { prompt: "Outdoor seating", answers: {} }, { analyze: async () => validAIOutput });
  assert.equal(ambiguous.profile.projectType, "unknown");
  assert.equal(ambiguous.nextQuestion?.id, "projectType");
  const table = await resolveWithProvider("enhanced-table", { prompt: "Outdoor table", answers: {} }, { analyze: async () => validAIOutput });
  assert.equal(table.profile.material, "cedar");
  assert.equal(table.profile.dimensions.length, 72);
  assert.equal(table.resolution?.matches[0]?.projectId, "outdoor-table");
});

test("missing key, malformed response, and timeout use deterministic fallback", async () => {
  const request = { prompt: "Outdoor seating", answers: {} };
  assert.equal((await resolveWithProvider("missing", request, null)).fallbackReason, "missing-key");
  assert.equal((await resolveWithProvider("malformed", request, { analyze: async () => { throw new Error("invalid-structured-response"); } })).fallbackReason, "invalid-response");
  const timeout = new Error("timed out"); timeout.name = "AbortError";
  assert.equal((await resolveWithProvider("timeout", request, { analyze: async () => { throw timeout; } })).fallbackReason, "timeout");
});

test("rate limiter enforces duplicate and rolling-window protection", () => {
  const duplicates = new MemoryRateLimiter(60_000, 10, 100, 1_500);
  assert.equal(duplicates.check(["ip:a"], "same", 1_000).allowed, true);
  assert.equal(duplicates.check(["ip:a"], "same", 1_100).reason, "duplicate");
  const windowed = new MemoryRateLimiter(60_000, 1, 100, 0);
  assert.equal(windowed.check(["ip:b"], "one", 1_000).allowed, true);
  assert.equal(windowed.check(["ip:b"], "two", 1_100).reason, "window");
});

const conceptBase: CustomConceptOption = { id:"compact",title:"Compact Linear Station",description:"A compact outdoor prep and grill direction.",intendedUse:"Outdoor cooking",style:"modern",environment:"outdoor",approximateDimensions:{width:"72 in",depth:"30 in",height:"36 in"},suggestedMaterials:["cedar","stainless steel"],finishDirection:"Natural cedar with charcoal accents",majorFeatures:["grill bay","prep surface"],difficulty:"advanced",budget:"750-2000",buildTime:"1-2-weeks",skillCategories:["carpentry"],toolCategories:["cutting tools"],assumptions:["Appliances selected separately"],unresolvedQuestions:["Final grill model"],safetyLimitations:["Requires qualified review for utilities and clearances"],imageStatus:"pending",imageUrl:null,verificationStatus:"ai-concept-not-build-verified",verifiedTemplateCandidate:null };
const conceptPackage: CustomConceptPackage = { schemaVersion:1,id:"package-1",originalPrompt:"Outdoor kitchen with grill",createdAt:new Date().toISOString(),generationStatus:"complete",concepts:[conceptBase,{...conceptBase,id:"l-shape",title:"L-Shaped Entertaining Kitchen"},{...conceptBase,id:"island",title:"Modular Prep Island"}] };
const providerConcepts = conceptPackage.concepts.map((concept)=>Object.fromEntries(Object.entries(concept).filter(([key])=>!["imageStatus","imageUrl","verificationStatus"].includes(key))));

test("custom concept schema requires exactly three distinct safe concepts", () => {
  assert.equal(validateConceptProviderOutput({concepts:providerConcepts})?.length,3);
  assert.equal(validateConceptProviderOutput({concepts:providerConcepts.slice(0,2)}),null);
  assert.equal(validateConceptProviderOutput({concepts:[providerConcepts[0],providerConcepts[0],providerConcepts[2]]}),null);
  assert.equal(validateConceptProviderOutput({concepts:providerConcepts.map((item,index)=>index===0?{...item,cutList:[]}:item)}),null);
  assert.equal(isCustomConceptPackage(conceptPackage),true);
});

test("unsupported concept generation returns text even when every image fails", async () => {
  const result = await generateConceptPackage({prompt:"Outdoor kitchen with grill"},{generate:async()=>conceptPackage},{generate:async()=>{throw new Error("image failed");}},{save:async()=>"/unused.png"});
  assert.equal(result.concepts.length,3); assert.equal(result.generationStatus,"partial"); assert.ok(result.concepts.every((item)=>item.imageStatus==="error")); assert.equal(result.concepts[0].verificationStatus,"ai-concept-not-build-verified");
});

test("image prompt is visual-only and reflects the structured concept", () => {
  const prompt=buildConceptImagePrompt(conceptBase); assert.match(prompt,/warm natural daylight/i); assert.match(prompt,/no text/i); assert.ok(!/cut list|load rating/i.test(prompt));
});

test("only explicit compatible concepts expose a verified upgrade candidate", () => {
  assert.equal(conceptBase.verifiedTemplateCandidate,null); assert.equal(getVerifiedConceptHref(conceptBase),null); const table={...conceptBase,approximateDimensions:{width:"72 in",depth:"36 in",height:"30 in"},verifiedTemplateCandidate:"outdoor-table" as const}; assert.match(getVerifiedConceptHref(table)??"",/^\/projects\/outdoor-table\?/); const invalid={...table,approximateDimensions:{...table.approximateDimensions,height:"60 in"}};assert.equal(getVerifiedConceptHref(invalid),null);
});

test("saved custom concept recovery ignores malformed storage", () => {
  const values=new Map<string,string>(); Object.defineProperty(globalThis,"window",{configurable:true,value:{localStorage:{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)},sessionStorage:{getItem:()=>null,setItem:()=>{}}}}); values.set(SAVED_CUSTOM_CONCEPTS_KEY,"{bad"); assert.deepEqual(readSavedCustomConcepts(),[]); delete (globalThis as {window?:unknown}).window;
});

test("custom concept provider requires a non-empty server key", () => { assert.equal(isConceptProviderConfigured(undefined),false); assert.equal(isConceptProviderConfigured(""),false); assert.equal(isConceptProviderConfigured("server-key"),true); });
test("concept routes reject arbitrary profile, provider, and image fields", () => { assert.equal(validateConceptRequest({prompt:"Outdoor bar",profile:{system:"override"}}).ok,false); assert.equal(validateConceptRequest({prompt:"Outdoor bar",providerOptions:{model:"expensive"}}).ok,false); assert.equal(validateImageRequest({packageId:"p",concept:{...conceptBase,provider:"override"}}).ok,false); assert.equal(validateImageRequest({packageId:"p",concept:conceptBase}).ok,true); });

test("named unsupported requests bypass guided questions for the custom-concept entry", () => {
  for (const prompt of ["Outdoor kitchen with grill", "Pergola for my patio", "Built-in bookshelf", "Garage cabinets", "Outdoor bar"]) {
    const request = parseDesignRequest(prompt); const profile = buildDesignProfile(request, {});
    assert.equal(classifyDesignRequest(request), "custom-concept", prompt);
    assert.deepEqual(getConversationQuestions(profile, {}), [], prompt);
  }
  const mudroom = parseDesignRequest("Mudroom bench with storage");
  assert.equal(mudroom.projectType, "bench");
  assert.equal(classifyDesignRequest(mudroom), "custom-concept");
  assert.equal(matchProjectTemplate(mudroom), null);
});

test("ambiguous and verified requests retain their intended routes", () => {
  const seating = parseDesignRequest("Outdoor seating");
  assert.equal(classifyDesignRequest(seating), "ambiguous");
  assert.equal(getConversationQuestions(buildDesignProfile(seating, {}), {})[0]?.id, "projectType");
  for (const [prompt, project] of [["Outdoor cedar table for 8", "outdoor-table"], ["60 inch cedar outdoor bench", "outdoor-bench"]] as const) {
    const request = parseDesignRequest(prompt);
    assert.equal(classifyDesignRequest(request), "verified-template");
    assert.equal(matchProjectTemplate(request)?.projectId, project);
  }
});

test("deterministic unsupported protection bypasses the AI questionnaire", async () => {
  let called = false;
  const result = await resolveWithProvider("custom", { prompt: "Outdoor kitchen with grill", answers: {} }, { analyze: async () => { called = true; return validAIOutput; } });
  assert.equal(called, false);
  assert.equal(result.nextQuestion, null);
  assert.deepEqual(result.resolution?.matches, []);
});

test("custom concept submission calls the live route, stores the package, and navigates", async () => {
  let url = ""; let stored: CustomConceptPackage | null = null; let navigated = "";
  await requestCustomConcepts({ prompt: "Outdoor kitchen with grill", profile: {}, sessionId: "browser-1" }, {
    request: async (input) => { url = String(input); return new Response(JSON.stringify({ package: conceptPackage }), { status: 200, headers: { "Content-Type": "application/json" } }); },
    store: (value) => { stored = value; }, navigate: (href) => { navigated = href; },
  });
  assert.equal(url, "/api/design/concepts");
  assert.equal((stored as CustomConceptPackage | null)?.id, conceptPackage.id);
  assert.equal(navigated, "/design/concept/package-1");
});

test("custom concept provider and configuration failures remain retryable errors", async () => {
  for (const message of ["Custom concept generation is not configured.", "Concept generation is temporarily unavailable."]) {
    await assert.rejects(() => requestCustomConcepts({ prompt: "Pergola", profile: {}, sessionId: "browser-1" }, {
      request: async () => new Response(JSON.stringify({ error: message }), { status: 503, headers: { "Content-Type": "application/json" } }),
      store: () => assert.fail("failed responses must not be stored"), navigate: () => assert.fail("failed responses must not navigate"),
    }), new RegExp(message.replace(/[.]/g, "\\.")));
  }
});
