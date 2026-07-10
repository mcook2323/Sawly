"use client";

import { useEffect, useState } from "react";
import { getMaterialLabel, type WoodMaterial } from "@/calculations/materialCatalog";
import { generateShoppingList } from "@/calculations/materials";
import { generateTablePlan, TABLE_DIMENSION_LIMITS } from "@/calculations/table";
import { DimensionConfiguration, type DimensionField } from "@/components/DimensionConfiguration";
import { OutdoorTableGalleryVisual } from "@/components/OutdoorTableGalleryVisual";
import { PlanTabs } from "@/components/PlanTabs";
import { ProjectGallery } from "@/components/ProjectGallery";
import { ProjectPageShell } from "@/components/ProjectPageShell";
import { ProjectTrustNotice } from "@/components/ProjectTrustNotice";
import { SaveProjectButton } from "@/components/SaveProjectButton";
import { getOutdoorTableBuildSteps } from "@/data/buildSteps";
import { OUTDOOR_TABLE_GALLERY_ITEMS } from "@/data/projectGallery";
import { readSavedProjects } from "@/lib/savedProjects";

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const id = new URLSearchParams(window.location.search).get("saved");
      const saved = id ? readSavedProjects().find((item) => item.id === id && item.projectType === "outdoor-table") : null;
      if (!saved) return;
      setLengthInput(String(saved.dimensions.length));
      setWidthInput(String(saved.dimensions.width));
      setHeightInput(String(saved.dimensions.height));
      setWood(saved.material);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const fields: DimensionField[] = [
    { key: "length", label: "Length", value: lengthInput, ...TABLE_DIMENSION_LIMITS.length, error: validate(lengthInput, "Length", TABLE_DIMENSION_LIMITS.length.min, TABLE_DIMENSION_LIMITS.length.max), onChange: setLengthInput },
    { key: "width", label: "Width", value: widthInput, ...TABLE_DIMENSION_LIMITS.width, error: validate(widthInput, "Width", TABLE_DIMENSION_LIMITS.width.min, TABLE_DIMENSION_LIMITS.width.max), onChange: setWidthInput },
    { key: "height", label: "Height", value: heightInput, ...TABLE_DIMENSION_LIMITS.height, error: validate(heightInput, "Height", TABLE_DIMENSION_LIMITS.height.min, TABLE_DIMENSION_LIMITS.height.max), onChange: setHeightInput },
  ];
  const valid = fields.every((field) => !field.error);
  const dimensions = { length: Number(lengthInput) || 0, width: Number(widthInput) || 0, height: Number(heightInput) || 0 };
  const plan = valid ? generateTablePlan({ ...dimensions, wood, style: "modern" }) : null;
  const shoppingList = plan ? generateShoppingList(plan.cutList, plan.hardware) : null;
  const buildSteps = plan ? getOutdoorTableBuildSteps(plan) : [];

  return (
    <ProjectPageShell
      projectName="Modern Outdoor Table"
      materialLabel={getMaterialLabel(wood)}
      estimatedCostRange={shoppingList?.estimatedCostRangeCents ?? null}
      isReady={Boolean(plan)}
      summaryDetails={[{ label: "Build time", value: "6–8 hours" }, { label: "Difficulty", value: "Intermediate" }, { label: "Seats", value: "6 people" }, { label: "Skill level", value: "Confident beginner" }]}
      headerAction={<SaveProjectButton projectType="outdoor-table" projectName="Modern Outdoor Table" dimensions={dimensions} material={wood} disabled={!valid} />}
      gallery={<ProjectGallery items={OUTDOOR_TABLE_GALLERY_ITEMS} ariaLabel="Outdoor Table views" renderItem={(item, thumbnail) => <OutdoorTableGalleryVisual view={item.view} {...dimensions} wood={wood} thumbnail={thumbnail} />} />}
      configuration={<DimensionConfiguration fields={fields} material={wood} onMaterialChange={setWood} />}
    >
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
