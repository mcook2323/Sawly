import "server-only";
import OpenAI from "openai";
import { CategorizedConceptError, type ConceptErrorCategory } from "@/lib/concepts/errors";

export interface CategorizedProviderFailure { category: ConceptErrorCategory; providerCode?: string; }

const billingCodes = new Set(["insufficient_quota", "billing_hard_limit_reached", "billing_not_active"]);
const modelCodes = new Set(["model_not_found", "unsupported_model", "model_unavailable"]);
const schemaCodes = new Set(["invalid_json_schema", "invalid_schema"]);

export function categorizeConceptProviderError(error: unknown): CategorizedProviderFailure {
  if (error instanceof CategorizedConceptError) return { category: error.category };
  if (error instanceof OpenAI.AuthenticationError) return { category: "authentication_failed", providerCode: safeCode(error.code) };
  if (error instanceof OpenAI.APIConnectionTimeoutError || (error instanceof Error && error.name === "AbortError")) return { category: "provider_timeout" };
  if (error instanceof OpenAI.APIConnectionError) return { category: "network_failure", providerCode: safeCode(error.code) };
  if (error instanceof Error && error.cause instanceof TypeError) return { category: "network_failure" };
  if (error instanceof OpenAI.APIError) {
    const code = safeCode(error.code);
    if (code && billingCodes.has(code)) return { category: "billing_or_quota_exceeded", providerCode: code };
    if (code && modelCodes.has(code)) return { category: "model_unavailable", providerCode: code };
    if (code && schemaCodes.has(code)) return { category: "schema_validation_failed", providerCode: code };
    if (error.status === 429) return { category: "provider_rate_limited", providerCode: code };
    if (error.status === 401) return { category: "authentication_failed", providerCode: code };
    if (error.status === 403 || error.status === 404) return { category: "model_unavailable", providerCode: code };
    return { category: "unknown_provider_failure", providerCode: code };
  }
  return { category: "unknown_provider_failure" };
}

function safeCode(value: string | null | undefined) { return value && /^[a-z0-9_-]{1,80}$/i.test(value) ? value : undefined; }
