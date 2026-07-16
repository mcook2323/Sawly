import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createConceptImageProvider } from "@/lib/concepts/imageProvider";
import { createConceptImageStorage } from "@/lib/concepts/imageStorage";
import { createConceptProvider } from "@/lib/concepts/provider";
import { conceptRateLimiter, withSessionJob } from "@/lib/concepts/rateLimits";
import { MAX_CONCEPT_BODY_BYTES, validateConceptRequest } from "@/lib/concepts/requestValidation";
import { generateConceptPackage } from "@/lib/concepts/service";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_CONCEPT_BODY_BYTES) return NextResponse.json({ error: "Request too large.", requestId }, { status: 413 });
    let body: unknown; try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid request.", requestId }, { status: 400 }); }
    const valid = validateConceptRequest(body); if (!valid.ok) return NextResponse.json({ error: valid.error, requestId }, { status: 400 });
    const provider = createConceptProvider(); if (!provider) return NextResponse.json({ error: "Custom concept generation is not configured.", requestId }, { status: 503 });
    const session = request.headers.get("x-sawly-session")?.slice(0,100) || "anonymous"; const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const fingerprint = createHash("sha256").update(`${session}:${valid.value.prompt.toLowerCase()}:${valid.value.revision || ""}`).digest("hex");
    const limit = conceptRateLimiter.check([`concept-ip:${ip}`,`concept-session:${session}`],fingerprint);
    if (!limit.allowed) return NextResponse.json({ error: "Concept limit reached. Please try again later.", requestId, retryAfterSeconds: limit.retryAfterSeconds }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } });
    const result = await withSessionJob("concept",session,() => generateConceptPackage(valid.value,provider,valid.value.revision?null:createConceptImageProvider(),valid.value.revision?null:createConceptImageStorage()));
    return NextResponse.json({ requestId, package: result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof Error && error.message === "job-active" ? 429 : 503;
    return NextResponse.json({ error: status===429?"A concept is already generating.":"Concept generation is temporarily unavailable.", requestId }, { status, headers: { "Cache-Control":"no-store" } });
  }
}
