import type { ConversationEditHistory, ConversationEditHistoryEntry, ConversationEditRequest, ConversationEditResult } from "../../../types/conversationEditor";
import { applyProjectEdits } from "./apply";
import { DeterministicConversationEditor } from "./parser";
import { recordConversationEdit } from "./history";
import { validateProjectEdits } from "./validator";

export class ConversationEditingService {
  constructor(private editor = new DeterministicConversationEditor()) {}
  execute(request: ConversationEditRequest): ConversationEditResult {
    const translation = this.editor.translate(request);
    if (translation.clarification) return { status: "clarification", project: request.project, edits: translation.edits, clarification: translation.clarification, explanation: { summary: translation.clarification.question, changes: [], reason: translation.clarification.reason, tradeoffs: [], concerns: [] }, memory: translation.memory };
    const validation = validateProjectEdits(request.project, translation.edits);
    if (!validation.valid) { const route = validation.requiresDeterministicGenerator; return { status: route ? "route-required" : "rejected", project: request.project, edits: validation.accepted, clarification: null, explanation: { summary: route ? "This change must go through the verified deterministic generator." : "I could not safely apply that change.", changes: [], reason: validation.issues.map((issue) => issue.message).join(" "), tradeoffs: [], concerns: validation.issues.map((issue) => issue.message) }, memory: translation.memory }; }
    const applied = applyProjectEdits(request.project, validation.accepted);
    return { status: "applied", project: applied.project, edits: validation.accepted, clarification: null, explanation: applied.explanation, memory: translation.memory };
  }
}

export function resultToHistory(history: ConversationEditHistory, request: string, result: ConversationEditResult, before: ConversationEditRequest["project"]): ConversationEditHistory {
  if (result.status !== "applied") return history;
  const entry: ConversationEditHistoryEntry = { id: `history-${result.edits[0]?.id ?? Date.now()}`, request, edits: result.edits, before: structuredClone(before), after: structuredClone(result.project), explanation: result.explanation, timestamp: result.edits.at(-1)?.timestamp ?? new Date().toISOString(), origin: "user" };
  return { ...recordConversationEdit(history, entry), memory: result.memory };
}
