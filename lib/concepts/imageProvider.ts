import "server-only";
import OpenAI from "openai";
import type { CustomConceptOption } from "@/types/customConcept";
import { buildConceptImagePrompt } from "@/lib/concepts/imagePrompt";
import { createPaidProvider } from "@/lib/ai/mode";

export interface ConceptImageProvider { generate(concept: CustomConceptOption): Promise<Uint8Array>; }
export class OpenAIConceptImageProvider implements ConceptImageProvider {
  constructor(private client: OpenAI, private model: string, private timeoutMs = 30_000) {}
  async generate(concept: CustomConceptOption) { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.timeoutMs); try { const response = await this.client.images.generate({ model: this.model, prompt: buildConceptImagePrompt(concept), n: 1, size: "1536x1024", quality: "medium" }, { signal: controller.signal }); const encoded = response.data?.[0]?.b64_json; if (!encoded) throw new Error("image-generation-failed"); return Uint8Array.from(Buffer.from(encoded, "base64")); } finally { clearTimeout(timer); } }
}
export function createConceptImageProvider() { const key = process.env.OPENAI_API_KEY; return createPaidProvider(process.env.SAWLY_AI_MODE, Boolean(key), () => new OpenAIConceptImageProvider(new OpenAI({ apiKey: key }), process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini")); }
