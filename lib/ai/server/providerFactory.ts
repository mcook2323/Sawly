import "server-only";
import OpenAI from "openai";
import { OpenAIConversationProvider } from "@/lib/ai/server/openAIProvider";

export function createOpenAIProvider() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAIConversationProvider(new OpenAI({ apiKey: process.env.OPENAI_API_KEY }), process.env.OPENAI_MODEL || "gpt-5.4-nano");
}
