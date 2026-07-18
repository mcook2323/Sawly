export const PROJECT_CATEGORIES = ["Furniture", "Storage", "Cabinetry", "Outdoor Structure", "Play Structure", "Landscape", "Workshop", "Architectural"] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];
export type ProjectRiskTier = "nonstructural" | "moderately-structural" | "code-sensitive";
export type ProjectUnit = "in" | "ft" | "mm" | "cm";
export type ProjectEnvironment = "indoor" | "outdoor" | "covered-outdoor" | "either";
export type ProjectVerificationStatus = "verified-generator" | "concept-only" | "requires-specialist-review";

export interface UniversalMeasure { value: number; unit: ProjectUnit; }
export interface UniversalDimensions { length?: UniversalMeasure; width?: UniversalMeasure; depth?: UniversalMeasure; height?: UniversalMeasure; custom?: Record<string, UniversalMeasure>; }
export interface UniversalMaterial { id: string; name: string; family: "solid-wood" | "engineered-wood" | "sheet-good" | "composite" | "metal" | "masonry" | "other"; species?: string; grade?: string; treatment?: string; finish?: string; nominalSize?: string; actualDimensions?: UniversalDimensions; quantity?: number; unit?: "piece" | "sheet" | "board-foot" | "linear-foot" | "package"; }
export interface UniversalHardware { id: string; name: string; quantity: number; unit: "piece" | "package" | "pair" | "set" | "length"; material?: string; specification?: string; }
export interface UniversalCutItem { id: string; name: string; componentId: string; materialId: string; quantity: number; dimensions: Required<Pick<UniversalDimensions, "length" | "width">> & Pick<UniversalDimensions, "height">; endCut?: "square" | "miter" | "bevel" | "compound" | "profiled"; notes?: string[]; }
export interface UniversalComponent { id: string; name: string; role: string; quantity: number; dimensions?: UniversalDimensions; materialIds: string[]; cutItemIds: string[]; structuralRole: "none" | "supporting" | "primary-structure" | "lateral-stability" | "guarding"; children?: string[]; }
export interface UniversalConnection { id: string; name: string; type: "screw" | "bolt" | "nail" | "adhesive" | "dowel" | "mortise-tenon" | "pocket-hole" | "bracket" | "anchor" | "hinge" | "slide" | "other"; componentIds: string[]; hardwareIds: string[]; location?: string; notes?: string[]; requiresVerification: boolean; }
export interface UniversalTool { id: string; name: string; category: "measure-layout" | "cutting" | "drilling-fastening" | "assembly" | "sanding-finishing" | "safety" | "access" | "site-work" | "specialty"; required: boolean; }
export interface UniversalBuildStep { id: string; order: number; title: string; instructions: string; componentIds: string[]; cutItemIds: string[]; hardwareIds: string[]; toolIds: string[]; dependsOn: string[]; safetyNotes: string[]; verificationChecks: string[]; }
export interface UniversalVisualization { defaultView: "lifestyle" | "perspective" | "front" | "side" | "plan" | "blueprint" | "assembly"; availableViews: Array<"lifestyle" | "perspective" | "front" | "side" | "plan" | "blueprint" | "assembly">; dynamic: boolean; assetRefs: Partial<Record<"hero" | "thumbnail" | "front" | "side" | "blueprint", string>>; dimensionLabels: string[]; camera?: { orbit: boolean; pan: boolean; zoom: boolean }; }
export interface UniversalValidationWarning { id: string; code: string; severity: "info" | "warning" | "critical"; message: string; scope: "project" | "dimensions" | "component" | "connection" | "material" | "site" | "code"; relatedIds: string[]; resolution?: string; blocking: boolean; }

export interface UniversalWoodProject {
  schemaVersion: 1;
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ProjectCategory;
  projectType: string;
  riskTier: ProjectRiskTier;
  verificationStatus: ProjectVerificationStatus;
  source: { kind: "verified-generator" | "manual" | "concept"; id: string; version: string };
  dimensions: UniversalDimensions;
  environment: { location: ProjectEnvironment; exposure: Array<"moisture" | "ground-contact" | "sun" | "freeze-thaw" | "wind" | "interior-dry">; attachment: "freestanding" | "wall-attached" | "ground-anchored" | "structure-attached" };
  intendedUse: { summary: string; capacity?: number; capacityUnit?: "people" | "items" | "linear-feet" | "square-feet"; audience?: "adult" | "child" | "general"; };
  components: UniversalComponent[];
  connections: UniversalConnection[];
  materials: UniversalMaterial[];
  hardware: UniversalHardware[];
  cutList: UniversalCutItem[];
  tools: UniversalTool[];
  buildSteps: UniversalBuildStep[];
  visualization: UniversalVisualization;
  warnings: UniversalValidationWarning[];
  verification: { disclaimer: string; specialistReview: Array<"structural" | "geotechnical" | "code" | "electrical" | "plumbing" | "gas" | "none">; assumptions: string[]; };
  metadata: { tags: string[]; style?: string; estimatedBuildTime?: string; generatedAt?: string; };
}
