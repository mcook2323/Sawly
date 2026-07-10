import type { AIProjectType, ParsedDesignRequest } from "@/types/ai";
import type { WoodMaterial } from "@/calculations/materialCatalog";

const PROJECT_TERMS: Array<[AIProjectType, RegExp]> = [
  ["workbench", /\bwork\s?bench\b/], ["garden-bed", /\b(?:raised )?garden bed\b/],
  ["bookshelf", /\b(?:bookcase|bookshel(?:f|ves))\b/], ["kitchen", /\b(?:outdoor )?kitchen\b/],
  ["pergola", /\bpergola\b/], ["bench", /\bbench\b/], ["table", /\btable\b/],
];
const MATERIAL_TERMS: Array<[WoodMaterial, RegExp]> = [
  ["cedar", /\bcedar\b/], ["treated", /\b(?:pressure[- ]treated|treated lumber)\b/], ["pine", /\bpine\b/],
];
const STYLES = ["modern", "rustic", "minimal", "farmhouse", "traditional", "industrial", "built-in"];
const STOP_WORDS = new Set(["a", "an", "and", "for", "the", "with", "of", "to", "inch", "inches", "in", "ft", "feet", "foot"]);

export function parseDesignRequest(raw: string): ParsedDesignRequest {
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, " ");
  const projectType = PROJECT_TERMS.find(([, pattern]) => pattern.test(normalized))?.[0] ?? "unknown";
  const material = MATERIAL_TERMS.find(([, pattern]) => pattern.test(normalized))?.[0] ?? null;
  const style = STYLES.find((item) => new RegExp(`\\b${item}\\b`).test(normalized)) ?? null;
  const capacityMatch = normalized.match(/\b(?:for|seats?|seat)\s+(\d{1,2})\b/);
  const capacity = capacityMatch ? Number(capacityMatch[1]) : null;
  const dimensions: ParsedDesignRequest["dimensions"] = {};
  const dimensionPattern = /(\d+(?:\.\d+)?)\s*(?:inches|inch|in|\")\s*(?:long|length|wide|width|deep|depth|high|height)?/g;
  const matches = [...normalized.matchAll(dimensionPattern)];
  for (const match of matches) {
    const value = Number(match[1]);
    const descriptor = match[0];
    if (/wide|width/.test(descriptor)) dimensions.width = value;
    else if (/deep|depth/.test(descriptor)) dimensions.depth = value;
    else if (/high|height/.test(descriptor)) dimensions.height = value;
    else if (dimensions.length === undefined) dimensions.length = value;
  }
  const keywords = [...new Set(normalized.replace(/[^a-z0-9-]/g, " ").split(/\s+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word) && !/^\d/.test(word)))];
  return { raw: raw.trim(), normalized, projectType, material, dimensions, style, capacity, keywords };
}
