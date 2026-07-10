import type { DesignAnswers } from "@/types/ai";

export const MAX_REQUEST_BYTES = 12_000;
export const MAX_PROMPT_LENGTH = 1_000;

export interface ConversationRequest { prompt: string; answers: DesignAnswers; profile?: unknown; action?: "continue" | "retry"; }

export function validateConversationRequest(value: unknown): { ok: true; value: ConversationRequest } | { ok: false; error: string } {
  if (!value || typeof value !== "object") return { ok: false, error: "Invalid request." };
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !["prompt", "answers", "profile", "action"].includes(key))) return { ok: false, error: "Invalid request." };
  if (typeof input.prompt !== "string") return { ok: false, error: "A prompt is required." };
  const prompt = input.prompt.trim().replace(/\s+/g, " ");
  if (!prompt) return { ok: false, error: "A prompt is required." };
  if (prompt.length > MAX_PROMPT_LENGTH) return { ok: false, error: "The prompt is too long." };
  if (input.answers !== undefined && (!input.answers || typeof input.answers !== "object" || Array.isArray(input.answers))) return { ok: false, error: "Invalid answers." };
  const allowed = new Set(["projectType", "environment", "dimensions", "capacity", "budget", "material", "style", "intendedUse"]);
  const answers = (input.answers ?? {}) as Record<string, unknown>;
  if (Object.keys(answers).some((key) => !allowed.has(key)) || Object.values(answers).some((answer) => typeof answer !== "string" && typeof answer !== "number")) return { ok: false, error: "Invalid answers." };
  const action = input.action === "retry" ? "retry" : "continue";
  if (input.profile !== undefined && (!input.profile || typeof input.profile !== "object" || Array.isArray(input.profile))) return { ok: false, error: "Invalid profile." };
  return { ok: true, value: { prompt, answers: answers as DesignAnswers, profile: input.profile, action } };
}
