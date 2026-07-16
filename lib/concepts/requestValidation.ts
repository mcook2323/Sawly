import type { CustomConceptOption, CustomConceptRequest } from "@/types/customConcept";
import { validateCustomConceptOption } from "./schema";
export const MAX_CONCEPT_BODY_BYTES = 24_000;
export function validateConceptRequest(value: unknown): { ok: true; value: CustomConceptRequest } | { ok: false; error: string } {
  if (!value || typeof value !== "object") return { ok: false, error: "Invalid request." }; const v = value as Record<string, unknown>;
  if (Object.keys(v).some((key) => !["prompt","profile","revision","existingConcept"].includes(key))) return { ok: false, error: "Invalid request." };
  if (typeof v.prompt !== "string") return { ok: false, error: "A prompt is required." }; const prompt = v.prompt.trim().replace(/\s+/g," ");
  if (!prompt || prompt.length > 1000) return { ok: false, error: !prompt ? "A prompt is required." : "Prompt is too long." };
  if (v.revision !== undefined && (typeof v.revision !== "string" || v.revision.trim().length > 500)) return { ok: false, error: "Invalid revision." };
  if (v.profile !== undefined && (!v.profile || typeof v.profile !== "object" || Array.isArray(v.profile))) return { ok: false, error: "Invalid profile." };
  const allowedProfile = new Set(["projectType","environment","dimensions","capacity","budget","material","style","intendedUse","keywords","completeness","projectTypeExplicitlyOther"]);
  const profile = v.profile as Record<string, unknown> | undefined;
  if (profile && Object.keys(profile).some((key) => !allowedProfile.has(key))) return { ok: false, error: "Invalid profile." };
  if (v.existingConcept !== undefined && !validateCustomConceptOption(v.existingConcept)) return { ok: false, error: "Invalid existing concept." };
  return { ok: true, value: { prompt, profile, revision: typeof v.revision === "string" ? v.revision.trim() : undefined, existingConcept: v.existingConcept as CustomConceptOption | undefined } };
}
export function validateImageRequest(value: unknown): { ok: true; value: { packageId: string; concept: CustomConceptOption } } | { ok: false; error: string } {
  if (!value || typeof value !== "object") return { ok: false, error: "Invalid request." }; const v = value as Record<string, unknown>;
  if (Object.keys(v).some((key) => !["packageId","concept"].includes(key)) || typeof v.packageId !== "string" || !validateCustomConceptOption(v.concept) || (v.concept as CustomConceptOption).imageAttempts > 3) return { ok: false, error: "Invalid request." };
  return { ok: true, value: { packageId: v.packageId.slice(0,100), concept: v.concept as CustomConceptOption } };
}
