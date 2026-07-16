export type ConceptErrorCategory =
  | "missing_configuration"
  | "authentication_failed"
  | "billing_or_quota_exceeded"
  | "model_unavailable"
  | "provider_rate_limited"
  | "local_rate_limited"
  | "provider_timeout"
  | "malformed_provider_response"
  | "schema_validation_failed"
  | "network_failure"
  | "unknown_provider_failure";

export interface SafeConceptError { category: ConceptErrorCategory; message: string; }

const messages: Record<ConceptErrorCategory, string> = {
  missing_configuration: "Configuration missing. Add a valid OpenAI API key and text model.",
  authentication_failed: "OpenAI authentication failed. Check the configured API key.",
  billing_or_quota_exceeded: "OpenAI billing or quota issue. Check the project billing and usage limits.",
  model_unavailable: "The configured AI model is unavailable. Check OPENAI_MODEL.",
  provider_rate_limited: "AI usage limit reached. Try again shortly.",
  local_rate_limited: "Sawly’s AI usage limit has been reached. Try again later.",
  provider_timeout: "Generation took too long. Try again.",
  malformed_provider_response: "Generated response could not be validated. Try again.",
  schema_validation_failed: "Generated response could not be validated. Try again.",
  network_failure: "Temporary network/provider problem. Try again.",
  unknown_provider_failure: "Temporary network/provider problem. Try again.",
};

export function conceptError(category: ConceptErrorCategory): SafeConceptError { return { category, message: messages[category] }; }
export function conceptErrorStatus(category: ConceptErrorCategory) {
  if (category === "local_rate_limited" || category === "provider_rate_limited") return 429;
  if (category === "billing_or_quota_exceeded") return 402;
  if (category === "provider_timeout") return 504;
  if (category === "authentication_failed" || category === "malformed_provider_response" || category === "schema_validation_failed") return 502;
  return 503;
}

export class CategorizedConceptError extends Error {
  constructor(public readonly category: ConceptErrorCategory) { super(category); this.name = "CategorizedConceptError"; }
}
