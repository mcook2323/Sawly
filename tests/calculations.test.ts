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
import { validateConceptProviderOutput, isCustomConceptPackage, parseConceptProviderText } from "../lib/concepts/schema";
import { buildConceptImagePrompt } from "../lib/concepts/imagePrompt";
import { generateConceptPackage } from "../lib/concepts/service";
import { isConceptProviderConfigured, resolveOpenAITextModel } from "../lib/concepts/config";
import { readConceptWorkspace, readSavedCustomConcepts, SAVED_CUSTOM_CONCEPTS_KEY, storeConceptWorkspace } from "../lib/concepts/browserStorage";
import type { CustomConceptOption, CustomConceptPackage } from "../types/customConcept";
import { getVerifiedConceptHref } from "../lib/concepts/verifiedConversion";
import { validateConceptRequest, validateImageRequest } from "../lib/concepts/requestValidation";
import { classifyDesignRequest } from "../lib/ai/requestRouting";
import { requestConceptImage, requestCustomConcepts } from "../lib/concepts/clientGeneration";
import { ProgressiveGenerationCache } from "../lib/concepts/progressiveCache";
import { allInitialImageJobIds, selectedImageJobIds } from "../lib/concepts/imageJobs";
import { conceptError, conceptErrorStatus, type ConceptErrorCategory } from "../lib/concepts/errors";
import { createPaidProvider, paidAIEnabled, resolveSawlyAIMode } from "../lib/ai/mode";
import { PROJECT_SNAP_POINTS, seatingCapacity, suggestedLengthForSeating } from "../lib/designStudio";
import { readSavedProjects, SAVED_PROJECTS_KEY } from "../lib/savedProjects";
import { isDeliberateStudioPan, studioWheelZoomDelta } from "../lib/studioInteractions";

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



test("style-aware bench planning keeps deterministic slat and park hardware rules", () => {
  const base = { length: 60, depth: 18, seatHeight: 18, wood: "pine" as const };
  const modern = generateBenchPlan({ ...base, style: "modern" });
  const park = generateBenchPlan({ ...base, style: "park" });
  const modernSeat = modern.cutList.find((piece) => piece.name === "Seat Board");
  const parkSeat = park.cutList.find((piece) => piece.name === "Seat Board");
  assert.equal(modernSeat?.quantity, 6);
  assert.equal(parkSeat?.quantity, 6);
  assert.ok(park.hardware.some((item) => item.name.includes("Carriage Bolts") && item.quantity === 8));
});

test("expanded table styles remain deterministic and calculation-safe", () => {
  for (const style of ["modern", "farmhouse", "craftsman", "rustic"] as const) {
    const plan = generateTablePlan({ length: 72, width: 36, height: 30, wood: "cedar", style });
    assert.equal(plan.inputs.style, style);
    assert.equal(plan.cutList.find((piece) => piece.name === "Tabletop Board")?.quantity, 7);
  }
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

const conceptBase: CustomConceptOption = { id:"compact",title:"Compact Linear Station",description:"A compact outdoor prep and grill direction.",intendedUse:"Outdoor cooking",style:"modern",environment:"outdoor",approximateDimensions:{width:"72 in",depth:"30 in",height:"36 in"},suggestedMaterials:["cedar","stainless steel"],finishDirection:"Natural cedar with charcoal accents",majorFeatures:["grill bay","prep surface"],difficulty:"advanced",budget:"750-2000",buildTime:"1-2-weeks",skillCategories:["carpentry"],toolCategories:["cutting tools"],assumptions:["Appliances selected separately"],unresolvedQuestions:["Final grill model"],safetyLimitations:["Requires qualified review for utilities and clearances"],imageStatus:"queued",imageUrl:null,imageAttempts:0,imageError:null,imageLastAttemptedAt:null,verificationStatus:"ai-concept-not-build-verified",verifiedTemplateCandidate:null };
const conceptPackage: CustomConceptPackage = { schemaVersion:1,id:"package-1",originalPrompt:"Outdoor kitchen with grill",createdAt:new Date().toISOString(),generationStatus:"text-ready",concepts:[conceptBase,{...conceptBase,id:"l-shape",title:"L-Shaped Entertaining Kitchen"},{...conceptBase,id:"island",title:"Modular Prep Island"}] };
const providerConcepts = conceptPackage.concepts.map((concept)=>Object.fromEntries(Object.entries(concept).filter(([key])=>!["imageStatus","imageUrl","imageAttempts","imageError","imageLastAttemptedAt","verificationStatus"].includes(key))));

test("custom concept schema requires exactly three distinct safe concepts", () => {
  assert.equal(validateConceptProviderOutput({concepts:providerConcepts})?.length,3);
  assert.equal(validateConceptProviderOutput({concepts:providerConcepts.slice(0,2)}),null);
  assert.equal(validateConceptProviderOutput({concepts:[providerConcepts[0],providerConcepts[0],providerConcepts[2]]}),null);
  assert.equal(validateConceptProviderOutput({concepts:providerConcepts.map((item,index)=>index===0?{...item,cutList:[]}:item)}),null);
  assert.equal(isCustomConceptPackage(conceptPackage),true);
});

test("structured concepts return text-ready without waiting for images", async () => {
  const result = await generateConceptPackage({prompt:"Outdoor kitchen with grill"},{generate:async()=>conceptPackage});
  assert.equal(result.concepts.length,3); assert.equal(result.generationStatus,"text-ready"); assert.ok(result.concepts.every((item)=>item.imageStatus==="queued")); assert.equal(result.concepts[0].verificationStatus,"ai-concept-not-build-verified");
});

test("concept workspace package remains valid and usable without images", () => {
  assert.equal(isCustomConceptPackage(conceptPackage), true);
  assert.ok(conceptPackage.concepts.every((item) => item.title && item.description && item.imageUrl === null && item.imageStatus === "queued"));
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
test("invalid legacy text model migrates to the supported Responses model", () => { assert.equal(resolveOpenAITextModel("gpt-5.4-nano"), "gpt-5.6-luna"); assert.equal(resolveOpenAITextModel(undefined), "gpt-5.6-luna"); assert.equal(resolveOpenAITextModel("custom-model"), "custom-model"); });
test("concept routes reject arbitrary profile, provider, and image fields", () => { assert.equal(validateConceptRequest({prompt:"Outdoor bar",profile:{system:"override"}}).ok,false); assert.equal(validateConceptRequest({prompt:"Outdoor bar",providerOptions:{model:"expensive"}}).ok,false); assert.equal(validateImageRequest({packageId:"p",concept:{...conceptBase,provider:"override"}}).ok,false); assert.equal(validateImageRequest({packageId:"p",concept:{...conceptBase,imageAttempts:4}}).ok,false); assert.equal(validateImageRequest({packageId:"p",concept:conceptBase}).ok,true); });

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
  await requestCustomConcepts({ prompt: "Outdoor kitchen with grill", profile: {}, sessionId: "browser-1", idempotencyKey: "concept:outdoor-kitchen" }, {
    request: async (input) => { url = String(input); return new Response(JSON.stringify({ package: conceptPackage }), { status: 200, headers: { "Content-Type": "application/json" } }); },
    store: (value) => { stored = value; }, navigate: (href) => { navigated = href; },
  });
  assert.equal(url, "/api/design/concepts");
  assert.equal((stored as CustomConceptPackage | null)?.id, conceptPackage.id);
  assert.equal(navigated, "/design/concept/package-1");
});

test("custom concept provider and configuration failures remain retryable errors", async () => {
  for (const message of ["Custom concept generation is not configured.", "Concept generation is temporarily unavailable."]) {
    await assert.rejects(() => requestCustomConcepts({ prompt: "Pergola", profile: {}, sessionId: "browser-1", idempotencyKey: "concept:pergola" }, {
      request: async () => new Response(JSON.stringify({ error: message }), { status: 503, headers: { "Content-Type": "application/json" } }),
      store: () => assert.fail("failed responses must not be stored"), navigate: () => assert.fail("failed responses must not navigate"),
    }), new RegExp(message.replace(/[.]/g, "\\.")));
  }
});

test("duplicate concept idempotency reuses one in-flight and cached package", async () => {
  const cache = new ProgressiveGenerationCache(10_000); let calls = 0;
  const job = async () => { calls += 1; await Promise.resolve(); return conceptPackage; };
  const [first, second] = await Promise.all([cache.concept("same-request", job), cache.concept("same-request", job)]);
  const third = await cache.concept("same-request", job);
  assert.equal(calls, 1); assert.equal(first.value.id, conceptPackage.id); assert.equal(second.reused, true); assert.equal(third.reused, true);
});

test("independent image jobs allow success when another image fails", async () => {
  const calls: string[] = [];
  const request = async (_input: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { concept: CustomConceptOption }; calls.push(body.concept.id);
    if (body.concept.id === "l-shape") return new Response(JSON.stringify({ error: "provider failure" }), { status: 503, headers: { "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ imageUrl: `/generated/${body.concept.id}.webp` }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  const results = await Promise.allSettled(conceptPackage.concepts.map((concept) => requestConceptImage({ packageId: conceptPackage.id, concept, sessionId: "browser-1", idempotencyKey: `${conceptPackage.id}:${concept.id}:attempt:1` }, request)));
  assert.deepEqual(calls.sort(), ["compact", "island", "l-shape"]);
  assert.equal(results.filter((item) => item.status === "fulfilled").length, 2);
  assert.equal(results.filter((item) => item.status === "rejected").length, 1);
});

test("image idempotency reuses a completed result without a second billable job", async () => {
  const cache = new ProgressiveGenerationCache(10_000); let calls = 0;
  const job = async () => { calls += 1; return "/generated/compact.webp"; };
  const first = await cache.image("package:compact:attempt:1", job); const second = await cache.image("package:compact:attempt:1", job);
  assert.equal(first.value, second.value); assert.equal(second.reused, true); assert.equal(calls, 1);
});

test("persisted generating images reopen as interrupted without an automatic duplicate request", () => {
  const values = new Map<string, string>(); Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: (key:string) => values.get(key) ?? null, setItem: (key:string,value:string) => values.set(key,value) }, sessionStorage: { getItem: () => null } } });
  const interrupted = { ...conceptPackage, concepts: conceptPackage.concepts.map((item,index) => index === 0 ? { ...item, imageStatus: "generating" as const, imageAttempts: 1 } : item) };
  storeConceptWorkspace(interrupted); const reopened = readConceptWorkspace(interrupted.id);
  assert.equal(reopened?.concepts[0].imageStatus, "failed"); assert.match(reopened?.concepts[0].imageError ?? "", /interrupted/i); assert.equal(reopened?.concepts[0].imageAttempts, 1);
  delete (globalThis as {window?:unknown}).window;
});

test("retry requests only the specified failed concept", async () => {
  const calls: string[] = []; const failed = { ...conceptBase, imageStatus: "failed" as const, imageAttempts: 1, imageError: "failed" };
  await requestConceptImage({ packageId: conceptPackage.id, concept: failed, sessionId: "browser-1", idempotencyKey: "compact:attempt:2" }, async (_input, init) => { const body = JSON.parse(String(init?.body)) as {concept:CustomConceptOption}; calls.push(body.concept.id); return new Response(JSON.stringify({ imageUrl: "/generated/compact-retry.webp" }), { status: 200, headers: { "Content-Type": "application/json" } }); });
  assert.deepEqual(calls, ["compact"]);
});

test("selected-only generation schedules exactly the selected queued concept", () => {
  assert.deepEqual(selectedImageJobIds(conceptPackage, "l-shape"), ["l-shape"]);
  const ready = { ...conceptPackage, concepts: conceptPackage.concepts.map((item) => item.id === "l-shape" ? { ...item, imageStatus: "ready" as const, imageUrl: "/ready.webp", imageAttempts: 1 } : item) };
  assert.deepEqual(selectedImageJobIds(ready, "l-shape"), []);
  assert.equal(ready.concepts.filter((item) => item.imageStatus === "queued").length, 2);
});

test("generate-all schedules every eligible initial image concurrently", () => {
  assert.deepEqual(allInitialImageJobIds(conceptPackage), ["compact", "l-shape", "island"]);
  const partial = { ...conceptPackage, concepts: conceptPackage.concepts.map((item, index) => index === 0 ? { ...item, imageStatus: "ready" as const, imageUrl: "/ready.webp", imageAttempts: 1 } : item) };
  assert.deepEqual(allInitialImageJobIds(partial), ["l-shape", "island"]);
});

test("every custom concept error category has a safe actionable UI message and status", () => {
  const expected: Record<ConceptErrorCategory, RegExp> = {
    missing_configuration: /Configuration missing/i,
    authentication_failed: /authentication failed/i,
    billing_or_quota_exceeded: /billing or quota/i,
    model_unavailable: /model is unavailable/i,
    provider_rate_limited: /usage limit reached/i,
    local_rate_limited: /usage limit has been reached/i,
    provider_timeout: /took too long/i,
    malformed_provider_response: /could not be validated/i,
    schema_validation_failed: /could not be validated/i,
    network_failure: /network\/provider problem/i,
    unknown_provider_failure: /network\/provider problem/i,
  };
  for (const [category, pattern] of Object.entries(expected) as Array<[ConceptErrorCategory, RegExp]>) {
    const safe = conceptError(category); assert.equal(safe.category, category); assert.match(safe.message, pattern); assert.ok([402,429,502,503,504].includes(conceptErrorStatus(category)));
    assert.doesNotMatch(safe.message, /api key sk-|raw response|stack trace/i);
  }
});

test("provider text parsing distinguishes malformed JSON from schema failure", () => {
  assert.throws(() => parseConceptProviderText("not-json"), (error: unknown) => error instanceof Error && error.message === "malformed_provider_response");
  assert.throws(() => parseConceptProviderText(JSON.stringify({ concepts: [] })), (error: unknown) => error instanceof Error && error.message === "schema_validation_failed");
  assert.equal(parseConceptProviderText(JSON.stringify({ concepts: providerConcepts })).length, 3);
});

test("deterministic AI mode is the default and never constructs a paid provider", () => {
  let providerCalls = 0;
  const factory = () => { providerCalls += 1; return { kind: "paid" }; };
  assert.equal(resolveSawlyAIMode(undefined), "deterministic");
  assert.equal(resolveSawlyAIMode("unexpected"), "deterministic");
  assert.equal(paidAIEnabled(undefined), false);
  assert.equal(createPaidProvider(undefined, true, factory), null);
  assert.equal(createPaidProvider("deterministic", true, factory), null);
  assert.equal(providerCalls, 0);
});

test("OpenAI mode remains an explicit opt-in and still requires configuration", () => {
  let providerCalls = 0;
  const factory = () => { providerCalls += 1; return { kind: "paid" }; };
  assert.equal(createPaidProvider("openai", false, factory), null);
  assert.equal(providerCalls, 0);
  assert.deepEqual(createPaidProvider("openai", true, factory), { kind: "paid" });
  assert.equal(providerCalls, 1);
});

test("verified studio snap points and seating presets stay within generator limits", () => {
  assert.deepEqual(PROJECT_SNAP_POINTS["outdoor-table"], [60, 72, 84, 96]);
  assert.deepEqual(PROJECT_SNAP_POINTS["outdoor-bench"], [48, 60, 72, 84]);
  assert.deepEqual([4, 6, 8, 10].map((seats) => suggestedLengthForSeating("outdoor-table", seats, 36, 144)), [60, 72, 84, 96]);
  assert.deepEqual([4, 6, 8, 10].map((seats) => suggestedLengthForSeating("outdoor-bench", seats, 36, 96)), [72, 96, null, null]);
  assert.equal(seatingCapacity("outdoor-table", 84), 8);
  assert.equal(seatingCapacity("outdoor-bench", 84), 4);
});

test("invalid exact studio values cannot generate plans", () => {
  assert.equal(validateTableInputs({ length: Number(""), width: 36, height: 30, wood: "pine", style: "modern" }), false);
  assert.equal(validateBenchInputs({ length: 60, depth: Number("not-a-number"), seatHeight: 18, wood: "pine" }), false);
});

test("saved projects restore dimensions, material, and style controls", () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: (key: string) => values.get(key) ?? null } } });
  values.set(SAVED_PROJECTS_KEY, JSON.stringify([{ id: "studio-1", projectType: "outdoor-table", projectName: "Modern Outdoor Table", dimensions: { length: 84, width: 40, height: 30 }, material: "cedar", style: "farmhouse", savedAt: new Date().toISOString() }]));
  const restored = readSavedProjects()[0];
  assert.deepEqual(restored?.dimensions, { length: 84, width: 40, height: 30 });
  assert.equal(restored?.material, "cedar");
  assert.equal(restored?.style, "farmhouse");
  delete (globalThis as { window?: unknown }).window;
});

test("studio wheel zoom requires Ctrl or Command while ordinary scrolling passes through", () => {
  assert.equal(studioWheelZoomDelta({ ctrlKey: false, metaKey: false, deltaY: 100 }), null);
  assert.equal(studioWheelZoomDelta({ ctrlKey: true, metaKey: false, deltaY: 100 }), -0.08);
  assert.equal(studioWheelZoomDelta({ ctrlKey: false, metaKey: true, deltaY: -100 }), 0.08);
});

test("studio pan starts only after deliberate pointer movement", () => {
  assert.equal(isDeliberateStudioPan(100, 100, 103, 103), false);
  assert.equal(isDeliberateStudioPan(100, 100, 106, 100), true);
});
