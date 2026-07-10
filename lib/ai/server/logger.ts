type Event = { requestId: string; category: string; latencyMs?: number; fallback?: boolean };
export function logAIEvent(event: Event) {
  console.info("[sawly-ai]", { timestamp: new Date().toISOString(), ...event });
}
