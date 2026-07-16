export function isConceptProviderConfigured(apiKey: string | undefined) { return typeof apiKey === "string" && apiKey.trim().length > 0; }
