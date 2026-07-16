import type { CustomConceptPackage } from "@/types/customConcept";

interface GenerateCustomConceptInput { prompt: string; profile: Record<string, unknown>; sessionId: string; }
interface GenerateCustomConceptDependencies { request?: typeof fetch; store: (value: CustomConceptPackage) => void; navigate: (href: string) => void; }

export async function requestCustomConcepts(input: GenerateCustomConceptInput, dependencies: GenerateCustomConceptDependencies) {
  const response = await (dependencies.request ?? fetch)("/api/design/concepts", { method: "POST", headers: { "Content-Type": "application/json", "X-Sawly-Session": input.sessionId }, body: JSON.stringify({ prompt: input.prompt, profile: input.profile }) });
  const value = await response.json() as { package?: CustomConceptPackage; error?: string };
  if (!response.ok || !value.package) throw new Error(value.error || "Custom concept generation is temporarily unavailable.");
  dependencies.store(value.package);
  dependencies.navigate(`/design/concept/${value.package.id}`);
  return value.package;
}
