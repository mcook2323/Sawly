import { PROJECT_CATEGORIES } from "../../../types/universalProject";
import type { AIPlanningProfile, AIProjectConcept } from "../../../types/aiProjectDesigner";
import type { ConceptSetArtifact, RequestClassificationArtifact, RequirementsProfileArtifact, StructuredArtifact } from "../../../types/aiProjectPipeline";

export function artifact<K extends string, T>(kind: K, producedBy: StructuredArtifact<K, T>["producedBy"], data: T): StructuredArtifact<K, T> {
  return { schemaVersion: 1, kind, producedBy, data };
}

export function validateClassification(value: RequestClassificationArtifact): RequestClassificationArtifact {
  if (value.schemaVersion !== 1 || value.kind !== "request-classification" || value.producedBy !== "request-classifier") throw new TypeError("Invalid request-classification artifact.");
  if (!value.data.normalizedPrompt || !value.data.projectType || !PROJECT_CATEGORIES.includes(value.data.category)) throw new TypeError("Request classification is incomplete.");
  return value;
}

export function validateRequirementsProfile(value: RequirementsProfileArtifact): RequirementsProfileArtifact {
  if (value.schemaVersion !== 1 || value.kind !== "requirements-profile" || value.producedBy !== "requirements-collector") throw new TypeError("Invalid requirements-profile artifact.");
  const profile: AIPlanningProfile = value.data;
  if (!profile.normalizedPrompt || !profile.projectType || !PROJECT_CATEGORIES.includes(profile.category) || !Array.isArray(profile.missingFields)) throw new TypeError("Requirements profile is incomplete.");
  return value;
}

export function validateConceptSet(value: ConceptSetArtifact): ConceptSetArtifact {
  validateRequirementsConcepts(value.data.concepts);
  if (value.schemaVersion !== 1 || value.kind !== "concept-set" || value.producedBy !== "concept-generator") throw new TypeError("Invalid concept-set artifact.");
  return value;
}

function validateRequirementsConcepts(concepts: AIProjectConcept[]) {
  if (concepts.length !== 3 || new Set(concepts.map((concept) => concept.id)).size !== 3 || new Set(concepts.map((concept) => concept.style)).size !== 3) throw new TypeError("Concept generator must return three distinct concepts.");
  for (const concept of concepts) if (!concept.name || !concept.description || !concept.estimatedCost || !concept.buildTime || !concept.keyFeatures.length) throw new TypeError("Generated concept is incomplete.");
}
