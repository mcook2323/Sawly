import "server-only";
import OpenAI from "openai";
import { OPENAI_DESIGN_SCHEMA, validateOpenAIDesignOutput, type OpenAIDesignOutput } from "@/lib/ai/server/schema";
import { getNextQuestion } from "@/lib/ai/conversation";
import { scoreDesignProfile } from "@/lib/ai/guidedMatcher";
import type { ConversationProvider, DesignAnswers, DesignProfile } from "@/types/ai";

const INSTRUCTIONS = `You are Sawly's project discovery assistant. Sawly has verified configurable generators only for Outdoor Table and Outdoor Bench. Extract requirements and ask one useful clarification question. Never create construction calculations, cut lists, load ratings, structural certification, engineering claims, electrical/plumbing/gas plans, code-compliance assurances, or claim unsupported projects are build-ready. Template recommendations are discovery suggestions only; deterministic Sawly generators are the source of truth.`;

export class OpenAIConversationProvider implements ConversationProvider {
  readonly id = "openai-responses-v1";
  constructor(private client: OpenAI, private model: string, private timeoutMs = 8_000) {}
  getNextQuestion(profile: DesignProfile, answers: DesignAnswers) { return getNextQuestion(profile, answers); }
  async resolveProfile(profile: DesignProfile) { return scoreDesignProfile(profile); }
  async analyze(prompt: string, profile: DesignProfile, answers: DesignAnswers): Promise<OpenAIDesignOutput> {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.client.responses.create({ model: this.model, instructions: INSTRUCTIONS, input: JSON.stringify({ prompt, profile, answers }), max_output_tokens: 900, text: { format: { type: "json_schema", name: "sawly_design_conversation", strict: true, schema: OPENAI_DESIGN_SCHEMA } } }, { signal: controller.signal });
      const parsed = validateOpenAIDesignOutput(JSON.parse(response.output_text));
      if (!parsed) throw new Error("invalid-structured-response");
      return parsed;
    } finally { clearTimeout(timer); }
  }
}
