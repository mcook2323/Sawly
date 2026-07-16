export type ConceptDifficulty = "beginner" | "intermediate" | "advanced";
export type ConceptBudget = "under-250" | "250-750" | "750-2000" | "over-2000";
export type ConceptBuildTime = "weekend" | "2-4-days" | "1-2-weeks" | "multi-week";
export type ConceptImageStatus = "queued" | "generating" | "ready" | "failed";
export type ConceptVerificationStatus = "ai-concept-not-build-verified";

export interface CustomConceptOption {
  id: string; title: string; description: string; intendedUse: string; style: string; environment: "indoor" | "outdoor" | "either";
  approximateDimensions: { width: string; depth: string; height: string };
  suggestedMaterials: string[]; finishDirection: string; majorFeatures: string[];
  difficulty: ConceptDifficulty; budget: ConceptBudget; buildTime: ConceptBuildTime;
  skillCategories: string[]; toolCategories: string[]; assumptions: string[]; unresolvedQuestions: string[]; safetyLimitations: string[];
  imageStatus: ConceptImageStatus; imageUrl: string | null; imageAttempts: number; imageError: string | null; imageLastAttemptedAt: string | null; verificationStatus: ConceptVerificationStatus;
  verifiedTemplateCandidate: "outdoor-table" | "outdoor-bench" | null;
}
export interface CustomConceptPackage { schemaVersion: 1; id: string; originalPrompt: string; concepts: CustomConceptOption[]; createdAt: string; generationStatus: "text-ready" | "images-partial" | "images-ready"; }
export interface CustomConceptRequest { prompt: string; profile?: unknown; revision?: string; existingConcept?: CustomConceptOption; }
export interface CustomConceptProvider { generate(request: CustomConceptRequest): Promise<CustomConceptPackage>; }
export interface SavedCustomConcept { schemaVersion: 1; id: string; package: CustomConceptPackage; selectedConceptId: string | null; revisionHistory: string[]; savedAt: string; }
