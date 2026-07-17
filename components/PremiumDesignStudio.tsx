"use client";

import { useState, type PointerEvent } from "react";
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
  const swatch = MATERIALS[material];
  const primary = dimensions[0];
  const secondary = dimensions[1];
  const tertiary = dimensions[2];
  const comparisonDelta = Math.max(2, Math.round(primary.value * 0.08));
  const versionB = clamp(primary.value + comparisonDelta, primary.min, primary.max);

  function dragDimension(event: PointerEvent<HTMLButtonElement>, dimension: StudioDimension) {
    const startX = event.clientX;
    const startValue = dimension.value;
    event.currentTarget.setPointerCapture(event.pointerId);
    const move = (moveEvent: globalThis.PointerEvent) => {
      const next = clamp(startValue + (moveEvent.clientX - startX) / 3, dimension.min, dimension.max);
      dimension.onChange(String(next));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
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
                <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition ${mode === item ? "bg-[#29372b] text-white" : "border border-[#d8c9b8] bg-white text-[#55483d] hover:border-[#58664a]"}`}>{item}</button>
              ))}
            </div>
          </div>

          <div className={`relative min-h-[28rem] overflow-hidden rounded-[1.5rem] border border-[#d8c9b8] ${mode === "blueprint" ? "blueprint-grid" : "premium-lifestyle"}`}>
            <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2 rounded-full bg-white/85 p-2 shadow-sm backdrop-blur">
              <button type="button" onClick={() => setZoom((value) => Math.min(1.6, Number((value + 0.1).toFixed(1))))} className="studio-tool">Zoom +</button>
              <button type="button" onClick={() => setZoom((value) => Math.max(0.7, Number((value - 0.1).toFixed(1))))} className="studio-tool">Zoom -</button>
              <button type="button" onClick={() => setPan((value) => ({ x: value.x - 16, y: value.y }))} className="studio-tool">Pan</button>
              <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="studio-tool">Reset</button>
            </div>
            <svg viewBox="0 0 760 420" role="img" aria-label={`${displayStyle(styleOptions, style)} ${project} preview`} className="h-full min-h-[28rem] w-full" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "center", transition: "transform 180ms ease" }}>
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
              <g filter="url(#studio-shadow)">
                {project === "table" ? <TableSvg fill={`url(#grain-${material})`} styleName={style} /> : <BenchSvg fill={`url(#grain-${material})`} styleName={style} />}
              </g>
              <DimensionGuide x1={138} y1={350} x2={622} y2={350} label={`${primary.label}: ${primary.value}″`} />
              <DimensionGuide x1={640} y1={160} x2={640} y2={310} label={`${tertiary.label}: ${tertiary.value}″`} vertical />
              <DimensionGuide x1={205} y1={118} x2={330} y2={118} label={`${secondary.label}: ${secondary.value}″`} />
            </svg>
            <div className="absolute bottom-4 left-4 right-4 grid gap-3 md:grid-cols-3">
              {dimensions.map((dimension) => (
                <div key={dimension.key} className="rounded-2xl border border-white/70 bg-white/88 p-3 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between gap-3"><label htmlFor={`premium-${dimension.key}`} className="text-xs font-black uppercase tracking-[0.18em] text-[#80634e]">{dimension.label}</label><button type="button" onPointerDown={(event) => dragDimension(event, dimension)} className="cursor-ew-resize rounded-full bg-[#58664a] px-3 py-1 text-xs font-bold text-white">Drag ↔</button></div>
                  <input id={`premium-${dimension.key}`} type="number" min={dimension.min} max={dimension.max} value={dimension.value || ""} onChange={(event) => dimension.onChange(event.target.value)} className="ds-input mt-2 h-11 min-h-0 py-2 font-bold" />
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
            <InspectorRow label="Zoom" value={`${Math.round(zoom * 100)}%`} />
            <div className="rounded-2xl border border-[#dfd0bf] bg-white p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#80634e]">A/B comparison</p><div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-[#f4eadc] p-3"><strong>{versionALabel}</strong><p>{primary.value}″ {primary.label.toLowerCase()}</p></div><div className="rounded-xl bg-[#e7edde] p-3"><strong>{versionBLabel}</strong><p>{versionB}″ {primary.label.toLowerCase()}</p></div></div></div>
            <div className="rounded-2xl border border-[#dfd0bf] bg-white p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#80634e]">Style rule</p><p className="mt-2 text-sm text-[#66584c]">{styleRule(project, style)}</p></div>
          </div>}
        </aside>
      </div>
    </section>
  );
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between rounded-2xl border border-[#dfd0bf] bg-white px-4 py-3 text-sm"><span className="font-bold text-[#80634e]">{label}</span><span className="capitalize text-[#2f2924]">{value}</span></div>;
}

function DimensionGuide({ x1, y1, x2, y2, label, vertical = false }: { x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean }) {
  return <g opacity="0.9"><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f7fbff" strokeWidth="2" strokeDasharray="6 6" /><circle cx={x1} cy={y1} r="5" fill="#f7fbff" /><circle cx={x2} cy={y2} r="5" fill="#f7fbff" /><text x={vertical ? x1 + 14 : (x1 + x2) / 2} y={vertical ? (y1 + y2) / 2 : y1 - 12} textAnchor={vertical ? "start" : "middle"} fill="#f7fbff" fontSize="15" fontWeight="800">{label}</text></g>;
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
