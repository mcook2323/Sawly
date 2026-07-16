import type { WoodMaterial } from "@/calculations/materialCatalog";
import type { ProjectType } from "@/calculations/projectPlan";

export const SAVED_PROJECTS_KEY = "sawly.saved-projects.v1";

export interface SavedProject {
  id: string;
  projectType: ProjectType;
  projectName: string;
  dimensions: Record<string, number>;
  material: WoodMaterial;
  style?: string;
  savedAt: string;
}

function isSavedProject(value: unknown): value is SavedProject {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SavedProject>;
  return (
    typeof item.id === "string" &&
    (item.projectType === "outdoor-table" || item.projectType === "outdoor-bench") &&
    typeof item.projectName === "string" &&
    (item.material === "pine" || item.material === "cedar" || item.material === "treated") &&
    typeof item.savedAt === "string" &&
    (item.style === undefined || typeof item.style === "string") &&
    !!item.dimensions &&
    Object.values(item.dimensions).every((dimension) => Number.isFinite(dimension))
  );
}

export function readSavedProjects(): SavedProject[] {
  try {
    const raw = window.localStorage.getItem(SAVED_PROJECTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isSavedProject) : [];
  } catch {
    return [];
  }
}

export function writeSavedProjects(projects: SavedProject[]) {
  window.localStorage.setItem(SAVED_PROJECTS_KEY, JSON.stringify(projects));
}

export function getSavedProjectHref(project: SavedProject) {
  return `/projects/${project.projectType === "outdoor-table" ? "outdoor-table" : "outdoor-bench"}?saved=${encodeURIComponent(project.id)}`;
}
