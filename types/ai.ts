import type { WoodMaterial } from "@/calculations/materialCatalog";
import type { CatalogProjectId } from "@/types/project";

export type AIProjectType = "table" | "bench" | "workbench" | "kitchen" | "pergola" | "bookshelf" | "garden-bed" | "unknown";

export interface ParsedDesignRequest {
  raw: string;
  normalized: string;
  projectType: AIProjectType;
  material: WoodMaterial | null;
  dimensions: { length?: number; width?: number; depth?: number; height?: number };
  style: string | null;
  capacity: number | null;
  keywords: string[];
}

export interface TemplateMatch {
  projectId: CatalogProjectId;
  confidence: number;
  reasons: string[];
  prefill: {
    material?: WoodMaterial;
    dimensions: Record<string, number>;
  };
}

export interface DesignResolution {
  request: ParsedDesignRequest;
  match: TemplateMatch | null;
  status: "template-match" | "unavailable";
}

export interface SavedDesignRequest {
  id: string;
  prompt: string;
  parsed: ParsedDesignRequest;
  designProfile?: DesignProfile;
  savedAt: string;
}

export interface DesignProvider {
  readonly id: string;
  resolve(prompt: string): Promise<DesignResolution>;
}

export type DesignEnvironment = "indoor" | "outdoor" | "either";
export type ConfidenceBand = "high" | "medium" | "low";
export type DesignAnswerValue = string | number;

export interface DesignProfile {
  originalRequest: ParsedDesignRequest;
  projectType: AIProjectType;
  projectTypeExplicitlyOther: boolean;
  environment: DesignEnvironment | null;
  dimensions: ParsedDesignRequest["dimensions"];
  capacity: number | null;
  budget: "under-100" | "100-250" | "250-500" | "flexible" | null;
  material: WoodMaterial | null;
  style: string | null;
  intendedUse: string | null;
  keywords: string[];
  completeness: number;
}

export type DesignQuestionId = "projectType" | "environment" | "dimensions" | "capacity" | "budget" | "material" | "style" | "intendedUse";

export interface DesignQuestion {
  id: DesignQuestionId;
  prompt: string;
  helpText?: string;
  type: "choice" | "number" | "text" | "dimensions";
  options?: Array<{ label: string; value: string }>;
  required: boolean;
}

export type DesignAnswers = Partial<Record<DesignQuestionId, DesignAnswerValue>>;

export interface RankedTemplateMatch extends TemplateMatch {
  score: number;
  band: ConfidenceBand;
}

export interface GuidedDesignResolution {
  profile: DesignProfile;
  matches: RankedTemplateMatch[];
  confidence: number;
  band: ConfidenceBand;
  explanation: string;
}

export interface ConversationProvider {
  readonly id: string;
  getNextQuestion(profile: DesignProfile, answers: DesignAnswers): DesignQuestion | null;
  resolveProfile(profile: DesignProfile): Promise<GuidedDesignResolution>;
}

export type GuidanceMode = "ai-enhanced" | "deterministic-fallback";

export interface ProviderConversationResponse {
  requestId: string;
  mode: GuidanceMode;
  profile: DesignProfile;
  nextQuestion: DesignQuestion | null;
  resolution: GuidedDesignResolution | null;
  explanation: string;
  fallbackReason?: "missing-key" | "timeout" | "invalid-response" | "provider-error";
}
