import type { EditValidationIssue, EditValidationResult, StructuredProjectEdit } from "../../../types/conversationEditor";
import type { UniversalComponent, UniversalWoodProject } from "../../../types/universalProject";

export const ALLOWED_EDIT_MATERIALS = ["pine", "cedar", "pressure-treated", "oak", "maple", "walnut", "plywood", "mdf", "generic wood"];
const routeRequiredTypes = new Set<StructuredProjectEdit["type"]>(["dimension-change", "material-change", "finish-change", "component-add", "component-remove", "component-move", "component-resize", "style-change", "constraint-change", "storage-change"]);

export function resolveEditTarget(project: UniversalWoodProject, edit: StructuredProjectEdit): UniversalComponent | null {
  if (edit.target.scope !== "component") return null;
  if (edit.target.id) return project.components.find((component) => component.id === edit.target.id) ?? null;
  const selector = edit.target.selector?.toLowerCase(); if (!selector) return null;
  return project.components.find((component) => `${component.name} ${component.role}`.toLowerCase().includes(selector.replace(/s$/, ""))) ?? null;
}

function currentDimension(project: UniversalWoodProject, axis: "length" | "width" | "depth" | "height") { const measure = axis === "depth" ? project.dimensions.depth ?? project.dimensions.width : project.dimensions[axis]; if (!measure) return null; return measure.unit === "ft" ? measure.value * 12 : measure.unit === "mm" ? measure.value / 25.4 : measure.unit === "cm" ? measure.value / 2.54 : measure.value; }

export function validateProjectEdits(project: UniversalWoodProject, edits: StructuredProjectEdit[]): EditValidationResult {
  const issues: EditValidationIssue[] = []; const accepted: StructuredProjectEdit[] = []; const signatures = new Map<string, StructuredProjectEdit>();
  const verified = project.verificationStatus === "verified-generator" || project.source.kind === "verified-generator";
  for (const edit of edits) {
    if (!Number.isFinite(edit.confidence) || edit.confidence < 0 || edit.confidence > 1) { issues.push({ editId: edit.id, code: "invalid-value", message: "Edit confidence must be between zero and one." }); continue; }
    if (verified && routeRequiredTypes.has(edit.type)) { issues.push({ editId: edit.id, code: "verified-route-required", message: "Verified geometry must be changed through its deterministic generator; it cannot be directly overridden." }); continue; }
    const detail = "axis" in edit ? edit.axis : edit.type === "constraint-change" ? `${edit.constraint}${edit.constraint === "tool-availability" ? `:${String(edit.metadata.tools)}` : ""}` : edit.type === "storage-change" ? edit.storageType : ""; const signature = `${edit.type}:${edit.target.id ?? edit.target.selector ?? edit.target.scope}:${detail}`; const conflict = signatures.get(signature);
    if (conflict && JSON.stringify(conflict) !== JSON.stringify(edit)) { issues.push({ editId: edit.id, code: "conflict", message: "The request contains conflicting changes for the same target." }); continue; } signatures.set(signature, edit);
    if (edit.target.scope === "component") { const component = resolveEditTarget(project, edit); if (!component) { issues.push({ editId: edit.id, code: "missing-target", message: `I could not find the requested ${edit.target.selector ?? "component"} in this project.` }); continue; } if (edit.type === "component-remove" && (project.connections.some((connection) => connection.componentIds.includes(component.id)) || project.cutList.some((cut) => cut.componentId === component.id))) { issues.push({ editId: edit.id, code: "unsafe-edit", message: `${component.name} is referenced by verified project data and cannot be removed directly.` }); continue; } }
    if (edit.type === "material-change" && !ALLOWED_EDIT_MATERIALS.includes(edit.material)) { issues.push({ editId: edit.id, code: "invalid-material", message: `${edit.material} is not an available conceptual material.` }); continue; }
    if (edit.type === "dimension-change") { const current = currentDimension(project, edit.axis); const resulting = edit.operation === "delta" ? (current ?? 0) + edit.value : edit.value; if (!Number.isFinite(resulting) || resulting <= 0) { issues.push({ editId: edit.id, code: "invalid-value", message: "Project dimensions must remain greater than zero." }); continue; } }
    if (edit.type === "component-resize") { const component = resolveEditTarget(project, edit); const measure = component?.dimensions?.[edit.axis === "width" ? "length" : edit.axis]; const current = measure?.value ?? 0; const resulting = edit.operation === "delta" ? current + edit.value : edit.value; if (!Number.isFinite(resulting) || resulting <= 0) { issues.push({ editId: edit.id, code: "invalid-value", message: "Component dimensions must remain greater than zero." }); continue; } }
    if (edit.type === "component-add" && edit.quantity < 1 || edit.type === "storage-change" && edit.quantity < 1) { issues.push({ editId: edit.id, code: "invalid-value", message: "Added component quantity must be at least one." }); continue; }
    if (edit.type === "constraint-change" && Object.values(edit.values).some((value) => !Number.isFinite(value))) { issues.push({ editId: edit.id, code: "invalid-value", message: "Constraint values must be finite numbers." }); continue; }
    accepted.push(edit);
  }
  const requiresDeterministicGenerator = issues.some((issue) => issue.code === "verified-route-required");
  return { valid: issues.length === 0, accepted, issues, requiresDeterministicGenerator };
}
