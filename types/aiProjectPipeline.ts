import type { AIPlanningProfile, AIProjectConcept, PlannerAnswers, PlannerQuestion } from "./aiProjectDesigner";
import type { ProjectCategory, ProjectRiskTier, UniversalWoodProject } from "./universalProject";

export type PipelineLayer = "request-classifier" | "requirements-collector" | "concept-generator" | "safety-reviewer" | "plan-router" | "cost-estimator" | "instruction-generator" | "final-validator";

export interface StructuredArtifact<K extends string, T> {
  schemaVersion: 1;
  kind: K;
  producedBy: PipelineLayer;
  data: T;
}

export interface RequestClassification {
  normalizedPrompt: string;
  projectType: string;
  category: ProjectCategory;
  initialRiskTier: ProjectRiskTier;
  intent: "design-concept" | "modify-existing" | "repair" | "explore";
  keywords: string[];
}

export type RequestClassificationArtifact = StructuredArtifact<"request-classification", RequestClassification>;
export type RequirementsProfileArtifact = StructuredArtifact<"requirements-profile", AIPlanningProfile>;
export type ConceptSetArtifact = StructuredArtifact<"concept-set", { concepts: AIProjectConcept[] }>;

export interface RequestClassifier {
  classify(prompt: string): RequestClassificationArtifact;
}

export interface RequirementsCollectionRequest {
  prompt: string;
  classification: RequestClassificationArtifact;
  answers: PlannerAnswers;
}

export interface RequirementsCollectionResult {
  profile: RequirementsProfileArtifact;
  nextQuestion: PlannerQuestion | null;
  complete: boolean;
}

export interface RequirementsCollector {
  collect(request: RequirementsCollectionRequest): RequirementsCollectionResult;
}

export interface ConceptGenerationRequest {
  profile: RequirementsProfileArtifact;
  count: 3;
}

export interface ConceptGenerator {
  generate(request: ConceptGenerationRequest): ConceptSetArtifact;
}

export type SafetyConcern = "structural" | "code" | "child-use" | "elevated" | "electrical" | "plumbing" | "fire" | "occupancy";
export interface SafetyReview { status: "not-implemented"; concerns: SafetyConcern[]; blockingWarnings: string[]; claimsCodeCompliance: false; }
export interface SafetyAndRiskReviewer { review(project: UniversalWoodProject): StructuredArtifact<"safety-review", SafetyReview>; }

export interface PlanRoute { status: "concept-only" | "verified-generator"; generatorId: string | null; reason: string; allowsAIGeometry: false; }
export interface DeterministicPlanRouter { route(profile: RequirementsProfileArtifact): StructuredArtifact<"plan-route", PlanRoute>; }

export interface CostMaterialsEstimate { status: "not-implemented"; approximate: true; materialFamilies: string[]; hardwareGroups: string[]; costRange: null; substitutions: string[]; }
export interface CostAndMaterialsEstimator { estimate(project: UniversalWoodProject): StructuredArtifact<"cost-materials-estimate", CostMaterialsEstimate>; }

export interface InstructionGeneration { status: "blocked"; steps: []; reason: string; }
export interface BuildInstructionGenerator { generate(project: UniversalWoodProject): StructuredArtifact<"build-instructions", InstructionGeneration>; }

export interface FinalValidation { finalPlanAllowed: boolean; schemaComplete: boolean; referencesValid: boolean; warningsPresent: boolean; disclaimerPresent: boolean; errors: string[]; }
export interface FinalValidationLayer { validate(project: UniversalWoodProject): StructuredArtifact<"final-validation", FinalValidation>; }
