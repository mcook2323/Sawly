"use client";

import { useRef, useState, type PointerEvent, type TouchEvent } from "react";
import type { WoodMaterial } from "@/calculations/materialCatalog";
import { getMaterialLabel } from "@/calculations/materialCatalog";

type ProjectKind = "table" | "bench";
type Mode = "lifestyle" | "blueprint";

export interface StudioDimension {
  key: string;
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: string) => void;
}

interface PremiumDesignStudioProps {
  project: ProjectKind;
  dimensions: StudioDimension[];
  material: WoodMaterial;
  style: string;
  styleOptions: Array<{ value: string; label: string }>;
  onStyleChange: (style: string) => void;
  versionALabel?: string;
  versionBLabel?: string;
}

const MATERIALS: Record<WoodMaterial, { base: string; dark: string; light: string; grain: string }> = {
  pine: { base: "#d8b574", dark: "#8f6731", light: "#f2d69d", grain: "#b98643" },
  cedar: { base: "#b96f45", dark: "#70402c", light: "#e39a66", grain: "#8e4f34" },
  treated: { base: "#8fa06f", dark: "#556143", light: "#bbc69b", grain: "#6e7958" },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function displayStyle(styleOptions: PremiumDesignStudioProps["styleOptions"], style: string) {
  return styleOptions.find((option) => option.value === style)?.label ?? style;
}

export function PremiumDesignStudio({ project, dimensions, material, style, styleOptions, onStyleChange, versionALabel = "Version A", versionBLabel = "Version B" }: PremiumDesignStudioProps) {
  const [mode, setMode] = useState<Mode>("lifestyle");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [dimensionsVisible, setDimensionsVisible] = useState(false);
  const [dimensionsManuallySet, setDimensionsManuallySet] = useState(false);
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null);
  const swatch = MATERIALS[material];
  const primary = dimensions[0];
  const secondary = dimensions[1];
  const tertiary = dimensions[2];
  const comparisonDelta = Math.max(2, Math.round(primary.value * 0.08));
  const versionB = clamp(primary.value + comparisonDelta, primary.min, primary.max);

  function selectMode(nextMode: Mode) {
    setMode(nextMode);
    if (!dimensionsManuallySet) setDimensionsVisible(nextMode === "blueprint");
  }

  function toggleDimensions() {
    setDimensionsManuallySet(true);
    setDimensionsVisible((visible) => !visible);
  }

  function dragDimension(event: PointerEvent<SVGCircleElement>, dimension: StudioDimension, axis: "x" | "y") {
    event.stopPropagation();
    const start = axis === "x" ? event.clientX : event.clientY;
    const startValue = dimension.value;
    event.currentTarget.setPointerCapture(event.pointerId);
    const move = (moveEvent: globalThis.PointerEvent) => {
      const nextPointer = axis === "x" ? moveEvent.clientX : start - (moveEvent.clientY - start);
      const delta = axis === "x" ? moveEvent.clientX - start : nextPointer - start;
      const next = clamp(startValue + delta / 3, dimension.min, dimension.max);
      dimension.onChange(String(next));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function startPan(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    const startX = event.clientX;
    const startY = event.clientY;
    const startPanValue = pan;
    event.currentTarget.setPointerCapture(event.pointerId);
    const move = (moveEvent: globalThis.PointerEvent) => {
      setPan({ x: startPanValue.x + moveEvent.clientX - startX, y: startPanValue.y + moveEvent.clientY - startY });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function zoomBy(delta: number) {
    setZoom((value) => Math.min(1.8, Math.max(0.65, Number((value + delta).toFixed(2)))));
  }

  function touchDistance(event: TouchEvent<HTMLDivElement>) {
    const first = event.touches.item(0);
    const second = event.touches.item(1);
    if (!first || !second) return null;
    return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
  }

  function startTouchZoom(event: TouchEvent<HTMLDivElement>) {
    const distance = touchDistance(event);
    pinchStart.current = distance ? { distance, zoom } : null;
  }

  function moveTouchZoom(event: TouchEvent<HTMLDivElement>) {
    if (!pinchStart.current || event.touches.length < 2) return;
    event.preventDefault();
    const distance = touchDistance(event);
    if (!distance) return;
    setZoom(Math.min(1.8, Math.max(0.65, Number((pinchStart.current.zoom * (distance / pinchStart.current.distance)).toFixed(2)))));
  }

  return (
    <section className="premium-studio print-hide mt-8 overflow-hidden rounded-[2rem] border border-[#d8c9b8] bg-[#fffdfa] shadow-[0_28px_90px_rgba(58,43,30,0.14)]">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="ds-eyebrow">Premium design studio</p>
              <h2 className="ds-subheading mt-2">Drag, compare, and refine live</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["lifestyle", "blueprint"] as const).map((item) => (
                <button key={item} type="button" onClick={() => selectMode(item)} className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition ${mode === item ? "bg-[#29372b] text-white" : "border border-[#d8c9b8] bg-white text-[#55483d] hover:border-[#58664a]"}`}>{item}</button>
              ))}
              <button type="button" onClick={toggleDimensions} className={`rounded-full px-4 py-2 text-sm font-bold transition ${dimensionsVisible ? "bg-[#58664a] text-white" : "border border-[#d8c9b8] bg-white text-[#55483d] hover:border-[#58664a]"}`}>Dimensions</button>
            </div>
          </div>

          <div onPointerDown={startPan} onTouchStart={startTouchZoom} onTouchMove={moveTouchZoom} onTouchEnd={() => { pinchStart.current = null; }} onWheel={(event) => { event.preventDefault(); zoomBy(event.deltaY > 0 ? -0.08 : 0.08); }} className={`relative min-h-[30rem] touch-none cursor-grab overflow-hidden rounded-[1.5rem] border border-[#d8c9b8] active:cursor-grabbing ${mode === "blueprint" ? "blueprint-grid" : "premium-lifestyle"}`}>
            <div onPointerDown={(event) => event.stopPropagation()} className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2 rounded-2xl bg-white/88 p-2 shadow-sm backdrop-blur sm:left-4 sm:top-4 sm:rounded-full">
              <button type="button" onClick={() => zoomBy(0.1)} className="studio-tool">Zoom +</button>
              <button type="button" onClick={() => zoomBy(-0.1)} className="studio-tool">Zoom -</button>
              <button type="button" onClick={() => setPan((value) => ({ x: value.x - 16, y: value.y }))} className="studio-tool">Pan</button>
              <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="studio-tool">Reset</button>
            </div>
            <svg viewBox="0 0 860 540" role="img" aria-label={`${displayStyle(styleOptions, style)} ${project} preview`} className="h-full min-h-[30rem] w-full select-none">
              <defs>
                <linearGradient id={`wood-${material}`} x1="0" x2="1">
                  <stop offset="0%" stopColor={swatch.dark} />
                  <stop offset="38%" stopColor={swatch.base} />
                  <stop offset="68%" stopColor={swatch.light} />
                  <stop offset="100%" stopColor={swatch.dark} />
                </linearGradient>
                <pattern id={`grain-${material}`} width="46" height="16" patternUnits="userSpaceOnUse">
                  <rect width="46" height="16" fill={`url(#wood-${material})`} />
                  <path d="M1 6 C12 1 20 13 34 5 S45 8 50 3 M0 13 C10 10 20 18 35 12" stroke={swatch.grain} strokeWidth="1.1" fill="none" opacity="0.48" />
                </pattern>
                <filter id="studio-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="20" stdDeviation="16" floodOpacity="0.24" /></filter>
              </defs>
              <g style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "430px 280px", transition: "transform 120ms ease" }}>
                <g filter="url(#studio-shadow)">
                  {project === "table" ? <TableSvg fill={`url(#grain-${material})`} styleName={style} /> : <BenchSvg fill={`url(#grain-${material})`} styleName={style} />}
                </g>
                {dimensionsVisible && <DimensionAnnotations primary={primary} secondary={secondary} tertiary={tertiary} onDrag={dragDimension} />}
              </g>
            </svg>
            <div className="pointer-events-none absolute bottom-3 left-3 right-3 grid gap-2 sm:bottom-4 sm:left-4 sm:right-4 md:grid-cols-3">
              {dimensions.map((dimension) => (
                <div key={dimension.key} onPointerDown={(event) => event.stopPropagation()} className="pointer-events-auto rounded-2xl border border-white/70 bg-white/90 p-2 shadow-sm backdrop-blur sm:p-3">
                  <label htmlFor={`premium-${dimension.key}`} className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-[#80634e] sm:text-xs">{dimension.label}</label>
                  <input id={`premium-${dimension.key}`} type="number" min={dimension.min} max={dimension.max} value={dimension.value || ""} onChange={(event) => dimension.onChange(event.target.value)} className="ds-input mt-1 h-10 min-h-0 py-2 text-sm font-bold sm:h-11" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="border-t border-[#e5d8c8] bg-[#f7f0e6] p-5 xl:border-l xl:border-t-0">
          <button type="button" onClick={() => setInspectorOpen((open) => !open)} className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left font-bold shadow-sm"><span>Live design inspector</span><span>{inspectorOpen ? "−" : "+"}</span></button>
          {inspectorOpen && <div className="mt-4 space-y-4">
            <label className="block text-sm font-bold">Style<select value={style} onChange={(event) => onStyleChange(event.target.value)} className="ds-input mt-2">{styleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <InspectorRow label="Material" value={getMaterialLabel(material)} />
            <InspectorRow label="Mode" value={mode} />
            <InspectorRow label="Dimensions" value={dimensionsVisible ? "shown" : "hidden"} />
            <InspectorRow label="Zoom" value={`${Math.round(zoom * 100)}%`} />
            <div className="rounded-2xl border border-[#dfd0bf] bg-white p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#80634e]">A/B comparison</p><div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-[#f4eadc] p-3"><strong>{versionALabel}</strong><p>{primary.value}″ {primary.label.toLowerCase()}</p></div><div className="rounded-xl bg-[#e7edde] p-3"><strong>{versionBLabel}</strong><p>{versionB}″ {primary.label.toLowerCase()}</p></div></div></div>
            <div className="rounded-2xl border border-[#dfd0bf] bg-white p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#80634e]">Style rule</p><p className="mt-2 text-sm text-[#66584c]">{styleRule(project, style)}</p></div>
          </div>}
        </aside>
      </div>
    </section>
  );
}

function DimensionAnnotations({ primary, secondary, tertiary, onDrag }: { primary: StudioDimension; secondary: StudioDimension; tertiary: StudioDimension; onDrag: (event: PointerEvent<SVGCircleElement>, dimension: StudioDimension, axis: "x" | "y") => void }) {
  return (
    <g className="studio-dimensions">
      <DimensionGuide x1={140} y1={430} x2={720} y2={430} label={`${primary.label}: ${primary.value}″`} labelX={430} labelY={456} />
      <DimensionGuide x1={96} y1={120} x2={96} y2={364} label={`${tertiary.label}: ${tertiary.value}″`} labelX={118} labelY={242} vertical />
      <DimensionGuide x1={612} y1={88} x2={742} y2={88} label={`${secondary.label}: ${secondary.value}″`} labelX={677} labelY={66} />
      <DimensionHandle x={140} y={430} dimension={primary} axis="x" onDrag={onDrag} />
      <DimensionHandle x={720} y={430} dimension={primary} axis="x" onDrag={onDrag} />
      <DimensionHandle x={96} y={120} dimension={tertiary} axis="y" onDrag={onDrag} />
      <DimensionHandle x={96} y={364} dimension={tertiary} axis="y" onDrag={onDrag} />
      <DimensionHandle x={612} y={88} dimension={secondary} axis="x" onDrag={onDrag} />
      <DimensionHandle x={742} y={88} dimension={secondary} axis="x" onDrag={onDrag} />
    </g>
  );
}

function DimensionHandle({ x, y, dimension, axis, onDrag }: { x: number; y: number; dimension: StudioDimension; axis: "x" | "y"; onDrag: (event: PointerEvent<SVGCircleElement>, dimension: StudioDimension, axis: "x" | "y") => void }) {
  return <g className="studio-dimension-handle"><circle cx={x} cy={y} r="22" fill="transparent" onPointerDown={(event) => onDrag(event, dimension, axis)} /><circle cx={x} cy={y} r="6" fill="#f7fbff" stroke="#58664a" strokeWidth="3" pointerEvents="none" /></g>;
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between rounded-2xl border border-[#dfd0bf] bg-white px-4 py-3 text-sm"><span className="font-bold text-[#80634e]">{label}</span><span className="capitalize text-[#2f2924]">{value}</span></div>;
}

function DimensionGuide({ x1, y1, x2, y2, label, labelX, labelY, vertical = false }: { x1: number; y1: number; x2: number; y2: number; label: string; labelX: number; labelY: number; vertical?: boolean }) {
  const width = Math.max(80, label.length * 7.5);
  return <g className="studio-dimension-guide" opacity="0.92" pointerEvents="none"><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f7fbff" strokeWidth="2" strokeDasharray="6 6" /><line x1={x1} y1={vertical ? y1 - 14 : y1 - 14} x2={x1} y2={vertical ? y1 + 14 : y1 + 14} stroke="#f7fbff" strokeWidth="2" /><line x1={x2} y1={vertical ? y2 - 14 : y2 - 14} x2={x2} y2={vertical ? y2 + 14 : y2 + 14} stroke="#f7fbff" strokeWidth="2" /><rect x={labelX - width / 2} y={labelY - 15} width={width} height="24" rx="8" fill="rgba(41,55,43,0.86)" stroke="rgba(255,255,255,0.55)" /><text x={labelX} y={labelY + 1} textAnchor="middle" fill="#f7fbff" fontSize="13" fontWeight="800">{label}</text></g>;
}

function TableSvg({ fill, styleName }: { fill: string; styleName: string }) {
  const rustic = styleName === "rustic";
  const farmhouse = styleName === "farmhouse";
  const craftsman = styleName === "craftsman";
  return <g><ellipse cx="380" cy="326" rx="260" ry="38" fill="#000" opacity="0.12" /><rect x="142" y="130" width="476" height="54" rx={rustic ? 4 : 16} fill={fill} /><rect x="168" y="184" width="424" height="36" rx="8" fill={fill} opacity="0.92" />{[190, 548].map((x) => <rect key={x} x={x} y="188" width={craftsman ? 42 : 30} height="132" rx={farmhouse ? 2 : 8} fill={fill} />)}{farmhouse && <path d="M210 302 L548 190 M548 302 L210 190" stroke="#5e3d27" strokeWidth="12" opacity="0.7" />}{craftsman && <path d="M180 230 H580 M180 270 H580" stroke="#5e3d27" strokeWidth="10" opacity="0.55" />}{rustic && <path d="M150 144 C220 132 270 153 330 140 S470 130 610 148" stroke="#4e3324" strokeWidth="5" fill="none" opacity="0.5" />}</g>;
}

function BenchSvg({ fill, styleName }: { fill: string; styleName: string }) {
  const park = styleName === "park";
  const farmhouse = styleName === "farmhouse";
  const minimal = styleName === "minimal";
  return <g><ellipse cx="380" cy="330" rx="245" ry="34" fill="#000" opacity="0.12" />{[0, 1, 2, 3].map((i) => <rect key={i} x="160" y={136 + i * (park ? 26 : 22)} width="440" height={park ? 15 : 18} rx="8" fill={fill} />)}<rect x="190" y="230" width="380" height="30" rx="8" fill={fill} opacity="0.92" /><rect x="210" y="250" width="34" height="76" rx={minimal ? 12 : 5} fill={fill} /><rect x="516" y="250" width="34" height="76" rx={minimal ? 12 : 5} fill={fill} />{park && [232, 528].map((x) => <circle key={x} cx={x} cy="210" r="9" fill="#27313a" />)}{farmhouse && <path d="M220 316 L540 246 M540 316 L220 246" stroke="#5e3d27" strokeWidth="10" opacity="0.62" />}</g>;
}

function styleRule(project: ProjectKind, style: string) {
  if (project === "bench" && style === "park") return "Park styling uses tighter back slat spacing and visible carriage-bolt hardware cues.";
  if (project === "bench") return "Bench styling adjusts slat spacing visually while preserving the verified cut math.";
  if (style === "craftsman") return "Craftsman styling adds rail emphasis and wider visual legs without changing deterministic cuts.";
  if (style === "rustic") return "Rustic styling shows irregular live-edge character while keeping square, buildable stock.";
  return "Table style changes visual proportion guidance while preserving verified structural calculations.";
}
