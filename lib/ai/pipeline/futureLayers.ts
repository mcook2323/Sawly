import type { BuildInstructionGenerator, CostAndMaterialsEstimator, DeterministicPlanRouter, FinalValidationLayer, SafetyAndRiskReviewer } from "../../../types/aiProjectPipeline";
import { validateUniversalProject } from "../../projects/universalProject";
import { artifact, validateRequirementsProfile } from "./validation";

export class PlaceholderSafetyAndRiskReviewer implements SafetyAndRiskReviewer {
  review(_project: Parameters<SafetyAndRiskReviewer["review"]>[0]) {
    void _project;
    return artifact("safety-review", "safety-reviewer", { status: "not-implemented" as const, concerns: [], blockingWarnings: ["Automated safety review is not implemented. Preserve existing project warnings and require deterministic verification."], claimsCodeCompliance: false as const });
  }
}

export class ConceptOnlyPlanRouter implements DeterministicPlanRouter {
  route(rawProfile: Parameters<DeterministicPlanRouter["route"]>[0]) {
    const profile = validateRequirementsProfile(rawProfile).data;
    return artifact("plan-route", "plan-router", { status: "concept-only" as const, generatorId: null, reason: `No deterministic router has approved ${profile.projectType}. Existing verified generators remain independently accessible.`, allowsAIGeometry: false as const });
  }
}

export class PlaceholderCostAndMaterialsEstimator implements CostAndMaterialsEstimator {
  estimate(_project: Parameters<CostAndMaterialsEstimator["estimate"]>[0]) {
    void _project;
    return artifact("cost-materials-estimate", "cost-estimator", { status: "not-implemented" as const, approximate: true as const, materialFamilies: [], hardwareGroups: [], costRange: null, substitutions: [] });
  }
}

export class VerifiedOutputInstructionGenerator implements BuildInstructionGenerator {
  generate(project: Parameters<BuildInstructionGenerator["generate"]>[0]) {
    const verified = project.verificationStatus === "verified-generator" && project.source.kind === "verified-generator";
    return artifact("build-instructions", "instruction-generator", { status: "blocked" as const, steps: [] as [], reason: verified ? "Instruction formatting is not implemented; preserve the verified generator's existing instructions." : "Instructions require verified deterministic output. AI concepts cannot supply measurements or hardware." });
  }
}

export class ConservativeFinalValidationLayer implements FinalValidationLayer {
  validate(project: Parameters<FinalValidationLayer["validate"]>[0]) {
    const schema = validateUniversalProject(project);
    const warningsPresent = project.warnings.length > 0;
    const disclaimerPresent = Boolean(project.verification.disclaimer.trim());
    const finalPlanAllowed = schema.valid && project.verificationStatus === "verified-generator" && project.source.kind === "verified-generator" && !project.warnings.some((warning) => warning.blocking);
    return artifact("final-validation", "final-validator", { finalPlanAllowed, schemaComplete: schema.valid, referencesValid: !schema.errors.some((error) => /reference|unknown/i.test(error)), warningsPresent, disclaimerPresent, errors: [...schema.errors, ...(!finalPlanAllowed && project.source.kind === "concept" ? ["Concept-only projects cannot receive final-plan status."] : [])] });
  }
}
