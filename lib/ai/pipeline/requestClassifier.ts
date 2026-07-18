import type { ProjectCategory, ProjectRiskTier } from "../../../types/universalProject";
import type { RequestClassification, RequestClassifier } from "../../../types/aiProjectPipeline";
import { artifact, validateClassification } from "./validation";

const categoryRules: Array<{ category: ProjectCategory; type: string; pattern: RegExp }> = [
  { category: "Play Structure", type: "treehouse", pattern: /\btree\s?house\b/ }, { category: "Play Structure", type: "playhouse", pattern: /\bplay\s?house\b/ }, { category: "Play Structure", type: "climbing-gym", pattern: /\b(?:toddler |indoor )?(?:climbing gym|play structure)\b/ },
  { category: "Outdoor Structure", type: "pergola", pattern: /\bpergola\b/ }, { category: "Outdoor Structure", type: "deck", pattern: /\bdeck\b/ }, { category: "Outdoor Structure", type: "shed", pattern: /\bshed\b/ }, { category: "Outdoor Structure", type: "chicken-coop", pattern: /\bchicken coop\b/ }, { category: "Outdoor Structure", type: "outdoor-kitchen", pattern: /\boutdoor kitchen\b/ },
  { category: "Cabinetry", type: "built-in", pattern: /\bbuilt[- ]?in\b/ }, { category: "Cabinetry", type: "cabinet", pattern: /\bcabinet(?:ry|s)?\b/ },
  { category: "Workshop", type: "workbench", pattern: /\bwork\s?bench\b/ }, { category: "Landscape", type: "garden-project", pattern: /\b(?:garden bed|planter|trellis)\b/ },
  { category: "Storage", type: "shelving", pattern: /\b(?:bookshel(?:f|ves)|shelving|storage)\b/ }, { category: "Furniture", type: "bench", pattern: /\bbench\b/ }, { category: "Furniture", type: "table", pattern: /\btable\b/ }, { category: "Furniture", type: "tv-stand", pattern: /\b(?:tv|media) stand\b/ },
  { category: "Architectural", type: "architectural-woodwork", pattern: /\b(?:stairs?|railing|wall panel|trim|millwork)\b/ },
];
const codeSensitive = /\b(?:pergola|deck|shed|tree\s?house|play\s?house|climbing gym|outdoor kitchen)\b/;
const moderatelyStructural = /\b(?:chicken coop|built[- ]?in|cabinetry|garage cabinets|work\s?bench)\b/;

export class DeterministicRequestClassifier implements RequestClassifier {
  classify(prompt: string) {
    const normalizedPrompt = prompt.trim().toLowerCase().replace(/\s+/g, " ");
    if (!normalizedPrompt) throw new TypeError("Project request cannot be empty.");
    const match = categoryRules.find((rule) => rule.pattern.test(normalizedPrompt));
    const initialRiskTier = (codeSensitive.test(normalizedPrompt) ? "code-sensitive" : moderatelyStructural.test(normalizedPrompt) ? "moderately-structural" : "nonstructural") as ProjectRiskTier;
    const intent: RequestClassification["intent"] = /\b(?:repair|fix|restore)\b/.test(normalizedPrompt) ? "repair" : /\b(?:change|modify|resize|update)\b/.test(normalizedPrompt) ? "modify-existing" : /\b(?:ideas?|explore|inspiration)\b/.test(normalizedPrompt) ? "explore" : "design-concept";
    return validateClassification(artifact("request-classification", "request-classifier", { normalizedPrompt, category: (match?.category ?? "Furniture") as ProjectCategory, projectType: match?.type ?? "custom-wood-project", initialRiskTier, intent, keywords: [...new Set(normalizedPrompt.split(/[^a-z0-9-]+/).filter((word) => word.length > 2))] }));
  }
}
