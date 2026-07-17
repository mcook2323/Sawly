"use client";

import { useEffect, useState } from "react";
import { getMaterialLabel, type WoodMaterial } from "@/calculations/materialCatalog";
import { generateShoppingList } from "@/calculations/materials";
import { generateTablePlan, TABLE_DIMENSION_LIMITS } from "@/calculations/table";
import { DimensionConfiguration, type DimensionField } from "@/components/DimensionConfiguration";
import { OutdoorTableGalleryVisual } from "@/components/OutdoorTableGalleryVisual";
import { PlanTabs } from "@/components/PlanTabs";
import { ProjectGallery } from "@/components/ProjectGallery";
import { PremiumDesignStudio } from "@/components/PremiumDesignStudio";
import { ProjectPageShell } from "@/components/ProjectPageShell";
import { ProjectTrustNotice } from "@/components/ProjectTrustNotice";
import { SaveProjectButton } from "@/components/SaveProjectButton";
import { getOutdoorTableBuildSteps } from "@/data/buildSteps";
import { OUTDOOR_TABLE_GALLERY_ITEMS } from "@/data/projectGallery";
import { readSavedProjects } from "@/lib/savedProjects";
import { PROJECT_SNAP_POINTS, seatingCapacity, suggestedLengthForSeating } from "@/lib/designStudio";

function validate(value: string, label: string, min: number, max: number) {
  if (value.trim() === "") return `${label} is required.`;
  const number = Number(value);
  if (!Number.isFinite(number)) return `${label} must be a number.`;
  return number < min || number > max ? `${label} must be ${min}-${max} inches.` : null;
}

export default function OutdoorTablePage() {
  const [lengthInput, setLengthInput] = useState("72");
  const [widthInput, setWidthInput] = useState("36");
  const [heightInput, setHeightInput] = useState("30");
  const [wood, setWood] = useState<WoodMaterial>("pine");
  const [style, setStyle] = useState<"modern" | "farmhouse" | "craftsman" | "rustic">("modern");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("saved");
      const saved = id ? readSavedProjects().find((item) => item.id === id && item.projectType === "outdoor-table") : null;
      if (saved) {
        setLengthInput(String(saved.dimensions.length)); setWidthInput(String(saved.dimensions.width)); setHeightInput(String(saved.dimensions.height)); setWood(saved.material); if (saved.style === "modern" || saved.style === "farmhouse" || saved.style === "craftsman" || saved.style === "rustic") setStyle(saved.style); return;
      }
      const material = params.get("material");
      if (params.get("length")) setLengthInput(params.get("length")!);
      if (params.get("width")) setWidthInput(params.get("width")!);
      if (params.get("height")) setHeightInput(params.get("height")!);
      if (material === "pine" || material === "cedar" || material === "treated") setWood(material);
      const styleParam = params.get("style");
      if (styleParam === "modern" || styleParam === "farmhouse" || styleParam === "craftsman" || styleParam === "rustic") setStyle(styleParam);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const fields: DimensionField[] = [
    { key: "length", label: "Length", value: lengthInput, ...TABLE_DIMENSION_LIMITS.length, error: validate(lengthInput, "Length", TABLE_DIMENSION_LIMITS.length.min, TABLE_DIMENSION_LIMITS.length.max), onChange: setLengthInput, snapPoints: PROJECT_SNAP_POINTS["outdoor-table"] },
    { key: "width", label: "Width", value: widthInput, ...TABLE_DIMENSION_LIMITS.width, error: validate(widthInput, "Width", TABLE_DIMENSION_LIMITS.width.min, TABLE_DIMENSION_LIMITS.width.max), onChange: setWidthInput },
    { key: "height", label: "Height", value: heightInput, ...TABLE_DIMENSION_LIMITS.height, error: validate(heightInput, "Height", TABLE_DIMENSION_LIMITS.height.min, TABLE_DIMENSION_LIMITS.height.max), onChange: setHeightInput },
  ];
  const valid = fields.every((field) => !field.error);
  const dimensions = { length: Number(lengthInput) || 0, width: Number(widthInput) || 0, height: Number(heightInput) || 0 };
  const plan = valid ? generateTablePlan({ ...dimensions, wood, style }) : null;
  const shoppingList = plan ? generateShoppingList(plan.cutList, plan.hardware) : null;
  const buildSteps = plan ? getOutdoorTableBuildSteps(plan) : [];
  const seats = seatingCapacity("outdoor-table", dimensions.length);
  const lumberCount = shoppingList?.lumber.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const seatingPresets = [4, 6, 8, 10].map((count) => ({ seats: count, length: suggestedLengthForSeating("outdoor-table", count, TABLE_DIMENSION_LIMITS.length.min, TABLE_DIMENSION_LIMITS.length.max) }));

  return (
    <ProjectPageShell
      projectName="Modern Outdoor Table"
      materialLabel={getMaterialLabel(wood)}
      estimatedCostRange={shoppingList?.estimatedCostRangeCents ?? null}
      isReady={Boolean(plan)}
      summaryDetails={[{ label: "Build time", value: "6–8 hours" }, { label: "Difficulty", value: "Intermediate" }, { label: "Seats", value: `${seats} people` }, { label: "Lumber", value: plan ? `${lumberCount} pieces` : "—" }]}
      headerAction={<SaveProjectButton projectType="outdoor-table" projectName="Modern Outdoor Table" dimensions={dimensions} material={wood} style={style} disabled={!valid} />}
      gallery={<ProjectGallery items={OUTDOOR_TABLE_GALLERY_ITEMS} ariaLabel="Outdoor Table views" renderItem={(item, thumbnail) => <OutdoorTableGalleryVisual view={item.view} {...dimensions} wood={wood} thumbnail={thumbnail} />} />}
      configuration={<DimensionConfiguration fields={fields} material={wood} onMaterialChange={setWood} style={style} styleOptions={[{ value: "modern", label: "Modern" }, { value: "farmhouse", label: "Farmhouse" }, { value: "craftsman", label: "Craftsman" }, { value: "rustic", label: "Rustic" }]} onStyleChange={(value) => setStyle(value as typeof style)} seatingPresets={seatingPresets} onApplySeating={(value) => setLengthInput(String(value))} />}
    >
      <PremiumDesignStudio project="table" dimensions={[{ key: "length", label: "Length", value: dimensions.length, ...TABLE_DIMENSION_LIMITS.length, onChange: setLengthInput }, { key: "width", label: "Width", value: dimensions.width, ...TABLE_DIMENSION_LIMITS.width, onChange: setWidthInput }, { key: "height", label: "Height", value: dimensions.height, ...TABLE_DIMENSION_LIMITS.height, onChange: setHeightInput }]} material={wood} style={style} styleOptions={[{ value: "modern", label: "Modern" }, { value: "farmhouse", label: "Farmhouse" }, { value: "craftsman", label: "Craftsman" }, { value: "rustic", label: "Rustic" }]} onStyleChange={(value) => setStyle(value as typeof style)} />
      {plan && shoppingList ? (
        <>
          <div className="print-hide mt-8"><ProjectTrustNotice /></div>
          <PlanTabs plan={plan} shoppingList={shoppingList} buildSteps={buildSteps} />
        </>
      ) : (
        <div className="print-hide mt-6 rounded-xl border border-[#d8a69b] bg-[#f8eae5] p-5 text-[#87493d]">Correct the highlighted dimensions to generate the plan.</div>
      )}
    </ProjectPageShell>
  );
}
