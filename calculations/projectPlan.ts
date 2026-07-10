import type { WoodMaterial } from "./materialCatalog";

export type ProjectType = "outdoor-table" | "outdoor-bench";

export interface PlanDimension {
  label: string;
  value: number;
  unit: "in";
}

export interface CutPiece {
  name: string;
  quantity: number;
  thickness: number;
  width: number;
  length: number;
  material: WoodMaterial;
}

export interface HardwareItem {
  name: string;
  quantity: number;
}

export interface GeneratedProjectPlan {
  projectType: ProjectType;
  projectName: string;
  material: WoodMaterial;
  dimensions: PlanDimension[];
  cutList: CutPiece[];
  hardware: HardwareItem[];
}
