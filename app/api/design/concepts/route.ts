import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createConceptProvider } from "@/lib/concepts/provider";
import { conceptRateLimiter, withConceptSessionJob } from "@/lib/concepts/rateLimits";
import { MAX_CONCEPT_BODY_BYTES, validateConceptRequest } from "@/lib/concepts/requestValidation";
import { generateConceptPackage } from "@/lib/concepts/service";
import { progressiveGenerationCache } from "@/lib/concepts/progressiveCache";
import { logAIEvent } from "@/lib/ai/server/logger";
import { conceptError, conceptErrorStatus } from "@/lib/concepts/errors";
import { categorizeConceptProviderError } from "@/lib/concepts/providerErrors";
import { paidAIEnabled } from "@/lib/ai/mode";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const requestId = randomUUID(); const startedAt = Date.now();
  if (!paidAIEnabled()) return NextResponse.json({ error: { category: "missing_configuration", message: "Custom AI concept generation is disabled in this deployment." }, requestId }, { status: 503, headers: { "Cache-Control": "no-store" } });
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_CONCEPT_BODY_BYTES) return NextResponse.json({ error: "Request too large.", requestId }, { status: 413 });
    let body: unknown; try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid request.", requestId }, { status: 400 }); }
    const valid = validateConceptRequest(body); if (!valid.ok) return NextResponse.json({ error: valid.error, requestId }, { status: 400 });
    const session = request.headers.get("x-sawly-session")?.slice(0,100) || "anonymous"; const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const clientKey = request.headers.get("x-idempotency-key")?.slice(0,160) || "";
    const fingerprint = createHash("sha256").update(`${session}:${clientKey}:${valid.value.prompt.toLowerCase()}:${valid.value.revision || ""}`).digest("hex");
    const cached = progressiveGenerationCache.getConcept(fingerprint);
    if (cached) { logAIEvent({ requestId, category: "concept-text-cache-hit", latencyMs: Date.now() - startedAt }); return NextResponse.json({ requestId, package: cached, reused: true, latencyMs: { text: 0, preparation: Date.now() - startedAt } }, { headers: { "Cache-Control": "no-store" } }); }
    if (!progressiveGenerationCache.hasConceptInFlight(fingerprint)) { const limit = conceptRateLimiter.check([`concept-ip:${ip}`,`concept-session:${session}`],fingerprint); if (!limit.allowed) { const safe = conceptError("local_rate_limited"); logAIEvent({ requestId, category: "concept-text-failure", errorCategory: safe.category, httpStatus: 429, latencyMs: Date.now() - startedAt, fallbackAttempted: false }); return NextResponse.json({ error: safe, requestId, retryAfterSeconds: limit.retryAfterSeconds }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } }); } }
    const provider = createConceptProvider(); if (!provider) { const safe = conceptError("missing_configuration"); logAIEvent({ requestId, category: "concept-text-failure", errorCategory: safe.category, httpStatus: 503, latencyMs: Date.now() - startedAt, fallbackAttempted: false }); return NextResponse.json({ error: safe, requestId }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
    const textStartedAt = Date.now(); const result = await progressiveGenerationCache.concept(fingerprint, () => withConceptSessionJob(session, () => generateConceptPackage(valid.value, provider))); const textMs = Date.now() - textStartedAt;
    logAIEvent({ requestId, category: result.reused ? "concept-text-inflight-reused" : "concept-text-success", latencyMs: textMs });
    return NextResponse.json({ requestId, package: result.value, reused: result.reused, latencyMs: { text: textMs, preparation: Date.now() - startedAt } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const failure = error instanceof Error && error.message === "job-active" ? { category: "local_rate_limited" as const } : categorizeConceptProviderError(error);
    const safe = conceptError(failure.category); const status = conceptErrorStatus(failure.category);
    logAIEvent({ requestId, category: "concept-text-failure", errorCategory: failure.category, httpStatus: status, providerCode: failure.providerCode, latencyMs: Date.now() - startedAt, fallbackAttempted: false });
    return NextResponse.json({ error: safe, requestId }, { status, headers: { "Cache-Control":"no-store" } });
  }
}
