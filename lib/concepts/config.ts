export function isConceptProviderConfigured(apiKey: string | undefined) { return typeof apiKey === "string" && apiKey.trim().length > 0; }
export const DEFAULT_OPENAI_TEXT_MODEL = "gpt-5.6-luna";
const invalidLegacyModels = new Set(["gpt-5.4-nano"]);
export function resolveOpenAITextModel(value: string | undefined) { const model = value?.trim(); return !model || invalidLegacyModels.has(model) ? DEFAULT_OPENAI_TEXT_MODEL : model; }
