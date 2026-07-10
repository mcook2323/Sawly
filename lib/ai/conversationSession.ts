import { normalizePrompt } from "./savedRequests";
import type { DesignAnswers, DesignQuestionId } from "@/types/ai";

export const CONVERSATION_SESSION_KEY = "sawly.design-conversations.v1";

export interface ConversationSnapshot {
  prompt: string;
  normalizedPrompt: string;
  answers: DesignAnswers;
  answerOrder: DesignQuestionId[];
  completed: boolean;
  updatedAt: string;
}

export type SubmissionDecision = "resume" | "reopen" | "start";

function valid(value: unknown): value is ConversationSnapshot {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ConversationSnapshot>;
  return typeof item.prompt === "string" && typeof item.normalizedPrompt === "string" && !!item.answers && typeof item.answers === "object" && Array.isArray(item.answerOrder) && typeof item.completed === "boolean" && typeof item.updatedAt === "string";
}

export function readConversationSnapshots(): ConversationSnapshot[] {
  try {
    const parsed: unknown = JSON.parse(window.sessionStorage.getItem(CONVERSATION_SESSION_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(valid) : [];
  } catch { return []; }
}

export function writeConversationSnapshot(snapshot: ConversationSnapshot) {
  const others = readConversationSnapshots().filter((item) => item.normalizedPrompt !== snapshot.normalizedPrompt);
  window.sessionStorage.setItem(CONVERSATION_SESSION_KEY, JSON.stringify([snapshot, ...others].slice(0, 10)));
}

export function removeConversationSnapshot(prompt: string) {
  const normalized = normalizePrompt(prompt);
  window.sessionStorage.setItem(CONVERSATION_SESSION_KEY, JSON.stringify(readConversationSnapshots().filter((item) => item.normalizedPrompt !== normalized)));
}

export function decideConversationSubmission(current: ConversationSnapshot | null, submittedPrompt: string, stored: ConversationSnapshot[]) {
  const normalized = normalizePrompt(submittedPrompt);
  const matching = current?.normalizedPrompt === normalized ? current : stored.find((item) => item.normalizedPrompt === normalized) ?? null;
  return { decision: matching ? (matching.completed ? "reopen" : "resume") : "start", snapshot: matching } as { decision: SubmissionDecision; snapshot: ConversationSnapshot | null };
}

export function restartAllowed(answerCount: number, confirmed: boolean) {
  return answerCount === 0 || confirmed;
}
