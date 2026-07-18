import type { DesignerHistory } from "../../types/visualDesigner";

export function createHistory<T>(initial: T, limit = 40): DesignerHistory<T> { return { past: [], present: initial, future: [], limit }; }
export function commitHistory<T>(history: DesignerHistory<T>, next: T): DesignerHistory<T> { return { ...history, past: [...history.past, history.present].slice(-history.limit), present: next, future: [] }; }
export function undoHistory<T>(history: DesignerHistory<T>): DesignerHistory<T> { const previous = history.past.at(-1); return previous === undefined ? history : { ...history, past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] }; }
export function redoHistory<T>(history: DesignerHistory<T>): DesignerHistory<T> { const next = history.future[0]; return next === undefined ? history : { ...history, past: [...history.past, history.present].slice(-history.limit), present: next, future: history.future.slice(1) }; }
