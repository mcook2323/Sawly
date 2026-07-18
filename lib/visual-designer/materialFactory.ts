import type { UniversalMaterial } from "../../types/universalProject";
import type { VisualFinish, VisualMaterial, VisualMode } from "../../types/visualDesigner";

export const VISUAL_MATERIAL_COLORS: Record<VisualMaterial, string> = { pine: "#d8b574", cedar: "#b96f45", "pressure-treated": "#8fa06f", oak: "#b58a54", maple: "#dec795", walnut: "#6f4934", plywood: "#c9a66b", mdf: "#b69b76", "generic-wood": "#b88955", "metal-hardware": "#6e7475", conceptual: "#9ab3a2" };

export function visualMaterialFromProject(material?: UniversalMaterial | string): VisualMaterial {
  const value = typeof material === "string" ? material : `${material?.name ?? ""} ${material?.species ?? ""} ${material?.treatment ?? ""}`;
  const normalized = value.toLowerCase();
  if (/pressure|treated/.test(normalized)) return "pressure-treated";
  for (const candidate of ["pine", "cedar", "oak", "maple", "walnut", "plywood", "mdf"] as const) if (normalized.includes(candidate)) return candidate;
  if (/metal|steel|aluminum/.test(normalized)) return "metal-hardware";
  return "generic-wood";
}

export function visualFinishFromProject(value?: string): VisualFinish {
  const normalized = value?.toLowerCase() ?? "";
  if (/clear/.test(normalized)) return "clear-coat"; if (/dark/.test(normalized)) return "dark-stain"; if (/stain/.test(normalized)) return "natural-stain"; if (/white/.test(normalized)) return "painted-white"; if (/black/.test(normalized)) return "painted-black"; if (/paint/.test(normalized)) return "painted-color"; if (/weather/.test(normalized)) return "weathered";
  return "unfinished";
}

export function materialAppearance(material: VisualMaterial, finish: VisualFinish, mode: VisualMode) {
  if (mode === "blueprint") return { color: "#dce5df", roughness: 0.85, metalness: 0, opacity: 0.9, transparent: false };
  const painted = finish === "painted-white" ? "#f2efe7" : finish === "painted-black" ? "#282b29" : finish === "painted-color" ? "#788d76" : VISUAL_MATERIAL_COLORS[material];
  return { color: painted, roughness: finish === "clear-coat" ? 0.42 : 0.72, metalness: material === "metal-hardware" ? 0.65 : 0, opacity: material === "conceptual" ? 0.58 : 1, transparent: material === "conceptual" };
}
