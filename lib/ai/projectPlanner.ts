import type { AIPlannerResult, AIPlanningProfile, AIProjectConcept, PlannerAnswers } from "../../types/aiProjectDesigner";
import type { UniversalWoodProject } from "../../types/universalProject";
import { defineUniversalProject } from "../projects/universalProject";
import { DeterministicConceptGenerator, DeterministicRequestClassifier, DeterministicRequirementsCollector } from "./pipeline";

const requestClassifier = new DeterministicRequestClassifier();
const requirementsCollector = new DeterministicRequirementsCollector();
const conceptGenerator = new DeterministicConceptGenerator();

export function classifyProject(prompt: string) {
  const classification = requestClassifier.classify(prompt).data;
  return { normalized: classification.normalizedPrompt, category: classification.category, projectType: classification.projectType, riskTier: classification.initialRiskTier };
}

export function planProjectRequest(prompt: string, answers: PlannerAnswers = {}): AIPlannerResult {
  const classification = requestClassifier.classify(prompt);
  const result = requirementsCollector.collect({ prompt, classification, answers });
  return { profile: result.profile.data, nextQuestion: result.nextQuestion, complete: result.complete };
}

export function generateProjectConcepts(profile: AIPlanningProfile): AIProjectConcept[] {
  const profileArtifact = { schemaVersion: 1 as const, kind: "requirements-profile" as const, producedBy: "requirements-collector" as const, data: profile };
  return conceptGenerator.generate({ profile: profileArtifact, count: 3 }).data.concepts;
}

export function createUniversalDraft(profile: AIPlanningProfile, concept: AIProjectConcept): UniversalWoodProject {
  const warning = profile.riskTier === "code-sensitive" ? "This project will require additional engineering and/or local code verification before build plans can be generated." : "This AI concept requires deterministic project-specific validation before build plans can be generated.";
  return defineUniversalProject({ schemaVersion: 1, id: `draft:${concept.id}`, slug: concept.id, name: concept.name, description: concept.description, category: profile.category, projectType: profile.projectType, riskTier: profile.riskTier, verificationStatus: profile.riskTier === "code-sensitive" ? "requires-specialist-review" : "concept-only", source: { kind: "concept", id: "deterministic-ai-planner", version: "1" }, dimensions: profile.dimensions, environment: { location: profile.environment === "either" || !profile.environment ? "either" : profile.environment, exposure: profile.environment === "outdoor" ? ["moisture", "sun"] : ["interior-dry"], attachment: profile.attachment ?? "freestanding" }, intendedUse: { summary: profile.intendedUse ?? "Custom wood project", audience: profile.audience ?? "general" }, components: [{ id: "component-placeholder", name: "Placeholder project mass", role: "Visualization only", quantity: 1, dimensions: profile.dimensions, materialIds: ["material-direction"], cutItemIds: [], structuralRole: profile.riskTier === "code-sensitive" ? "primary-structure" : "none" }], connections: [], materials: [{ id: "material-direction", name: profile.materials.join(", ") || "Material to be determined", family: "solid-wood", quantity: 1, unit: "piece" }], hardware: [], cutList: [], tools: [], buildSteps: [], visualization: { defaultView: "perspective", availableViews: ["perspective", "front", "side", "plan", "blueprint"], dynamic: true, assetRefs: {}, dimensionLabels: Object.keys(profile.dimensions), camera: { orbit: true, pan: true, zoom: true } }, warnings: [{ id: "warning-unverified", code: profile.riskTier === "code-sensitive" ? "ENGINEERING_AND_CODE_REQUIRED" : "DETERMINISTIC_GENERATOR_REQUIRED", severity: "critical", message: warning, scope: profile.riskTier === "code-sensitive" ? "code" : "project", relatedIds: ["component-placeholder"], blocking: true }], verification: { disclaimer: "AI concept only—not a verified construction plan. No cuts, connections, loads, or code claims have been generated.", specialistReview: profile.riskTier === "code-sensitive" ? ["structural", "code"] : ["none"], assumptions: ["Dimensions and materials are preliminary and editable."] }, metadata: { tags: [...profile.keywords, "ai-concept"], style: concept.style, estimatedBuildTime: concept.buildTime } });
}
