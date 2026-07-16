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
  style?: string;
  disabled?: boolean;
}

export function SaveProjectButton(props: SaveProjectButtonProps) {
  const { saveProject } = useSavedProjects();
  const [saved, setSaved] = useState(false);
  return (
    <button type="button" disabled={props.disabled} onClick={() => { saveProject({ projectType: props.projectType, projectName: props.projectName, dimensions: props.dimensions, material: props.material, style: props.style }); setSaved(true); }} className="ds-button ds-button-secondary min-h-10 cursor-pointer py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50">
      {saved ? "Saved locally" : "Save project"}
    </button>
  );
}
