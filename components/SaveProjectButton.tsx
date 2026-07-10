"use client";

import { useState } from "react";
import type { WoodMaterial } from "@/calculations/materialCatalog";
import type { ProjectType } from "@/calculations/projectPlan";
import { useSavedProjects } from "@/hooks/useSavedProjects";

interface SaveProjectButtonProps {
  projectType: ProjectType;
  projectName: string;
  dimensions: Record<string, number>;
  material: WoodMaterial;
  disabled?: boolean;
}

export function SaveProjectButton(props: SaveProjectButtonProps) {
  const { saveProject } = useSavedProjects();
  const [saved, setSaved] = useState(false);
  return (
    <button type="button" disabled={props.disabled} onClick={() => { saveProject({ projectType: props.projectType, projectName: props.projectName, dimensions: props.dimensions, material: props.material }); setSaved(true); }} className="cursor-pointer rounded-full border border-[#b9aa97] bg-[#fffdf9] px-5 py-2.5 text-sm font-semibold text-[#59664a] disabled:cursor-not-allowed disabled:opacity-50">
      {saved ? "Saved locally" : "Save project"}
    </button>
  );
}
