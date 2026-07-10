import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { runConversation } from "@/lib/ai/server/conversationService";
import { logAIEvent } from "@/lib/ai/server/logger";
import { conversationRateLimiter } from "@/lib/ai/server/rateLimiter";
import { MAX_REQUEST_BYTES, validateConversationRequest } from "@/lib/ai/server/requestValidation";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const started = Date.now(); const requestId = randomUUID();
  try {
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > MAX_REQUEST_BYTES) return NextResponse.json({ error: "Request too large.", requestId }, { status: 413 });
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_REQUEST_BYTES) return NextResponse.json({ error: "Request too large.", requestId }, { status: 413 });
    let body: unknown; try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid request.", requestId }, { status: 400 }); }
    const validated = validateConversationRequest(body);
    if (!validated.ok) return NextResponse.json({ error: validated.error, requestId }, { status: 400 });
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"; const session = request.headers.get("x-sawly-session")?.slice(0, 100) || "anonymous";
    const fingerprint = createHash("sha256").update(`${session}:${validated.value.prompt.toLowerCase()}:${JSON.stringify(validated.value.answers)}`).digest("hex");
    const limited = conversationRateLimiter.check([`ip:${ip}`, `session:${session}`], fingerprint);
    if (!limited.allowed) { logAIEvent({ requestId, category: `rate-limit-${limited.reason}` }); return NextResponse.json({ error: "Too many requests. Please wait and try again.", requestId, retryAfterSeconds: limited.retryAfterSeconds }, { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds), "Cache-Control": "no-store" } }); }
    const result = await runConversation(validated.value); logAIEvent({ requestId: result.requestId, category: "success", latencyMs: Date.now() - started, fallback: result.mode === "deterministic-fallback" });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch { logAIEvent({ requestId, category: "route-error", latencyMs: Date.now() - started }); return NextResponse.json({ error: "Design guidance is temporarily unavailable.", requestId }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
