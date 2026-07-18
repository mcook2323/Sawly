import type { ConversationEditHistory, ConversationEditHistoryEntry, ConversationEditRequest, ConversationEditResult } from "../../../types/conversationEditor";
import { applyProjectEdits } from "./apply";
import { resolveClarificationAnswer } from "./clarification";
import { recordConversationEdit } from "./history";
import { DeterministicConversationEditor, updateEditorMemory } from "./parser";
import { validateProjectEdits } from "./validator";

export class ConversationEditingService {
  private processedMessageIds = new Set<string>();
  constructor(private editor = new DeterministicConversationEditor()) {}

  execute(request: ConversationEditRequest): ConversationEditResult {
    if (request.messageId && this.processedMessageIds.has(request.messageId)) return { status: "duplicate", project: request.project, edits: [], clarification: request.pendingClarification ?? null, explanation: { summary: "That message was already processed.", changes: [], reason: "Duplicate message IDs are idempotently ignored.", tradeoffs: [], concerns: [] }, memory: request.memory };
    if (request.messageId) this.processedMessageIds.add(request.messageId);
    if (request.pendingClarification) {
      const resolution = resolveClarificationAnswer(request.pendingClarification, request.text, request.project, request.memory);
      if (resolution.status === "cancelled") return { status: "cancelled", project: request.project, edits: [], clarification: null, explanation: { summary: resolution.message, changes: [], reason: "User cancelled the pending edit.", tradeoffs: [], concerns: [] }, memory: request.memory };
      if (resolution.status !== "resolved") return { status: "clarification", project: request.project, edits: request.pendingClarification.retainedEdits, clarification: resolution.clarification, explanation: { summary: resolution.message, changes: [], reason: resolution.clarification.reason, tradeoffs: [], concerns: [] }, memory: request.memory };
      return this.complete({ ...request, memory: updateEditorMemory(request.memory, resolution.edits) }, resolution.edits, { originalRequest: request.pendingClarification.originalRequest, question: request.pendingClarification.question, answer: resolution.answer });
    }

    const translation = this.editor.translate(request);
    if (translation.clarification) return { status: "clarification", project: request.project, edits: translation.edits, clarification: translation.clarification, explanation: { summary: translation.clarification.question, changes: [], reason: translation.clarification.reason, tradeoffs: [], concerns: [] }, memory: translation.memory };
    return this.complete({ ...request, memory: translation.memory }, translation.edits);
  }

  private complete(request: ConversationEditRequest, edits: ConversationEditResult["edits"], clarificationContext?: ConversationEditResult["clarificationContext"]): ConversationEditResult {
    const validation = validateProjectEdits(request.project, edits);
    if (!validation.valid) {
      const route = validation.requiresDeterministicGenerator;
      return { status: route ? "route-required" : "rejected", project: request.project, edits: validation.accepted, clarification: null, explanation: { summary: route ? "This change must go through the verified deterministic generator." : "I could not safely apply that change.", changes: [], reason: validation.issues.map((issue) => issue.message).join(" "), tradeoffs: [], concerns: validation.issues.map((issue) => issue.message) }, memory: request.memory, clarificationContext };
    }
    const applied = applyProjectEdits(request.project, validation.accepted);
    const explanation = clarificationContext && validation.accepted.length === 1 ? { ...applied.explanation, summary: clarificationConfirmation(validation.accepted[0]!) } : applied.explanation;
    return { status: "applied", project: applied.project, edits: validation.accepted, clarification: null, explanation, memory: request.memory, clarificationContext };
  }
}

function clarificationConfirmation(edit: ConversationEditResult["edits"][number]) {
  if (edit.type === "dimension-change" && edit.operation === "delta") return `I ${edit.axis === "width" ? edit.value > 0 ? "widened" : "narrowed" : edit.axis === "height" ? edit.value > 0 ? "made" : "shortened" : "adjusted"} the project${edit.axis === "height" && edit.value > 0 ? " taller" : ""} by ${Math.abs(edit.value)} inches.`;
  if (edit.type === "component-move") return `I moved the ${edit.target.selector ?? "selected component"} ${Math.abs(edit.value)} inches ${edit.axis === "y" ? edit.value < 0 ? "lower" : "higher" : edit.axis === "x" ? edit.value < 0 ? "left" : "right" : edit.value < 0 ? "back" : "forward"}.`;
  if (edit.type === "component-resize") return `I ${edit.value < 0 ? "shortened" : "resized"} the ${edit.target.selector ?? "selected component"} by ${Math.abs(edit.value)} inches.`;
  return "I applied the clarified change.";
}

export function resultToHistory(history: ConversationEditHistory, request: string, result: ConversationEditResult, before: ConversationEditRequest["project"]): ConversationEditHistory {
  if (result.status !== "applied") return history;
  const entry: ConversationEditHistoryEntry = { id: `history-${result.edits[0]?.id ?? Date.now()}`, request: result.clarificationContext?.originalRequest ?? request, edits: result.edits, before: structuredClone(before), after: structuredClone(result.project), explanation: result.explanation, timestamp: result.edits.at(-1)?.timestamp ?? new Date().toISOString(), origin: "user", ...(result.clarificationContext ? { clarification: result.clarificationContext } : {}) };
  return { ...recordConversationEdit(history, entry), memory: result.memory };
}
