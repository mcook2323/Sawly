import type { UniversalWoodProject } from "../../types/universalProject";
import type { ConceptualExport, VisualScene } from "../../types/visualDesigner";

export function createConceptualExport(project: UniversalWoodProject, scene?: VisualScene): ConceptualExport {
  const verified = project.verificationStatus === "verified-generator" && project.source.kind === "verified-generator";
  const safeProject = verified ? project : { ...project, cutList: [], hardware: [], connections: [], tools: [], buildSteps: [] };
  return { schemaVersion: 1, kind: "sawly-concept-export", label: verified ? "Verified generator visualization" : "Concept model — not a verified construction plan.", project: safeProject, ...(scene ? { scene } : {}), excluded: ["unverified-cut-lists", "unverified-build-steps", "engineering-claims", "code-compliance-claims"] };
}

export function downloadJSON(filename: string, value: unknown) { const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); }
