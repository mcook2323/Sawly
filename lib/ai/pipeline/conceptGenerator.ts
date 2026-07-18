import type { ConceptGenerator } from "../../../types/aiProjectPipeline";
import { artifact, validateConceptSet, validateRequirementsProfile } from "./validation";

export class DeterministicConceptGenerator implements ConceptGenerator {
  generate({ profile: rawProfile, count }: Parameters<ConceptGenerator["generate"]>[0]) {
    const profile = validateRequirementsProfile(rawProfile).data;
    if (count !== 3) throw new RangeError("Sawly concept generation requires exactly three directions.");
    if (profile.missingFields.length) throw new Error("Planning profile is incomplete.");
    const requested = profile.style ? [profile.style] : [];
    const styles = [...new Set([...requested, "modern", "craftsman", "rustic"])].slice(0, 3);
    const base = profile.riskTier === "code-sensitive" ? { cost: "$1,500–$8,000+", difficulty: "Specialist review" as const, time: "Several weekends" } : profile.category === "Cabinetry" || profile.category === "Storage" ? { cost: "$250–$1,500", difficulty: "Intermediate" as const, time: "1–3 weekends" } : { cost: "$150–$1,200", difficulty: "Intermediate" as const, time: "1–2 weekends" };
    const concepts = styles.map((style, index) => ({ id: `concept-${style}-${index + 1}`, name: `${style[0]!.toUpperCase()}${style.slice(1)} ${profile.projectType.replaceAll("-", " ")}`, description: `${style} direction for ${profile.intendedUse?.toLowerCase() ?? "the requested use"}, organized around the supplied dimensions and material preferences.`, style, estimatedCost: base.cost, difficulty: base.difficulty, buildTime: base.time, thumbnail: { kind: "placeholder" as const, label: `${style} concept render placeholder` }, keyFeatures: [index === 0 ? "Clean, practical layout" : index === 1 ? "Expressive joinery rhythm" : "Material-forward character", profile.attachment ? `${profile.attachment.replaceAll("-", " ")} configuration` : "Flexible placement", profile.materials.length ? `${profile.materials.join(", ")} material direction` : "Material selection pending verification"] }));
    return validateConceptSet(artifact("concept-set", "concept-generator", { concepts }));
  }
}
