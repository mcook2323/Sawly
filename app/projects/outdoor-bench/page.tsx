"use client";

import { useEffect, useState } from "react";
import { BENCH_DIMENSION_LIMITS, generateBenchPlan } from "@/calculations/bench";
import { getMaterialLabel, type WoodMaterial } from "@/calculations/materialCatalog";
import { generateShoppingList } from "@/calculations/materials";
import { DimensionConfiguration, type DimensionField } from "@/components/DimensionConfiguration";
import { OutdoorBenchGalleryVisual } from "@/components/OutdoorBenchGalleryVisual";
import { PlanTabs } from "@/components/PlanTabs";
import { ProjectGallery } from "@/components/ProjectGallery";
import { ProjectPageShell } from "@/components/ProjectPageShell";
import { ProjectTrustNotice } from "@/components/ProjectTrustNotice";
import { SaveProjectButton } from "@/components/SaveProjectButton";
import { getOutdoorBenchBuildSteps } from "@/data/buildSteps";
import { OUTDOOR_BENCH_GALLERY_ITEMS } from "@/data/projectGallery";
import { readSavedProjects } from "@/lib/savedProjects";

function error(value: string, label: string, min: number, max: number) {
  if (!value.trim()) return `${label} is required.`;
  const number = Number(value);
  if (!Number.isFinite(number)) return `${label} must be a number.`;
  return number < min || number > max ? `${label} must be ${min}-${max} inches.` : null;
}

export default function OutdoorBenchPage() {
  const [length, setLength] = useState("60");
  const [depth, setDepth] = useState("18");
  const [seatHeight, setSeatHeight] = useState("18");
  const [wood, setWood] = useState<WoodMaterial>("pine");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("saved");
      const saved = id ? readSavedProjects().find((item) => item.id === id && item.projectType === "outdoor-bench") : null;
      if (saved) { setLength(String(saved.dimensions.length)); setDepth(String(saved.dimensions.depth)); setSeatHeight(String(saved.dimensions.seatHeight)); setWood(saved.material); return; }
      const material = params.get("material");
      if (params.get("length")) setLength(params.get("length")!);
      if (params.get("depth")) setDepth(params.get("depth")!);
      if (params.get("seatHeight")) setSeatHeight(params.get("seatHeight")!);
      if (material === "pine" || material === "cedar" || material === "treated") setWood(material);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const fields: DimensionField[] = [
    { key: "length", label: "Length", value: length, ...BENCH_DIMENSION_LIMITS.length, error: error(length, "Length", 36, 96), onChange: setLength },
    { key: "depth", label: "Depth", value: depth, ...BENCH_DIMENSION_LIMITS.depth, error: error(depth, "Depth", 16, 24), onChange: setDepth },
    { key: "seatHeight", label: "Seat height", value: seatHeight, ...BENCH_DIMENSION_LIMITS.seatHeight, error: error(seatHeight, "Seat height", 16, 20), onChange: setSeatHeight },
  ];
  const valid = fields.every((field) => !field.error);
  const dimensions = { length: Number(length) || 0, depth: Number(depth) || 0, seatHeight: Number(seatHeight) || 0 };
  const plan = valid ? generateBenchPlan({ ...dimensions, wood }) : null;
  const shopping = plan ? generateShoppingList(plan.cutList, plan.hardware) : null;
  const steps = plan ? getOutdoorBenchBuildSteps(plan) : [];
  return (
    <ProjectPageShell projectName="Modern Outdoor Bench" materialLabel={getMaterialLabel(wood)} estimatedCostRange={shopping?.estimatedCostRangeCents ?? null} isReady={Boolean(plan)} summaryDetails={[{ label: "Build time", value: "4–6 hours" }, { label: "Difficulty", value: "Beginner" }, { label: "Seats", value: dimensions.length >= 72 ? "3 people" : "2 people" }, { label: "Skill level", value: "Beginner" }]} headerAction={<SaveProjectButton projectType="outdoor-bench" projectName="Modern Outdoor Bench" dimensions={dimensions} material={wood} disabled={!valid} />} gallery={<ProjectGallery items={OUTDOOR_BENCH_GALLERY_ITEMS} ariaLabel="Outdoor Bench views" renderItem={(item, thumbnail) => <OutdoorBenchGalleryVisual view={item.view} {...dimensions} wood={wood} thumbnail={thumbnail} />} />} configuration={<DimensionConfiguration fields={fields} material={wood} onMaterialChange={setWood} />}>
      {plan && shopping ? <><div className="print-hide mt-8"><ProjectTrustNotice /></div><PlanTabs plan={plan} shoppingList={shopping} buildSteps={steps} /></> : <div className="print-hide mt-6 rounded-xl border border-[#d8a69b] bg-[#f8eae5] p-5">Correct the highlighted dimensions to generate the bench plan.</div>}
    </ProjectPageShell>
  );
}
