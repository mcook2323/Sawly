import { PROJECT_CATEGORIES, type UniversalWoodProject } from "../../types/universalProject";

export interface UniversalProjectValidationResult { valid: boolean; errors: string[]; }

export function defineUniversalProject(project: UniversalWoodProject) { return project; }

export function validateUniversalProject(project: UniversalWoodProject): UniversalProjectValidationResult {
  const errors: string[] = [];
  if (project.schemaVersion !== 1) errors.push("Unsupported schema version.");
  if (!project.id || !project.slug || !project.name || !project.projectType) errors.push("Project identity is incomplete.");
  if (!PROJECT_CATEGORIES.includes(project.category)) errors.push("Project category is invalid.");
  const unique = (items: Array<{ id: string }>, label: string) => { if (new Set(items.map((item) => item.id)).size !== items.length) errors.push(`${label} IDs must be unique.`); };
  unique(project.components, "Component"); unique(project.connections, "Connection"); unique(project.materials, "Material"); unique(project.hardware, "Hardware"); unique(project.cutList, "Cut item"); unique(project.tools, "Tool"); unique(project.buildSteps, "Build step"); unique(project.warnings, "Warning");
  const ids = { components: new Set(project.components.map((item) => item.id)), materials: new Set(project.materials.map((item) => item.id)), hardware: new Set(project.hardware.map((item) => item.id)), cuts: new Set(project.cutList.map((item) => item.id)), tools: new Set(project.tools.map((item) => item.id)), steps: new Set(project.buildSteps.map((item) => item.id)) };
  for (const cut of project.cutList) { if (!ids.components.has(cut.componentId)) errors.push(`Cut ${cut.id} references an unknown component.`); if (!ids.materials.has(cut.materialId)) errors.push(`Cut ${cut.id} references an unknown material.`); if (cut.quantity < 1 || cut.dimensions.length.value <= 0 || cut.dimensions.width.value <= 0 || (cut.dimensions.height && cut.dimensions.height.value <= 0)) errors.push(`Cut ${cut.id} has invalid dimensions or quantity.`); }
  for (const connection of project.connections) { if (connection.componentIds.some((id) => !ids.components.has(id))) errors.push(`Connection ${connection.id} references an unknown component.`); if (connection.hardwareIds.some((id) => !ids.hardware.has(id))) errors.push(`Connection ${connection.id} references unknown hardware.`); }
  for (const step of project.buildSteps) { if (step.componentIds.some((id) => !ids.components.has(id)) || step.cutItemIds.some((id) => !ids.cuts.has(id)) || step.hardwareIds.some((id) => !ids.hardware.has(id)) || step.toolIds.some((id) => !ids.tools.has(id)) || step.dependsOn.some((id) => !ids.steps.has(id))) errors.push(`Build step ${step.id} contains an unknown reference.`); }
  if (project.riskTier === "code-sensitive" && project.verification.specialistReview.includes("none")) errors.push("Code-sensitive projects must identify specialist review.");
  if (project.verificationStatus !== "verified-generator" && !project.warnings.some((warning) => warning.blocking)) errors.push("Unverified projects require a blocking verification warning.");
  return { valid: errors.length === 0, errors };
}
