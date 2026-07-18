"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ConversationEditingService, createConversationEditHistory, redoConversationEdit, replayConversationEdits, resultToHistory, summarizeConversationEdits, undoConversationEdit } from "@/lib/ai/conversation-editor";
import type { EditExplanation, PendingClarification } from "@/types/conversationEditor";
import type { UniversalWoodProject } from "@/types/universalProject";

interface Message { id: string; role: "user" | "assistant"; text: string; details?: EditExplanation; }
let messageSequence = 0;
function messageId(prefix: string) { messageSequence += 1; return `${prefix}-${Date.now()}-${messageSequence}`; }

export function ConversationEditPanel({ project, selectedComponentId, onApply }: { project: UniversalWoodProject; selectedComponentId: string | null; onApply: (project: UniversalWoodProject, explanation: EditExplanation) => void; }) {
  const service = useMemo(() => new ConversationEditingService(), []);
  const [input, setInput] = useState("");
  const [clarification, setClarification] = useState<PendingClarification | null>(null);
  const [messages, setMessages] = useState<Message[]>([{ id: "welcome", role: "assistant", text: "Tell me what you want to change. I’ll translate it into validated concept edits before the model updates." }]);
  const [history, setHistory] = useState(() => createConversationEditHistory(project));
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);
  const processedMessageIds = useRef(new Set<string>());

  function submit(event: FormEvent) {
    event.preventDefault();
    const answer = input.trim();
    if (!answer || processingRef.current) return;
    const userMessageId = messageId("user");
    if (processedMessageIds.current.has(userMessageId)) return;
    processedMessageIds.current.add(userMessageId);
    processingRef.current = true;
    setProcessing(true);
    const pending = clarification;
    const before = project;
    try {
      const result = service.execute({ text: answer, project: before, memory: history.memory, selectedComponentId, pendingClarification: pending, messageId: userMessageId });
      setMessages((current) => [...current, { id: userMessageId, role: "user", text: answer }, { id: messageId("assistant"), role: "assistant", text: result.explanation.summary, details: result.explanation }]);
      setInput("");
      setClarification(result.clarification);
      if (result.status === "applied") {
        setHistory((current) => resultToHistory(current, pending?.originalRequest ?? answer, result, before));
        onApply(result.project, result.explanation);
      }
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  }

  function undo() { const result = undoConversationEdit(history); setHistory(result.history); onApply(result.project, { summary: "Undid the latest conversational edit.", changes: [], reason: "User requested undo.", tradeoffs: [], concerns: [] }); setMessages((current) => [...current, { id: messageId("undo"), role: "assistant", text: "Undid the latest conversational edit." }]); }
  function redo() { const result = redoConversationEdit(history); setHistory(result.history); onApply(result.project, { summary: "Redid the latest conversational edit.", changes: [], reason: "User requested redo.", tradeoffs: [], concerns: [] }); setMessages((current) => [...current, { id: messageId("redo"), role: "assistant", text: "Redid the latest conversational edit." }]); }
  function replay() { const replayed = replayConversationEdits(history); onApply(replayed, { summary: "Replayed the validated conversation history.", changes: history.past.flatMap((entry) => entry.explanation.changes), reason: "User requested conversation replay.", tradeoffs: [], concerns: [] }); setMessages((current) => [...current, { id: messageId("replay"), role: "assistant", text: summarizeConversationEdits(history) }]); }

  return <section className="border-b border-[var(--color-border)] bg-[var(--color-canvas-muted)] p-4" aria-label="Conversational design editor"><details open><summary className="cursor-pointer text-sm font-semibold">Edit this concept with Sawly</summary><div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]"><div><div className="max-h-56 space-y-3 overflow-auto rounded-xl bg-white p-4" aria-live="polite">{messages.map((message) => <div key={message.id} className={message.role === "user" ? "ml-auto max-w-[85%] rounded-xl bg-[var(--color-brand)] px-3 py-2 text-sm text-white" : "max-w-[92%] rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"}><p>{message.text}</p>{message.details && (message.details.changes.length > 0 || message.details.tradeoffs.length > 0 || message.details.concerns.length > 0) && <details className="mt-2"><summary className="cursor-pointer text-xs font-semibold">Why and tradeoffs</summary>{message.details.changes.map((change) => <p key={change} className="mt-1 text-xs">Changed: {change}</p>)}{message.details.tradeoffs.map((tradeoff) => <p key={tradeoff} className="mt-1 text-xs">Tradeoff: {tradeoff}</p>)}{message.details.concerns.map((concern) => <p key={concern} className="mt-1 text-xs">Concern: {concern}</p>)}</details>}</div>)}</div>{clarification && <div className="mt-3 rounded-xl border border-[var(--color-clay)]/30 bg-white p-3"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">Pending change</p><p className="mt-1 text-sm">“{clarification.originalRequest}”</p><p className="mt-2 text-sm font-semibold text-[var(--color-clay)]">{clarification.question}</p></div>}<form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row"><label htmlFor="conversation-edit-input" className="sr-only">{clarification ? `Answer: ${clarification.question}` : "Describe a concept change"}</label><input id="conversation-edit-input" value={input} onChange={(event) => setInput(event.target.value)} className="ds-input flex-1" placeholder={clarification ? "Enter your answer" : "Try: Make it 8 inches taller and use walnut"} disabled={processing} /><Button type="submit" disabled={!input.trim() || processing}>{processing ? "Applying…" : clarification ? "Answer" : "Apply edit"}</Button></form></div><div className="flex flex-wrap content-start gap-2 lg:max-w-48"><Button variant="secondary" onClick={undo} disabled={!history.past.length || processing}>Undo edit</Button><Button variant="secondary" onClick={redo} disabled={!history.future.length || processing}>Redo edit</Button><Button variant="ghost" onClick={replay} disabled={!history.past.length || processing}>Replay</Button><div className="w-full rounded-xl bg-white p-3 text-xs text-[var(--color-ink-muted)]">{summarizeConversationEdits(history)}</div></div></div></details></section>;
}
