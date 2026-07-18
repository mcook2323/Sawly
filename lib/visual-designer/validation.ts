import type { SceneValidationResult, VisualDimensions, VisualScene, VisualSceneObject } from "../../types/visualDesigner";

export const MIN_VISUAL_DIMENSION = 0.125;
export const MAX_VISUAL_DIMENSION = 1200;

export function validateDimensions(dimensions: VisualDimensions): SceneValidationResult {
  const errors: string[] = [];
  for (const [name, value] of Object.entries(dimensions).filter(([key]) => key !== "unit")) {
    if (typeof value !== "number" || !Number.isFinite(value)) errors.push(`${name} must be a finite number.`);
    else if (value < MIN_VISUAL_DIMENSION) errors.push(`${name} must be at least ${MIN_VISUAL_DIMENSION} in.`);
    else if (value > MAX_VISUAL_DIMENSION) errors.push(`${name} must be no more than ${MAX_VISUAL_DIMENSION} in.`);
  }
  return { valid: errors.length === 0, errors, warnings: [] };
}

export function canEditObject(object: VisualSceneObject) {
  if (object.status === "verified") return { allowed: false, reason: "Verified geometry must be changed through its deterministic generator." };
  if (object.locked) return { allowed: false, reason: "Unlock this conceptual component before editing it." };
  if (!object.editable) return { allowed: false, reason: "This component is not editable." };
  return { allowed: true, reason: null };
}

export function validateScene(scene: VisualScene): SceneValidationResult {
  const errors: string[] = [];
  const warnings = [...scene.warnings];
  const ids = new Set<string>();
  for (const object of scene.objects) {
    if (!object.id || ids.has(object.id)) errors.push(`Visual object ID ${object.id || "(missing)"} is invalid or duplicated.`);
    ids.add(object.id);
    errors.push(...validateDimensions(object.dimensions).errors.map((error) => `${object.name}: ${error}`));
    if (object.status === "verified" && object.editable) errors.push(`${object.name}: verified objects cannot be freely editable.`);
  }
  for (const object of scene.objects) if (object.parentId && !ids.has(object.parentId)) errors.push(`${object.name}: parent ${object.parentId} does not exist.`);
  if (scene.metadata.conceptual && !scene.warnings.some((warning) => /not a verified construction plan/i.test(warning))) errors.push("Concept scenes must preserve the unverified-plan warning.");
  return { valid: errors.length === 0, errors, warnings };
}
