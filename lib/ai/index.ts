import { matchProjectTemplate } from "@/lib/ai/matcher";
import { parseDesignRequest } from "@/lib/ai/parser";
import { getNextQuestion } from "@/lib/ai/conversation";
import { scoreDesignProfile } from "@/lib/ai/guidedMatcher";
import type { ConversationProvider, DesignAnswers, DesignProfile, DesignProvider, DesignResolution } from "@/types/ai";

export function resolveDesignRequest(prompt: string): DesignResolution {
  const request = parseDesignRequest(prompt);
  const match = matchProjectTemplate(request);
  return { request, match, status: match ? "template-match" : "unavailable" };
}

// Stable boundary for a future server-side model provider. The UI consumes the
// resolution contract rather than depending on parsing or model implementation.
export class DeterministicDesignProvider implements DesignProvider {
  readonly id = "deterministic-v1";
  async resolve(prompt: string) { return resolveDesignRequest(prompt); }
}

// Future LLM providers can implement this contract and return the same typed
// questions and resolution consumed by the conversational frontend.
export class DeterministicConversationProvider implements ConversationProvider {
  readonly id = "deterministic-conversation-v1";
  getNextQuestion(profile: DesignProfile, answers: DesignAnswers) { return getNextQuestion(profile, answers); }
  async resolveProfile(profile: DesignProfile) { return scoreDesignProfile(profile); }
}
