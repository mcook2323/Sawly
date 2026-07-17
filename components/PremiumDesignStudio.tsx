"use client";

import { useMemo, useRef, useState } from "react";
import { getMaterialLabel, type WoodMaterial } from "@/calculations/materialCatalog";
import type { CostRange, ShoppingList } from "@/calculations/materials";
import type { GeneratedProjectPlan } from "@/calculations/projectPlan";

type Mode = "lifestyle" | "blueprint";
type ProjectKind = "table" | "bench";
type DimensionKey = "length" | "width" | "height" | "depth" | "seatHeight";

type StudioDimension = { key: DimensionKey; label: string; value: number; min: number; max: number; onChange: (value: string) => void };

type InspectorMetric = { label: string; value: string };

type SavedVersion = { id: "A" | "B"; dimensions: Record<string, number>; cost: string; lumber: number; shopping: string[] } | null;

interface Props {
  projectKind: ProjectKind;
  material: WoodMaterial;
  style: string;
  dimensions: StudioDimension[];
  plan: GeneratedProjectPlan | null;
  shoppingList: ShoppingList | null;
  buildTime: string;
  difficulty: string;
}

const materialStops: Record<WoodMaterial, { base: string; dark: string; light: string; end: string }> = {
  pine: { base: "#d3a36e", dark: "#8f643e", light: "#f2cf98", end: "#b98250" },
  cedar: { base: "#b96c4d", dark: "#713e31", light: "#d99570", end: "#8e4f3a" },
  treated: { base: "#9e9978", dark: "#626349", light: "#c0bd92", end: "#7d795d" },
};

const styleNotes: Record<string, { leg: string; apron: string; edge: string; spacing: string }> = {
  modern: { leg: "tapered square", apron: "recessed slim", edge: "small roundover", spacing: "even narrow gaps" },
  farmhouse: { leg: "chunky post", apron: "deep breadboard", edge: "soft eased edge", spacing: "classic board spacing" },
  craftsman: { leg: "substantial square", apron: "stepped rail", edge: "beveled highlight", spacing: "measured reveals" },
  rustic: { leg: "heavy straight", apron: "exposed rail", edge: "weathered chamfer", spacing: "wider hand-built gaps" },
  park: { leg: "stout park frame", apron: "utility stretcher", edge: "durable eased edge", spacing: "open slat gaps" },
  minimal: { leg: "thin shadow line", apron: "hidden support", edge: "crisp square edge", spacing: "tight refined gaps" },
};

function money(range: CostRange | null | undefined) {
  if (!range) return "—";
  return `$${Math.round(range.minCents / 100)}–$${Math.round(range.maxCents / 100)}`;
}

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }

export function PremiumDesignStudio({ projectKind, material, style, dimensions, plan, shoppingList, buildTime, difficulty }: Props) {
  const [mode, setMode] = useState<Mode>("lifestyle");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<StudioDimension | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [versions, setVersions] = useState<{ A: SavedVersion; B: SavedVersion }>({ A: null, B: null });
  const [activeVersion, setActiveVersion] = useState<"A" | "B">("A");
  const panRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const wood = materialStops[material];
  const values = Object.fromEntries(dimensions.map((dimension) => [dimension.key, dimension.value])) as Record<string, number>;
  const length = values.length || 60;
  const depth = values.width || values.depth || 24;
  const height = values.height || values.seatHeight || 30;
  const visualWidth = clamp(length * (projectKind === "table" ? 4.2 : 5), 230, 560);
  const visualDepth = clamp(depth * (projectKind === "table" ? 2.5 : 4), 70, 160);
  const visualHeight = clamp(height * (projectKind === "table" ? 6 : 8), 105, 235);
  const x = 340 - visualWidth / 2;
  const y = 120;
  const metrics: InspectorMetric[] = [
    ...dimensions.map((dimension) => ({ label: dimension.label, value: `${dimension.value || "—"} in` })),
    { label: "Estimated cost", value: money(shoppingList?.estimatedCostRangeCents) },
    { label: "Build time", value: buildTime },
    { label: "Lumber", value: `${shoppingList?.lumber.reduce((sum, item) => sum + item.quantity, 0) ?? 0} boards/posts` },
    { label: "Waste", value: shoppingList ? `${shoppingList.estimatedWastePercent}%` : "—" },
    { label: "Difficulty", value: difficulty },
    { label: "Plan", value: plan ? "Verified" : "Needs input" },
  ];
  const notes = styleNotes[style] ?? styleNotes.modern;
  const current = useMemo(() => ({ id: activeVersion, dimensions: values, cost: money(shoppingList?.estimatedCostRangeCents), lumber: shoppingList?.lumber.reduce((sum, item) => sum + item.quantity, 0) ?? 0, shopping: shoppingList ? [...shoppingList.lumber.map((item) => `${item.quantity}× ${item.name}`), ...shoppingList.hardware.map((item) => `${item.quantity}× ${item.name}`)] : [] }), [activeVersion, values, shoppingList]);

  function saveVersion(slot: "A" | "B") { setVersions((previous) => ({ ...previous, [slot]: { ...current, id: slot } })); }
  function resizeFromPointer(event: React.PointerEvent, dimension: StudioDimension) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag(dimension);
  }
  function moveResize(event: React.PointerEvent) {
    if (!drag) return;
    const delta = drag.key === "height" || drag.key === "seatHeight" ? -event.movementY : event.movementX;
    drag.onChange(String(Math.round(clamp(drag.value + delta / 4, drag.min, drag.max))));
  }
  function resetCamera() { setZoom(1); setPan({ x: 0, y: 0 }); }

  return <section className="studio-shell print-hide mt-10 overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[#fffdfa] shadow-[var(--shadow-lg)]">
    <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="relative min-h-[34rem] overflow-hidden">
        <div className="absolute left-5 top-5 z-10 flex flex-wrap gap-2"><button className={`studio-pill ${mode === "lifestyle" ? "studio-pill-active" : ""}`} onClick={() => setMode("lifestyle")}>Lifestyle</button><button className={`studio-pill ${mode === "blueprint" ? "studio-pill-active" : ""}`} onClick={() => setMode("blueprint")}>Blueprint</button><button className="studio-pill" onClick={resetCamera}>Reset camera</button></div>
        <div className="absolute right-5 top-5 z-10 flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-2 text-xs font-bold shadow-sm backdrop-blur"><button onClick={() => setZoom((value) => clamp(value - .1, .75, 1.6))}>−</button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((value) => clamp(value + .1, .75, 1.6))}>+</button></div>
        <div className={`${mode === "blueprint" ? "blueprint-grid" : "studio-lifestyle"} h-full min-h-[34rem] cursor-grab overflow-hidden`} onPointerDown={(event) => { if ((event.target as HTMLElement).dataset.handle) return; panRef.current = { ...pan, startX: event.clientX, startY: event.clientY }; }} onPointerMove={(event) => { moveResize(event); if (panRef.current && !drag) setPan({ x: panRef.current.x + event.clientX - panRef.current.startX, y: panRef.current.y + event.clientY - panRef.current.startY }); }} onPointerUp={() => { setDrag(null); panRef.current = null; }}>
          <svg viewBox="0 0 680 470" className="h-full w-full transition-transform duration-300 ease-out" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }} role="img" aria-label={`${getMaterialLabel(material)} ${projectKind} design preview`}>
            <defs><linearGradient id="woodFace" x1="0" x2="1"><stop stopColor={wood.light}/><stop offset=".45" stopColor={wood.base}/><stop offset="1" stopColor={wood.dark}/></linearGradient><pattern id="grain" width="90" height="18" patternUnits="userSpaceOnUse"><path d="M0 8 C18 1 32 16 50 7 S78 5 90 11" fill="none" stroke={wood.dark} strokeOpacity=".22"/><path d="M0 14 C18 9 36 17 56 12 S80 12 90 15" fill="none" stroke="#fff" strokeOpacity=".18"/></pattern></defs>
            {mode === "lifestyle" && <><circle cx="570" cy="75" r="46" fill="#f4d99a" opacity=".45"/><line x1="45" y1="388" x2="635" y2="388" stroke="#c8b69b" strokeWidth="2"/></>}
            <g className="transition-all duration-500 ease-out">
              {projectKind === "table" ? <><polygon points={`${x},${y + visualDepth} ${x + 88},${y} ${x + visualWidth},${y} ${x + visualWidth - 88},${y + visualDepth}`} fill="url(#woodFace)" stroke={mode === "blueprint" ? "#f6efd7" : wood.dark} strokeWidth="3"/><polygon points={`${x},${y + visualDepth} ${x + visualWidth - 88},${y + visualDepth} ${x + visualWidth - 88},${y + visualDepth + 18} ${x + 10},${y + visualDepth + 18}`} fill={wood.end}/><rect x={x + 28} y={y + visualDepth + 18} width="22" height={visualHeight} fill="url(#woodFace)"/><rect x={x + visualWidth - 122} y={y + visualDepth + 18} width="22" height={visualHeight} fill="url(#woodFace)"/><rect x={x + 58} y={y + visualDepth + 30} width={visualWidth - 190} height={notes.apron.includes("deep") ? 34 : 22} fill={wood.dark} opacity=".9"/></> : <><rect x={x} y={y + 30} width={visualWidth} height="28" rx="4" fill="url(#woodFace)" stroke={wood.dark} strokeWidth="3"/><rect x={x + 20} y={y + 65} width={visualWidth - 40} height="26" fill={wood.dark} opacity=".88"/><rect x={x + 38} y={y + 87} width="22" height={visualHeight} fill="url(#woodFace)"/><rect x={x + visualWidth - 60} y={y + 87} width="22" height={visualHeight} fill="url(#woodFace)"/>{[.2,.4,.6,.8].map((p)=><line key={p} x1={x + visualWidth*p} y1={y+30} x2={x + visualWidth*p} y2={y+58} stroke={wood.dark} strokeOpacity=".45"/>)}</>}
              <rect x={x} y={y} width={visualWidth} height={visualDepth + 18} fill="url(#grain)" opacity=".75"/>
              <DimensionHandle x={x + visualWidth} y={y + visualDepth / 2} label={`${length}″`} onPointerDown={(e) => resizeFromPointer(e, dimensions[0])}/>
              <DimensionHandle x={x + visualWidth / 2} y={y - 20} label={`${depth}″`} onPointerDown={(e) => resizeFromPointer(e, dimensions[1])}/>
              <DimensionHandle x={x + visualWidth + 38} y={y + visualDepth + visualHeight / 2} label={`${height}″`} onPointerDown={(e) => resizeFromPointer(e, dimensions[2])}/>
            </g>
          </svg>
        </div>
      </div>
      <aside className="border-t border-[var(--color-border)] bg-white/72 p-5 backdrop-blur xl:border-l xl:border-t-0"><button className="flex w-full items-center justify-between text-left" onClick={() => setInspectorOpen((v) => !v)}><span><span className="ds-eyebrow">Design inspector</span><strong className="mt-2 block text-xl">Live specifications</strong></span><span>{inspectorOpen ? "−" : "+"}</span></button>{inspectorOpen && <div className="mt-5 grid grid-cols-2 gap-3">{metrics.map((metric) => <div className="rounded-2xl bg-[var(--color-canvas)] p-3 transition hover:-translate-y-0.5 hover:shadow-sm" key={metric.label}><p className="ds-caption">{metric.label}</p><p className="mt-1 font-semibold">{metric.value}</p></div>)}</div>}<div className="mt-6 rounded-3xl bg-[var(--color-canvas)] p-4"><p className="ds-eyebrow">Preset anatomy</p><div className="mt-3 grid gap-2 text-sm"><span>Leg: {notes.leg}</span><span>Apron: {notes.apron}</span><span>Edge: {notes.edge}</span><span>Slats: {notes.spacing}</span></div></div><div className="mt-6"><p className="ds-eyebrow">Compare versions</p><div className="mt-3 flex gap-2">{(["A", "B"] as const).map((slot) => <button key={slot} onClick={() => { setActiveVersion(slot); saveVersion(slot); }} className={`studio-pill ${activeVersion === slot ? "studio-pill-active" : ""}`}>Save {slot}</button>)}</div>{versions.A && versions.B && <div className="mt-4 space-y-2 text-sm"><p><b>Cost:</b> {versions.A.cost} vs {versions.B.cost}</p><p><b>Lumber:</b> {versions.A.lumber} vs {versions.B.lumber}</p><p><b>Shopping:</b> {versions.A.shopping.slice(0, 2).join(", ")} / {versions.B.shopping.slice(0, 2).join(", ")}</p></div>}</div></aside>
    </div>
  </section>;
}

function DimensionHandle({ x, y, label, onPointerDown }: { x: number; y: number; label: string; onPointerDown: (event: React.PointerEvent<SVGGElement>) => void }) {
  return <g data-handle="true" onPointerDown={onPointerDown} className="cursor-ew-resize"><circle cx={x} cy={y} r="14" fill="#fffaf0" stroke="#58664a" strokeWidth="3"/><text x={x + 20} y={y + 5} fill="#3d372f" fontSize="14" fontWeight="700">{label}</text></g>;
}
