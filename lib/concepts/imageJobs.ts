import type { CustomConceptPackage } from "@/types/customConcept";

function canStart(status: string, attempts: number) { return status === "queued" && attempts === 0; }

export function selectedImageJobIds(pack: CustomConceptPackage, selectedId: string | null) {
  if (!selectedId) return [];
  const selected = pack.concepts.find((concept) => concept.id === selectedId);
  return selected && canStart(selected.imageStatus, selected.imageAttempts) ? [selected.id] : [];
}

export function allInitialImageJobIds(pack: CustomConceptPackage) {
  return pack.concepts.filter((concept) => canStart(concept.imageStatus, concept.imageAttempts)).map((concept) => concept.id).slice(0, 3);
}
