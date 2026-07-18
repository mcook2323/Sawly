"use client";
import { Button } from "@/components/ui/Button";
import type { CameraView, TransformMode, VisualMode } from "@/types/visualDesigner";

export function DesignerToolbar({ mode, transform, showDimensions, orthographic, canUndo, canRedo, onMode, onTransform, onDimensions, onView, onOrthographic, onUndo, onRedo, onReset, onFit, onZoom }: { mode: VisualMode; transform: TransformMode; showDimensions: boolean; orthographic: boolean; canUndo: boolean; canRedo: boolean; onMode: (mode: VisualMode) => void; onTransform: (mode: TransformMode) => void; onDimensions: () => void; onView: (view: CameraView) => void; onOrthographic: () => void; onUndo: () => void; onRedo: () => void; onReset: () => void; onFit: () => void; onZoom: (delta: number) => void; }) {
  return <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-white p-3" role="toolbar" aria-label="Visual designer tools">
    {(["select", "move", "rotate", "resize"] as TransformMode[]).map((item) => <Button key={item} variant={transform === item ? "primary" : "ghost"} className="min-h-10 capitalize" onClick={() => onTransform(item)}>{item}</Button>)}
    <span className="mx-1 h-7 w-px bg-[var(--color-border)]" aria-hidden="true" />
    {(["blueprint", "workshop", "lifestyle"] as VisualMode[]).map((item) => <Button key={item} variant={mode === item ? "secondary" : "ghost"} className="min-h-10 capitalize" onClick={() => onMode(item)}>{item}</Button>)}
    <Button variant={showDimensions ? "secondary" : "ghost"} onClick={onDimensions}>Dimensions</Button><Button variant={orthographic ? "secondary" : "ghost"} onClick={onOrthographic}>{orthographic ? "Orthographic" : "Perspective"}</Button>
    <details className="relative"><summary className="ds-button ds-button-ghost cursor-pointer list-none">Views</summary><div className="absolute left-0 top-12 z-30 grid min-w-40 gap-1 rounded-xl border border-[var(--color-border)] bg-white p-2 shadow-lg">{(["perspective", "front", "back", "left", "right", "top"] as CameraView[]).map((view) => <button key={view} type="button" className="rounded-lg px-3 py-2 text-left text-sm capitalize hover:bg-[var(--color-canvas-muted)]" onClick={() => onView(view)}>{view}</button>)}</div></details>
    <Button variant="ghost" onClick={() => onZoom(0.1)} aria-label="Zoom in">Zoom +</Button><Button variant="ghost" onClick={() => onZoom(-0.1)} aria-label="Zoom out">Zoom −</Button><Button variant="ghost" onClick={onFit}>Fit / reset view</Button><Button variant="ghost" onClick={onUndo} disabled={!canUndo} aria-label="Undo edit">Undo</Button><Button variant="ghost" onClick={onRedo} disabled={!canRedo} aria-label="Redo edit">Redo</Button><Button variant="ghost" onClick={onReset}>Reset concept</Button>
  </div>;
}
