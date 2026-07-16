import type { CustomConceptPackage, CustomConceptProvider, CustomConceptRequest } from "@/types/customConcept";

export async function generateConceptPackage(request: CustomConceptRequest, provider: CustomConceptProvider): Promise<CustomConceptPackage> {
  const result = await provider.generate(request);
  return { ...result, generationStatus: "text-ready", concepts: result.concepts.map((concept) => ({ ...concept, imageStatus: "queued", imageUrl: null, imageAttempts: 0, imageError: null, imageLastAttemptedAt: null })) };
}
