import { getNextQuestion } from "../conversation";
import { scoreDesignProfile } from "../guidedMatcher";
import { parseDesignRequest } from "../parser";
import { buildDesignProfile } from "../profile";
import type { OpenAIDesignOutput } from "./schema";
import type { ConversationRequest } from "./requestValidation";
import type { ProviderConversationResponse } from "@/types/ai";

export interface ConversationAnalyzer { analyze(prompt: string, profile: ProviderConversationResponse["profile"], answers: ConversationRequest["answers"]): Promise<OpenAIDesignOutput>; }

export function mergeValidatedAIProfile(base: ProviderConversationResponse["profile"], output: OpenAIDesignOutput): ProviderConversationResponse["profile"] {
  const dimensions = { ...base.dimensions };
  for (const key of ["length", "width", "depth", "height"] as const) if (dimensions[key] === undefined && output.dimensions[key] !== null) dimensions[key] = output.dimensions[key]!;
  const merged = { ...base, environment: base.environment ?? output.environment, dimensions, material: base.material ?? output.material, style: base.style ?? output.style, capacity: base.capacity ?? output.seatingCapacity, budget: base.budget ?? output.budget as ProviderConversationResponse["profile"]["budget"], intendedUse: base.intendedUse ?? output.intendedUse, keywords: [...new Set([...base.keywords, ...output.keywords])] };
  const fields = [merged.projectType !== "unknown", Boolean(merged.environment), Object.keys(merged.dimensions).length > 0, Boolean(merged.capacity), Boolean(merged.budget), Boolean(merged.material), Boolean(merged.style), Boolean(merged.intendedUse)];
  return { ...merged, completeness: Math.round(fields.filter(Boolean).length / fields.length * 100) };
}

export async function resolveWithProvider(requestId: string, request: ConversationRequest, provider: ConversationAnalyzer | null): Promise<ProviderConversationResponse> {
  const profile = buildDesignProfile(parseDesignRequest(request.prompt), request.answers); const deterministicQuestion = getNextQuestion(profile, request.answers); const resolution = deterministicQuestion ? null : scoreDesignProfile(profile);
  if (!provider) return { requestId, mode: "deterministic-fallback", profile, nextQuestion: deterministicQuestion, resolution, explanation: resolution?.explanation ?? "Sawly is using its verified guided questions.", fallbackReason: "missing-key" };
  try {
    const enhanced = await provider.analyze(request.prompt, profile, request.answers);
    const enhancedProfile = mergeValidatedAIProfile(profile, enhanced);
    const safeQuestion = getNextQuestion(enhancedProfile, request.answers);
    const nextQuestion = safeQuestion ? (enhanced.nextQuestion?.id === safeQuestion.id ? { ...safeQuestion, prompt: enhanced.nextQuestion.prompt } : safeQuestion) : null;
    const enhancedResolution = nextQuestion ? null : scoreDesignProfile(enhancedProfile);
    return { requestId, mode: "ai-enhanced", profile: enhancedProfile, nextQuestion, resolution: enhancedResolution, explanation: enhanced.explanation };
  } catch (error) {
    const reason = error instanceof Error && error.name === "AbortError" ? "timeout" : error instanceof SyntaxError || (error instanceof Error && error.message === "invalid-structured-response") ? "invalid-response" : "provider-error";
    return { requestId, mode: "deterministic-fallback", profile, nextQuestion: deterministicQuestion, resolution, explanation: resolution?.explanation ?? "Sawly continued with its verified guidance.", fallbackReason: reason };
  }
}
