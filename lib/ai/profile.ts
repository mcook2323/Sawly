import type { DesignAnswers, DesignEnvironment, DesignProfile, ParsedDesignRequest } from "@/types/ai";
import type { WoodMaterial } from "@/calculations/materialCatalog";

function environmentFrom(request: ParsedDesignRequest): DesignEnvironment | null {
  if (request.keywords.some((word) => ["outdoor", "patio", "garden", "deck"].includes(word))) return "outdoor";
  if (request.keywords.some((word) => ["indoor", "mudroom", "dining", "living"].includes(word))) return "indoor";
  return null;
}

export function buildDesignProfile(request: ParsedDesignRequest, answers: DesignAnswers): DesignProfile {
  const projectType = typeof answers.projectType === "string" ? answers.projectType as DesignProfile["projectType"] : request.projectType;
  const dimensions = { ...request.dimensions };
  if (typeof answers.dimensions === "string") {
    const values = answers.dimensions.split(/[x×,]/).map(Number).filter(Number.isFinite);
    if (values[0]) dimensions.length = values[0];
    if (values[1]) {
      if (projectType === "bench") dimensions.depth = values[1];
      else dimensions.width = values[1];
    }
    if (values[2]) dimensions.height = values[2];
  }
  const fields = [projectType !== "unknown", Boolean(answers.environment ?? environmentFrom(request)), Object.keys(dimensions).length > 0, Boolean(answers.capacity ?? request.capacity), Boolean(answers.budget), Boolean(answers.material ?? request.material), Boolean(answers.style ?? request.style), Boolean(answers.intendedUse)];
  return {
    originalRequest: request,
    projectType,
    projectTypeExplicitlyOther: answers.projectType === "unknown",
    environment: (answers.environment as DesignEnvironment | undefined) ?? environmentFrom(request),
    dimensions,
    capacity: typeof answers.capacity === "number" ? answers.capacity : request.capacity,
    budget: (answers.budget as DesignProfile["budget"] | undefined) ?? null,
    material: answers.material === "unspecified" ? null : (answers.material as WoodMaterial | undefined) ?? request.material,
    style: answers.style === "unspecified" ? null : (answers.style as string | undefined) ?? request.style,
    intendedUse: (answers.intendedUse as string | undefined) ?? null,
    keywords: request.keywords,
    completeness: Math.round(fields.filter(Boolean).length / fields.length * 100),
  };
}
