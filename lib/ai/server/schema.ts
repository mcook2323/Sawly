import type { AIProjectType, DesignEnvironment, DesignQuestion, ConfidenceBand } from "@/types/ai";
import type { WoodMaterial } from "@/calculations/materialCatalog";

export interface OpenAIDesignOutput {
  normalizedPrompt: string; projectType: AIProjectType; environment: DesignEnvironment | null;
  dimensions: { length: number | null; width: number | null; depth: number | null; height: number | null };
  material: WoodMaterial | null; style: string | null; seatingCapacity: number | null; budget: string | null;
  intendedUse: string | null; keywords: string[]; missingFields: string[]; nextQuestion: DesignQuestion | null;
  confidence: number; confidenceBand: ConfidenceBand; explanation: string; recommendedTemplateIds: Array<"outdoor-table" | "outdoor-bench">; unsupportedReason: string | null;
}

const projectTypes = ["table", "bench", "workbench", "kitchen", "pergola", "bookshelf", "garden-bed", "unknown"];
const questionIds = ["projectType", "environment", "dimensions", "capacity", "budget", "material", "style", "intendedUse"];

export const OPENAI_DESIGN_SCHEMA = { type: "object", additionalProperties: false, required: ["normalizedPrompt","projectType","environment","dimensions","material","style","seatingCapacity","budget","intendedUse","keywords","missingFields","nextQuestion","confidence","confidenceBand","explanation","recommendedTemplateIds","unsupportedReason"], properties: {
  normalizedPrompt: { type: "string", maxLength: 1000 }, projectType: { type: "string", enum: projectTypes }, environment: { type: ["string","null"], enum: ["indoor","outdoor","either",null] },
  dimensions: { type: "object", additionalProperties: false, required: ["length","width","depth","height"], properties: { length: { type: ["number","null"] }, width: { type: ["number","null"] }, depth: { type: ["number","null"] }, height: { type: ["number","null"] } } },
  material: { type: ["string","null"], enum: ["pine","cedar","treated",null] }, style: { type: ["string","null"], maxLength: 80 }, seatingCapacity: { type: ["number","null"], minimum: 1, maximum: 30 }, budget: { type: ["string","null"], enum: ["under-100","100-250","250-500","flexible",null] }, intendedUse: { type: ["string","null"], maxLength: 300 },
  keywords: { type: "array", maxItems: 20, items: { type: "string", maxLength: 50 } }, missingFields: { type: "array", maxItems: 8, items: { type: "string", enum: questionIds } },
  nextQuestion: { anyOf: [{ type: "null" }, { type: "object", additionalProperties: false, required: ["id","prompt","type","required","options"], properties: { id: { type: "string", enum: questionIds }, prompt: { type: "string", maxLength: 300 }, type: { type: "string", enum: ["choice","number","text","dimensions"] }, required: { type: "boolean" }, options: { type: "array", maxItems: 6, items: { type: "object", additionalProperties: false, required: ["label","value"], properties: { label: { type: "string", maxLength: 80 }, value: { type: "string", maxLength: 80 } } } } } }] },
  confidence: { type: "number", minimum: 0, maximum: 1 }, confidenceBand: { type: "string", enum: ["high","medium","low"] }, explanation: { type: "string", maxLength: 600 }, recommendedTemplateIds: { type: "array", maxItems: 2, uniqueItems: true, items: { type: "string", enum: ["outdoor-table","outdoor-bench"] } }, unsupportedReason: { type: ["string","null"], maxLength: 500 }
} } as const;

export function validateOpenAIDesignOutput(value: unknown): OpenAIDesignOutput | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>; const dims = v.dimensions as Record<string, unknown> | null;
  const allowed = new Set(["normalizedPrompt","projectType","environment","dimensions","material","style","seatingCapacity","budget","intendedUse","keywords","missingFields","nextQuestion","confidence","confidenceBand","explanation","recommendedTemplateIds","unsupportedReason"]);
  if (Object.keys(v).some((key) => !allowed.has(key))) return null;
  const nullableString = (item: unknown) => item === null || typeof item === "string";
  if (typeof v.normalizedPrompt !== "string" || !projectTypes.includes(String(v.projectType)) || !dims || typeof dims !== "object") return null;
  if (!["indoor","outdoor","either",null].includes(v.environment as string | null) || !["pine","cedar","treated",null].includes(v.material as string | null)) return null;
  if (!Array.isArray(v.keywords) || !v.keywords.every((x) => typeof x === "string") || !Array.isArray(v.missingFields) || !v.missingFields.every((x) => questionIds.includes(String(x)))) return null;
  if (typeof v.confidence !== "number" || v.confidence < 0 || v.confidence > 1 || !["high","medium","low"].includes(String(v.confidenceBand)) || typeof v.explanation !== "string") return null;
  if (!nullableString(v.style) || !nullableString(v.budget) || !nullableString(v.intendedUse) || !nullableString(v.unsupportedReason) || (v.seatingCapacity !== null && typeof v.seatingCapacity !== "number")) return null;
  if (!["under-100","100-250","250-500","flexible",null].includes(v.budget as string | null)) return null;
  if (!Array.isArray(v.recommendedTemplateIds) || !v.recommendedTemplateIds.every((x) => x === "outdoor-table" || x === "outdoor-bench")) return null;
  if (v.nextQuestion !== null) {
    if (!v.nextQuestion || typeof v.nextQuestion !== "object") return null;
    const question = v.nextQuestion as Record<string, unknown>;
    if (!questionIds.includes(String(question.id)) || typeof question.prompt !== "string" || !["choice","number","text","dimensions"].includes(String(question.type)) || typeof question.required !== "boolean" || !Array.isArray(question.options)) return null;
  }
  if (Object.keys(dims).some((key) => !["length","width","depth","height"].includes(key)) || ["length","width","depth","height"].some((key) => dims[key] !== null && typeof dims[key] !== "number")) return null;
  return value as OpenAIDesignOutput;
}
