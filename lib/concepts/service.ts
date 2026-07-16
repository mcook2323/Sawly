import type { ConceptImageProvider } from "@/lib/concepts/imageProvider";
import type { ConceptImageStorage } from "@/lib/concepts/imageStorage";
import type { CustomConceptPackage, CustomConceptProvider, CustomConceptRequest } from "@/types/customConcept";

export async function generateConceptPackage(request: CustomConceptRequest, provider: CustomConceptProvider, images: ConceptImageProvider | null, storage: ConceptImageStorage | null): Promise<CustomConceptPackage> {
  const result = await provider.generate(request);
  if (!images || !storage) return { ...result, generationStatus: "partial", concepts: result.concepts.map((concept) => ({ ...concept, imageStatus: "error" })) };
  const concepts = [];
  for (const concept of result.concepts.slice(0,3)) {
    try { const bytes = await images.generate(concept); const imageUrl = await storage.save(`${result.id}-${concept.id}-${Date.now()}`, bytes); concepts.push({ ...concept, imageStatus: "ready" as const, imageUrl }); }
    catch { concepts.push({ ...concept, imageStatus: "error" as const, imageUrl: null }); }
  }
  return { ...result, concepts, generationStatus: concepts.every((item) => item.imageStatus === "ready") ? "complete" : "partial" };
}
