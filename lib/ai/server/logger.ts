type Event = { requestId: string; category: string; latencyMs?: number; fallback?: boolean; errorCategory?: string; httpStatus?: number; providerCode?: string; fallbackAttempted?: boolean };
export function logAIEvent(event: Event) {
  console.info("[sawly-ai]", { timestamp: new Date().toISOString(), ...event });
}
