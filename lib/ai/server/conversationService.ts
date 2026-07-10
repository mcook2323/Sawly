import { randomUUID } from "node:crypto";
import { createOpenAIProvider } from "@/lib/ai/server/providerFactory";
import { resolveWithProvider } from "@/lib/ai/server/providerCore";
import type { ConversationRequest } from "@/lib/ai/server/requestValidation";

export async function runConversation(request: ConversationRequest) {
  return resolveWithProvider(randomUUID(), request, createOpenAIProvider());
}
