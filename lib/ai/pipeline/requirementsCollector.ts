import type { AIPlanningProfile, PlannerQuestion, PlannerQuestionId } from "../../../types/aiProjectDesigner";
import type { RequirementsCollector } from "../../../types/aiProjectPipeline";
import type { UniversalDimensions } from "../../../types/universalProject";
import { artifact, validateClassification, validateRequirementsProfile } from "./validation";

const styles = ["modern", "farmhouse", "craftsman", "minimalist", "minimal", "rustic", "contemporary", "traditional", "industrial"];
const materials = ["cedar", "pine", "oak", "maple", "walnut", "plywood", "pressure-treated", "treated lumber", "redwood"];
const inch = (value: number) => ({ value, unit: "in" as const });

function extractDimensions(text: string): UniversalDimensions {
  const match = text.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)(?:\s*(?:x|×|by)\s*(\d+(?:\.\d+)?))?\s*(ft|feet|foot|'|in|inch|inches|")?/);
  if (!match) return {};
  const values = [Number(match[1]), Number(match[2]), match[3] ? Number(match[3]) : undefined];
  const explicitFeet = /ft|feet|foot|'/.test(match[4] ?? "");
  const inferredFeet = !match[4] && values.slice(0, 2).every((value) => value !== undefined && value <= 30);
  const factor = explicitFeet || inferredFeet ? 12 : 1;
  return { length: inch(values[0]! * factor), width: inch(values[1]! * factor), ...(values[2] ? { height: inch(values[2] * factor) } : {}) };
}

function questionFor(id: PlannerQuestionId, profile: AIPlanningProfile): PlannerQuestion {
  if (id === "dimensions") return { id, prompt: "What overall size are you thinking?", helpText: "Approximate dimensions are fine—for example, 14 × 18 ft.", type: "text" };
  if (id === "environment") return { id, prompt: "Will this project be indoors or outdoors?", type: "choice", options: [{ label: "Indoors", value: "indoor" }, { label: "Outdoors", value: "outdoor" }, { label: "Not sure yet", value: "either" }] };
  if (id === "attachment") return { id, prompt: profile.projectType === "pergola" ? "Freestanding or attached?" : "How will it be installed?", type: "choice", options: [{ label: "Freestanding", value: "freestanding" }, { label: "Attached to a structure", value: "structure-attached" }, { label: "Wall attached", value: "wall-attached" }, { label: "Ground anchored", value: "ground-anchored" }] };
  if (id === "roof") return { id, prompt: "Would you like a roof or overhead covering?", type: "choice", options: [{ label: "Open top", value: "open" }, { label: "Slatted shade", value: "slatted" }, { label: "Solid roof", value: "solid" }, { label: "Not sure", value: "unspecified" }] };
  if (id === "intendedUse") return { id, prompt: "How do you want to use it?", helpText: "A short answer is enough.", type: "text" };
  if (id === "audience") return { id, prompt: "Who will primarily use it?", type: "choice", options: [{ label: "Young children", value: "child" }, { label: "Adults", value: "adult" }, { label: "Everyone", value: "general" }] };
  if (id === "material") return { id, prompt: "Do you have a wood or material preference?", type: "text", helpText: "For example: cedar, plywood, or no preference." };
  return { id: "style", prompt: "Which design style feels right?", type: "choice", options: ["Modern", "Farmhouse", "Craftsman", "Minimalist", "Rustic", "Contemporary"].map((label) => ({ label, value: label.toLowerCase() })) };
}

export class DeterministicRequirementsCollector implements RequirementsCollector {
  collect({ prompt, classification: rawClassification, answers }: Parameters<RequirementsCollector["collect"]>[0]) {
    const classification = validateClassification(rawClassification).data;
    if (prompt.trim().toLowerCase().replace(/\s+/g, " ") !== classification.normalizedPrompt) throw new TypeError("Requirements request does not match its classification artifact.");
    const combined = `${classification.normalizedPrompt} ${Object.values(answers).join(" ")}`.toLowerCase();
    const dimensions = extractDimensions(answers.dimensions ?? classification.normalizedPrompt);
    const environment = (answers.environment as AIPlanningProfile["environment"]) ?? (/\b(?:outdoor|backyard|patio|garden|garage exterior)\b/.test(classification.normalizedPrompt) || ["Outdoor Structure", "Landscape"].includes(classification.category) ? "outdoor" : /\b(?:indoor|living room|bedroom|mudroom)\b/.test(classification.normalizedPrompt) ? "indoor" : null);
    const material = materials.find((item) => combined.includes(item));
    const style = styles.find((item) => combined.includes(item))?.replace("minimal", "minimalist") ?? null;
    const intendedUse = answers.intendedUse ?? (/dining/.test(classification.normalizedPrompt) ? "Dining" : /storage|cabinet|bookshel|tv stand|media stand/.test(classification.normalizedPrompt) ? "Storage" : /play|climb|treehouse/.test(classification.normalizedPrompt) ? "Play" : classification.projectType === "pergola" ? "Shade and outdoor living" : classification.projectType === "chicken-coop" ? "Poultry shelter" : classification.projectType === "outdoor-kitchen" ? "Outdoor cooking and entertaining" : classification.projectType === "workbench" ? "Workshop tasks" : null);
    const attachment = (answers.attachment as AIPlanningProfile["attachment"]) ?? (/freestanding/.test(classification.normalizedPrompt) ? "freestanding" : /attached|built[- ]?in/.test(classification.normalizedPrompt) ? "structure-attached" : null);
    const audience = (answers.audience as AIPlanningProfile["audience"]) ?? (/toddler|child|playhouse|treehouse/.test(classification.normalizedPrompt) ? "child" : null);
    const missingFields: PlannerQuestionId[] = [];
    if (!dimensions.length) missingFields.push("dimensions");
    if (!environment) missingFields.push("environment");
    if (!intendedUse) missingFields.push("intendedUse");
    if (["pergola", "deck", "shed", "built-in", "cabinet", "playhouse", "treehouse"].includes(classification.projectType) && !attachment) missingFields.push("attachment");
    if (["pergola", "outdoor-kitchen", "chicken-coop"].includes(classification.projectType) && !answers.roof) missingFields.push("roof");
    if (classification.category === "Play Structure" && !audience) missingFields.push("audience");
    if (!material && !answers.material) missingFields.push("material");
    if (!style && !answers.style) missingFields.push("style");
    const profile: AIPlanningProfile = { normalizedPrompt: classification.normalizedPrompt, projectType: classification.projectType, category: classification.category, riskTier: classification.initialRiskTier, environment, intendedUse, dimensions, style: (answers.style ?? style) || null, materials: material ? [material] : answers.material && !/no preference/i.test(answers.material) ? [answers.material] : [], attachment, roof: answers.roof ?? null, audience, keywords: classification.keywords, missingFields };
    const profileArtifact = validateRequirementsProfile(artifact("requirements-profile", "requirements-collector", profile));
    return { profile: profileArtifact, nextQuestion: missingFields[0] ? questionFor(missingFields[0], profile) : null, complete: missingFields.length === 0 };
  }
}
