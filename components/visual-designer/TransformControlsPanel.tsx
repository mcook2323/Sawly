"use client";
import type { SnapIncrement } from "@/lib/visual-designer/snapping";
import type { TransformMode } from "@/types/visualDesigner";

export function TransformControlsPanel({ mode, enabled, increment, onEnabled, onIncrement }: { mode: TransformMode; enabled: boolean; increment: SnapIncrement; onEnabled: (enabled: boolean) => void; onIncrement: (increment: SnapIncrement) => void; }) {
  return <div className="rounded-xl bg-[var(--color-canvas-muted)] p-3"><p className="text-xs font-semibold uppercase tracking-wide">{mode} controls</p><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={enabled} onChange={(event) => onEnabled(event.target.checked)} /> Snap transforms</label><label className="mt-3 block text-sm">Increment<select value={increment} onChange={(event) => onIncrement(Number(event.target.value) as SnapIncrement)} className="ds-input mt-1 w-full"><option value={0.125}>1/8 inch</option><option value={0.25}>1/4 inch</option><option value={0.5}>1/2 inch</option></select></label></div>;
}
