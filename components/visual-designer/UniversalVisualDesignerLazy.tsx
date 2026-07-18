"use client";
import dynamic from "next/dynamic";
import type { UniversalWoodProject } from "@/types/universalProject";

const LazyDesigner = dynamic(() => import("./UniversalVisualDesigner").then((module) => module.UniversalVisualDesigner), { ssr: false, loading: () => <div className="grid min-h-[36rem] place-items-center rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)]"><div className="text-center"><div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-[var(--color-brand-soft)]" /><p className="ds-body mt-4">Loading the visual designer…</p></div></div> });

export function UniversalVisualDesignerLazy(props: { project: UniversalWoodProject; onProjectChange?: (project: UniversalWoodProject) => void }) { return <LazyDesigner {...props} />; }
