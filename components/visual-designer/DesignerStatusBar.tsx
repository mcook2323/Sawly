"use client";
import type { ConstraintWarning, VisualScene, VisualSceneObject } from "@/types/visualDesigner";

export function DesignerStatusBar({ scene, selected, constraints, message }: { scene: VisualScene; selected: VisualSceneObject | null; constraints: ConstraintWarning[]; message: string; }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] bg-white px-4 py-3 text-xs text-[var(--color-ink-muted)]"><div><strong className="text-[var(--color-ink)]">{scene.verificationStatus === "verified-generator" ? "Verified generator visualization" : "Concept model — not a verified construction plan."}</strong>{selected && <span> · Selected: {selected.name} ({selected.type})</span>}</div><div>{constraints.length ? `${constraints.length} visual constraint warning${constraints.length === 1 ? "" : "s"}` : "Visual constraints clear"} · {scene.objects.length} components</div><span className="sr-only" aria-live="polite">{message}</span></div>;
}
