import type { CustomConceptOption, CustomConceptPackage } from "@/types/customConcept";
import { CategorizedConceptError } from "./errors";

const difficulties = ["beginner","intermediate","advanced"];
const budgets = ["under-250","250-750","750-2000","over-2000"];
const times = ["weekend","2-4-days","1-2-weeks","multi-week"];
const conceptKeys = ["id","title","description","intendedUse","style","environment","approximateDimensions","suggestedMaterials","finishDirection","majorFeatures","difficulty","budget","buildTime","skillCategories","toolCategories","assumptions","unresolvedQuestions","safetyLimitations","verifiedTemplateCandidate"];

export const CUSTOM_CONCEPT_SCHEMA = { type: "object", additionalProperties: false, required: ["concepts"], properties: { concepts: { type: "array", minItems: 3, maxItems: 3, items: { type: "object", additionalProperties: false, required: conceptKeys, properties: {
  id: { type: "string", maxLength: 80 }, title: { type: "string", maxLength: 120 }, description: { type: "string", maxLength: 500 }, intendedUse: { type: "string", maxLength: 300 }, style: { type: "string", maxLength: 100 }, environment: { type: "string", enum: ["indoor","outdoor","either"] },
  approximateDimensions: { type: "object", additionalProperties: false, required: ["width","depth","height"], properties: { width: { type: "string", maxLength: 60 }, depth: { type: "string", maxLength: 60 }, height: { type: "string", maxLength: 60 } } },
  suggestedMaterials: { type: "array", minItems: 1, maxItems: 10, items: { type: "string", maxLength: 100 } }, finishDirection: { type: "string", maxLength: 200 }, majorFeatures: { type: "array", minItems: 1, maxItems: 12, items: { type: "string", maxLength: 140 } }, difficulty: { type: "string", enum: difficulties }, budget: { type: "string", enum: budgets }, buildTime: { type: "string", enum: times },
  skillCategories: { type: "array", minItems: 1, maxItems: 10, items: { type: "string", maxLength: 100 } }, toolCategories: { type: "array", minItems: 1, maxItems: 10, items: { type: "string", maxLength: 100 } }, assumptions: { type: "array", maxItems: 10, items: { type: "string", maxLength: 200 } }, unresolvedQuestions: { type: "array", maxItems: 10, items: { type: "string", maxLength: 200 } }, safetyLimitations: { type: "array", minItems: 1, maxItems: 10, items: { type: "string", maxLength: 240 } }, verifiedTemplateCandidate: { type: ["string","null"], enum: ["outdoor-table","outdoor-bench",null] }
} } } } } as const;

function stringArray(value: unknown) { return Array.isArray(value) && value.every((item) => typeof item === "string"); }
export function validateConceptOption(value: unknown): value is Omit<CustomConceptOption,"imageStatus"|"imageUrl"|"verificationStatus"> {
  if (!value || typeof value !== "object") return false; const v = value as Record<string, unknown>;
  if (Object.keys(v).some((key) => !conceptKeys.includes(key)) || conceptKeys.some((key) => !(key in v))) return false;
  const d = v.approximateDimensions as Record<string, unknown> | null;
  return typeof v.id === "string" && typeof v.title === "string" && typeof v.description === "string" && typeof v.intendedUse === "string" && typeof v.style === "string" && ["indoor","outdoor","either"].includes(String(v.environment)) && !!d && Object.keys(d).length === 3 && ["width","depth","height"].every((key) => typeof d[key] === "string") && stringArray(v.suggestedMaterials) && typeof v.finishDirection === "string" && stringArray(v.majorFeatures) && difficulties.includes(String(v.difficulty)) && budgets.includes(String(v.budget)) && times.includes(String(v.buildTime)) && stringArray(v.skillCategories) && stringArray(v.toolCategories) && stringArray(v.assumptions) && stringArray(v.unresolvedQuestions) && stringArray(v.safetyLimitations) && ["outdoor-table","outdoor-bench",null].includes(v.verifiedTemplateCandidate as string | null);
}
export function validateConceptProviderOutput(value: unknown) {
  if (!value || typeof value !== "object" || Object.keys(value).some((key) => key !== "concepts")) return null;
  const concepts = (value as { concepts?: unknown }).concepts;
  if (!Array.isArray(concepts) || concepts.length !== 3 || !concepts.every(validateConceptOption)) return null;
  if (new Set(concepts.map((item) => `${item.id}:${item.title}`.toLowerCase())).size !== 3) return null;
  return concepts;
}
export function parseConceptProviderText(text: string) { let value: unknown; try { value = JSON.parse(text); } catch { throw new CategorizedConceptError("malformed_provider_response"); } const concepts = validateConceptProviderOutput(value); if (!concepts) throw new CategorizedConceptError("schema_validation_failed"); return concepts; }
export function validateCustomConceptOption(value: unknown): value is CustomConceptOption {
  if (!value || typeof value !== "object") return false;
  const concept = value as CustomConceptOption;
  const structured = Object.fromEntries(Object.entries(concept).filter(([key]) => !["imageStatus","imageUrl","imageAttempts","imageError","imageLastAttemptedAt","verificationStatus"].includes(key)));
  return validateConceptOption(structured) && ["queued","generating","ready","failed"].includes(concept.imageStatus) && Number.isInteger(concept.imageAttempts) && concept.imageAttempts >= 0 && (concept.imageError === null || typeof concept.imageError === "string") && (concept.imageLastAttemptedAt === null || typeof concept.imageLastAttemptedAt === "string") && concept.verificationStatus === "ai-concept-not-build-verified" && (concept.imageUrl === null || typeof concept.imageUrl === "string");
}
export function isCustomConceptPackage(value: unknown): value is CustomConceptPackage {
  if (!value || typeof value !== "object") return false; const v = value as Partial<CustomConceptPackage>;
  return v.schemaVersion === 1 && typeof v.id === "string" && typeof v.originalPrompt === "string" && Array.isArray(v.concepts) && v.concepts.length === 3 && v.concepts.every(validateCustomConceptOption) && typeof v.createdAt === "string" && ["text-ready","images-partial","images-ready"].includes(String(v.generationStatus));
}
