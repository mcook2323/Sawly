import "server-only";
import OpenAI from "openai";
import { OpenAIConversationProvider } from "@/lib/ai/server/openAIProvider";
import { resolveOpenAITextModel } from "@/lib/concepts/config";
import { createPaidProvider } from "@/lib/ai/mode";

export function createOpenAIProvider() {
  const key = process.env.OPENAI_API_KEY;
  return createPaidProvider(process.env.SAWLY_AI_MODE, Boolean(key), () => new OpenAIConversationProvider(new OpenAI({ apiKey: key }), resolveOpenAITextModel(process.env.OPENAI_MODEL)));
}
