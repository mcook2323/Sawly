import { matchProjectTemplate } from "@/lib/ai/matcher";
import { parseDesignRequest } from "@/lib/ai/parser";
import type { DesignProvider, DesignResolution } from "@/types/ai";

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
