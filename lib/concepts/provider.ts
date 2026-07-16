import "server-only";
import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import { CUSTOM_CONCEPT_SCHEMA, validateConceptProviderOutput } from "@/lib/concepts/schema";
import type { CustomConceptPackage, CustomConceptProvider, CustomConceptRequest } from "@/types/customConcept";
import { isConceptProviderConfigured } from "@/lib/concepts/config";

const INSTRUCTIONS = `Create exactly three meaningfully different high-level DIY design concepts. Concepts are not certified construction plans. Do not provide structural engineering, electrical, plumbing, gas, permit, code-compliance, load-rating, exact cut-list, or hidden-dimension claims. State assumptions and unresolved questions. Only set a verified template candidate when the geometry is plainly a freestanding Outdoor Table or Outdoor Bench. Maintain realistic proportions and make concepts differ in layout, cost, style, or complexity.`;

export class OpenAICustomConceptProvider implements CustomConceptProvider {
  constructor(private client: OpenAI, private model: string, private timeoutMs = 15_000) {}
  async generate(request: CustomConceptRequest): Promise<CustomConceptPackage> {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.client.responses.create({ model: this.model, instructions: INSTRUCTIONS, input: JSON.stringify({ prompt: request.prompt, profile: request.profile, revision: request.revision, existingConcept: request.existingConcept }), max_output_tokens: 3000, text: { format: { type: "json_schema", name: "sawly_custom_concepts", strict: true, schema: CUSTOM_CONCEPT_SCHEMA } } }, { signal: controller.signal });
      const concepts = validateConceptProviderOutput(JSON.parse(response.output_text)); if (!concepts) throw new Error("invalid-concept-response");
      return { schemaVersion: 1, id: randomUUID(), originalPrompt: request.prompt, createdAt: new Date().toISOString(), generationStatus: "complete", concepts: concepts.map((concept) => ({ ...concept, imageStatus: "pending", imageUrl: null, verificationStatus: "ai-concept-not-build-verified" })) };
    } finally { clearTimeout(timer); }
  }
}

export function createConceptProvider() { return isConceptProviderConfigured(process.env.OPENAI_API_KEY) ? new OpenAICustomConceptProvider(new OpenAI({ apiKey: process.env.OPENAI_API_KEY }), process.env.OPENAI_MODEL || "gpt-5.4-nano") : null; }
