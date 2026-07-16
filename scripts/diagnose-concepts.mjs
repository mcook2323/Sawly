import OpenAI from "openai";

const checkOnly = process.argv.includes("--check-only");
const rawTextModel = process.env.OPENAI_MODEL?.trim() || null;
const effectiveTextModel = !rawTextModel || rawTextModel === "gpt-5.4-nano" ? "gpt-5.6-luna" : rawTextModel;
const configuration = {
  OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY?.trim()),
  OPENAI_MODEL: rawTextModel,
  EFFECTIVE_OPENAI_MODEL: effectiveTextModel,
  LEGACY_MODEL_MIGRATED: rawTextModel === "gpt-5.4-nano",
  OPENAI_IMAGE_MODEL: process.env.OPENAI_IMAGE_MODEL?.trim() || null,
  OPENAI_CONCEPT_TIMEOUT_MS: process.env.OPENAI_CONCEPT_TIMEOUT_MS?.trim() || null,
  SAWLY_DAILY_CONCEPT_LIMIT: process.env.SAWLY_DAILY_CONCEPT_LIMIT?.trim() || null,
  SAWLY_DAILY_IMAGE_LIMIT: process.env.SAWLY_DAILY_IMAGE_LIMIT?.trim() || null,
};

console.log(JSON.stringify({ mode: checkOnly ? "configuration-only" : "live-minimal-request", configuration }, null, 2));
if (checkOnly) process.exit(0);
if (!configuration.OPENAI_API_KEY || !configuration.EFFECTIVE_OPENAI_MODEL) { console.error(JSON.stringify({ success: false, category: "missing_configuration" })); process.exit(1); }

const controller = new AbortController();
const timeoutMs = Number(configuration.OPENAI_CONCEPT_TIMEOUT_MS || 45_000);
const timer = setTimeout(() => controller.abort(), timeoutMs);
try {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({ model: configuration.EFFECTIVE_OPENAI_MODEL, input: "Return a successful diagnostic result.", max_output_tokens: 100, text: { format: { type: "json_schema", name: "sawly_diagnostic", strict: true, schema: { type: "object", additionalProperties: false, required: ["ok"], properties: { ok: { type: "boolean", enum: [true] } } } } } }, { signal: controller.signal });
  const parsed = JSON.parse(response.output_text);
  if (parsed?.ok !== true) throw Object.assign(new Error("schema"), { diagnosticCategory: "schema_validation_failed" });
  console.log(JSON.stringify({ success: true, category: null, model: configuration.EFFECTIVE_OPENAI_MODEL }));
} catch (error) {
  const code = typeof error?.code === "string" ? error.code : undefined;
  const status = typeof error?.status === "number" ? error.status : undefined;
  const causeCode = typeof error?.cause?.code === "string" && /^[A-Z0-9_-]{1,80}$/i.test(error.cause.code) ? error.cause.code : undefined;
  const causeName = typeof error?.cause?.name === "string" ? error.cause.name : undefined;
  const category = error?.diagnosticCategory || (status === 401 ? "authentication_failed" : ["insufficient_quota", "billing_hard_limit_reached"].includes(code) ? "billing_or_quota_exceeded" : code === "model_not_found" || status === 404 || status === 403 ? "model_unavailable" : status === 429 ? "provider_rate_limited" : error?.name === "AbortError" || error?.name === "APIConnectionTimeoutError" ? "provider_timeout" : error?.name === "APIConnectionError" || causeCode || causeName === "TypeError" ? "network_failure" : error instanceof SyntaxError ? "malformed_provider_response" : "unknown_provider_failure");
  console.error(JSON.stringify({ success: false, category, providerCode: code, httpStatus: status, safeErrorType: typeof error?.name === "string" ? error.name : undefined, safeCauseType: causeName, safeCauseCode: causeCode }));
  process.exit(1);
} finally { clearTimeout(timer); }
