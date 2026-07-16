import type { CustomConceptPackage } from "@/types/customConcept";
import type { CustomConceptOption } from "@/types/customConcept";
import { conceptError, type SafeConceptError } from "./errors";

interface GenerateCustomConceptInput { prompt: string; profile: Record<string, unknown>; sessionId: string; idempotencyKey: string; signal?: AbortSignal; }
interface GenerateCustomConceptDependencies { request?: typeof fetch; store: (value: CustomConceptPackage) => void; navigate: (href: string) => void; }

export async function requestCustomConcepts(input: GenerateCustomConceptInput, dependencies: GenerateCustomConceptDependencies) {
  let response: Response;
  try { response = await (dependencies.request ?? fetch)("/api/design/concepts", { method: "POST", headers: { "Content-Type": "application/json", "X-Sawly-Session": input.sessionId, "X-Idempotency-Key": input.idempotencyKey }, body: JSON.stringify({ prompt: input.prompt, profile: input.profile }), signal: input.signal }); }
  catch (error) { if (error instanceof DOMException && error.name === "AbortError") throw error; throw new Error(conceptError("network_failure").message); }
  let value: { package?: CustomConceptPackage; error?: string | SafeConceptError };
  try { value = await response.json() as typeof value; } catch { throw new Error(conceptError("malformed_provider_response").message); }
  const message = typeof value.error === "string" ? value.error : value.error?.message;
  if (!response.ok || !value.package) throw new Error(message || "Temporary network/provider problem. Try again.");
  dependencies.store(value.package);
  dependencies.navigate(`/design/concept/${value.package.id}`);
  return value.package;
}

export async function requestConceptImage(input: { packageId: string; concept: CustomConceptOption; sessionId: string; idempotencyKey: string; signal?: AbortSignal }, request: typeof fetch = fetch) {
  const response = await request("/api/design/concepts/image", { method: "POST", headers: { "Content-Type": "application/json", "X-Sawly-Session": input.sessionId, "X-Idempotency-Key": input.idempotencyKey }, body: JSON.stringify({ packageId: input.packageId, concept: input.concept }), signal: input.signal });
  const value = await response.json() as { imageUrl?: string; error?: string; retryAfterSeconds?: number };
  if (!response.ok || !value.imageUrl) throw new Error(value.error || "Image generation failed.");
  return value.imageUrl;
}
