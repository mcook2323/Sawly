import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createConceptImageProvider } from "@/lib/concepts/imageProvider";
import { createConceptImageStorage } from "@/lib/concepts/imageStorage";
import { imageRateLimiter } from "@/lib/concepts/rateLimits";
import { validateImageRequest } from "@/lib/concepts/requestValidation";
import { progressiveGenerationCache } from "@/lib/concepts/progressiveCache";
import { logAIEvent } from "@/lib/ai/server/logger";
import { paidAIEnabled } from "@/lib/ai/mode";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const requestId = randomUUID(); const startedAt = Date.now();
  if (!paidAIEnabled()) return NextResponse.json({ error: "Custom AI image generation is disabled in this deployment.", requestId }, { status: 503, headers: { "Cache-Control": "no-store" } });
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 16_000) return NextResponse.json({ error: "Request too large.", requestId }, { status: 413 });
    let body: unknown; try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid request.", requestId }, { status: 400 }); }
    const valid = validateImageRequest(body); if (!valid.ok) return NextResponse.json({ error: valid.error, requestId }, { status: 400 });
    const session = request.headers.get("x-sawly-session")?.slice(0,100) || "anonymous"; const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const fingerprint = createHash("sha256").update(`${session}:${valid.value.packageId}:${valid.value.concept.id}`).digest("hex");
    const cached = progressiveGenerationCache.getImage(fingerprint);
    if (cached) return NextResponse.json({ requestId, imageUrl: cached, imageStatus: "ready", reused: true, latencyMs: 0 }, { headers: { "Cache-Control": "no-store" } });
    if (!progressiveGenerationCache.hasImageInFlight(fingerprint)) { const limit = imageRateLimiter.check([`image-ip:${ip}`,`image-session:${session}`],fingerprint); if (!limit.allowed) return NextResponse.json({ error: "Image limit reached. Please try again later.", requestId, retryAfterSeconds: limit.retryAfterSeconds }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } }); }
    const provider = createConceptImageProvider(); if (!provider) return NextResponse.json({ error: "Image generation is not configured.", requestId }, { status: 503 });
    const storage = createConceptImageStorage();
    const result = await progressiveGenerationCache.image(fingerprint, async () => { const bytes = await provider.generate(valid.value.concept); return storage.save(`${valid.value.packageId}-${valid.value.concept.id}-${Date.now()}`, bytes); });
    const latencyMs = Date.now() - startedAt; logAIEvent({ requestId, category: result.reused ? "concept-image-inflight-reused" : "concept-image-success", latencyMs });
    return NextResponse.json({ requestId, imageUrl: result.value, imageStatus: "ready", reused: result.reused, latencyMs }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    logAIEvent({ requestId, category: "concept-image-failure", latencyMs: Date.now() - startedAt });
    return NextResponse.json({ error: "Image generation failed. Your concept is still available.", requestId }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
