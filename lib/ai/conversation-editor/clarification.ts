import type { EditorMemory, PendingClarification, StructuredProjectEdit } from "../../../types/conversationEditor";
import type { UniversalWoodProject } from "../../../types/universalProject";

export type ClarificationResolution =
  | { status: "resolved"; edits: StructuredProjectEdit[]; answer: string }
  | { status: "still-missing" | "invalid-answer"; clarification: PendingClarification; message: string }
  | { status: "cancelled"; message: string };

const numberWords: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12 };

function amountFromAnswer(answer: string): number | null {
  const numeric = answer.match(/(?:^|\b|by\s+)(-?\d+(?:\.\d+)?)\s*(?:inches|inch|in|\")?/i);
  if (numeric) return Number(numeric[1]);
  const word = Object.entries(numberWords).find(([key]) => new RegExp(`\\b${key}\\b`, "i").test(answer));
  return word?.[1] ?? null;
}

export function resolveClarificationAnswer(pending: PendingClarification, userAnswer: string, _project: UniversalWoodProject, _memory: EditorMemory): ClarificationResolution {
  void _memory;
  const answer = userAnswer.trim();
  if (/^(?:cancel|never mind|nevermind|forget it)[.!]?$/i.test(answer)) return { status: "cancelled", message: "Okay — I cancelled that change." };
  if (!answer) return { status: "still-missing", clarification: pending, message: pending.question };
  if (pending.missingField === "amount" || pending.missingField === "desired-final-dimension") {
    const amount = amountFromAnswer(answer);
    if (amount === null || !Number.isFinite(amount) || amount <= 0) return { status: "invalid-answer", clarification: pending, message: `Please enter a specific amount, such as 6 ${pending.expectedUnit === "in" ? "inches" : "units"}.` };
    const draft = pending.draft;
    let completed: StructuredProjectEdit | null = null;
    if (draft.type === "dimension-change") completed = { ...draft.base, type: "dimension-change", axis: draft.axis, operation: draft.operation, value: amount * draft.direction, unit: draft.unit ?? "in" };
    if (draft.type === "component-move") completed = { ...draft.base, type: "component-move", axis: draft.axis, operation: draft.operation, value: amount * draft.direction, unit: draft.unit ?? "in" };
    if (draft.type === "component-resize") completed = { ...draft.base, type: "component-resize", axis: draft.axis, operation: draft.operation, value: amount * draft.direction, unit: draft.unit ?? "in" };
    if (completed) return { status: "resolved", edits: [...pending.retainedEdits, completed], answer };
  }
  if ((pending.missingField === "target" || pending.missingField === "component") && pending.draft.type === "component-remove") {
    const normalized = answer.toLowerCase().replace(/^(?:the|a|an)\s+/, "").replace(/[.!?]+$/, "").trim();
    const component = _project.components.find((item) => `${item.name} ${item.role}`.toLowerCase().includes(normalized.replace(/s$/, "")));
    if (!component) return { status: "invalid-answer", clarification: pending, message: "Please name a component that appears in this project." };
    const completed: StructuredProjectEdit = { ...pending.draft.base, type: "component-remove", target: { scope: "component", id: component.id, selector: component.name.toLowerCase() } };
    return { status: "resolved", edits: [...pending.retainedEdits, completed], answer };
  }
  return { status: "still-missing", clarification: pending, message: pending.question };
}
