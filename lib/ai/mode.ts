export type SawlyAIMode = "deterministic" | "openai";

export function resolveSawlyAIMode(value: string | undefined): SawlyAIMode {
  return value?.trim().toLowerCase() === "openai" ? "openai" : "deterministic";
}

export function paidAIEnabled(value: string | undefined = process.env.SAWLY_AI_MODE) {
  return resolveSawlyAIMode(value) === "openai";
}

export function createPaidProvider<T>(mode: string | undefined, configured: boolean, factory: () => T): T | null {
  return paidAIEnabled(mode) && configured ? factory() : null;
}
