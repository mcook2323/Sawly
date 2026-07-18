import type { ProjectCategory, ProjectRiskTier, UniversalDimensions, UniversalWoodProject } from "./universalProject";

export type PlannerQuestionId = "dimensions" | "environment" | "intendedUse" | "attachment" | "roof" | "material" | "style" | "audience";
export interface PlannerQuestion { id: PlannerQuestionId; prompt: string; helpText?: string; type: "text" | "choice"; options?: Array<{ label: string; value: string }>; }
export type PlannerAnswers = Partial<Record<PlannerQuestionId, string>>;
export interface AIPlanningProfile { normalizedPrompt: string; projectType: string; category: ProjectCategory; riskTier: ProjectRiskTier; environment: "indoor" | "outdoor" | "either" | null; intendedUse: string | null; dimensions: UniversalDimensions; style: string | null; materials: string[]; attachment: "freestanding" | "wall-attached" | "ground-anchored" | "structure-attached" | null; roof: string | null; audience: "adult" | "child" | "general" | null; keywords: string[]; missingFields: PlannerQuestionId[]; }
export interface AIProjectConcept { id: string; name: string; description: string; style: string; estimatedCost: string; difficulty: "Beginner" | "Intermediate" | "Advanced" | "Specialist review"; buildTime: string; thumbnail: { kind: "placeholder"; label: string }; keyFeatures: string[]; }
export interface AIPlannerResult { profile: AIPlanningProfile; nextQuestion: PlannerQuestion | null; complete: boolean; }
export interface SelectedProjectDraft { concept: AIProjectConcept; project: UniversalWoodProject; }
