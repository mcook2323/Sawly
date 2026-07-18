import type { ProjectRiskTier, ProjectVerificationStatus, UniversalWoodProject } from "./universalProject";

export type VisualComponentType = "board" | "post" | "panel" | "shelf" | "leg" | "beam" | "rail" | "brace" | "tabletop" | "seat" | "backrest" | "roof-panel" | "wall-panel" | "door" | "drawer" | "platform" | "step" | "generic-box";
export type VisualMaterial = "pine" | "cedar" | "pressure-treated" | "oak" | "maple" | "walnut" | "plywood" | "mdf" | "generic-wood" | "metal-hardware" | "conceptual";
export type VisualFinish = "unfinished" | "clear-coat" | "natural-stain" | "dark-stain" | "painted-white" | "painted-black" | "painted-color" | "weathered";
export type VisualMode = "blueprint" | "workshop" | "lifestyle";
export type TransformMode = "select" | "move" | "rotate" | "resize";
export type CameraView = "perspective" | "front" | "back" | "left" | "right" | "top";
export type SceneUnit = "in";
export interface Vector3Value { x: number; y: number; z: number; }
export interface VisualDimensions { width: number; height: number; depth: number; unit: SceneUnit; }
export interface InferredVisualValue { field: string; value: number | string; reason: string; }

export interface VisualSceneObject {
  id: string;
  componentId: string;
  name: string;
  type: VisualComponentType;
  parentId: string | null;
  position: Vector3Value;
  rotation: Vector3Value;
  scale: Vector3Value;
  dimensions: VisualDimensions;
  material: VisualMaterial;
  finish: VisualFinish;
  visible: boolean;
  locked: boolean;
  selectable: boolean;
  editable: boolean;
  status: "conceptual" | "verified";
  metadata: { inferred: InferredVisualValue[]; source: "project" | "verified-adapter" | "generic-adapter"; role?: string; assembly?: string; [key: string]: unknown; };
}

export interface VisualScene {
  schemaVersion: 1;
  id: string;
  projectId: string;
  projectName: string;
  projectType: string;
  riskTier: ProjectRiskTier;
  verificationStatus: ProjectVerificationStatus;
  unit: SceneUnit;
  objects: VisualSceneObject[];
  rootIds: string[];
  mode: VisualMode;
  showDimensions: boolean;
  camera: { view: CameraView; orthographic: boolean; target: Vector3Value; zoom: number; };
  warnings: string[];
  metadata: { adapter: "verified-table" | "verified-bench" | "generic"; conceptual: boolean; sourceProjectSchemaVersion: number; };
}

export interface DesignerState {
  scene: VisualScene;
  selectedObjectId: string | null;
  transformMode: TransformMode;
  snapping: { enabled: boolean; increment: 0.125 | 0.25 | 0.5; };
}

export interface DesignerHistory<T> { past: T[]; present: T; future: T[]; limit: number; }
export interface SceneValidationResult { valid: boolean; errors: string[]; warnings: string[]; }
export interface ConstraintWarning { id: string; objectId: string; severity: "warning" | "blocking"; message: string; kind: "positive-dimensions" | "parent-bounds" | "vertical-order" | "alignment" | "equal-spacing" | "symmetry" | "connection-point" | "minimum-clearance" | "structural"; }
export interface VisualDraftEnvelope { schemaVersion: 1; kind: "sawly-visual-draft"; projectId: string; savedAt: string; scene: VisualScene; }
export interface ConceptualExport { schemaVersion: 1; kind: "sawly-concept-export"; label: "Concept model — not a verified construction plan." | "Verified generator visualization"; project: UniversalWoodProject; scene?: VisualScene; excluded: ["unverified-cut-lists", "unverified-build-steps", "engineering-claims", "code-compliance-claims"]; }
export interface VisualDraftPersistence { save(scene: VisualScene): void; load(projectId: string): VisualScene | null; remove(projectId: string): void; }
