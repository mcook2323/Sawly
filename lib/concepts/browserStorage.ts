import { isCustomConceptPackage } from "./schema";
import type { CustomConceptPackage, SavedCustomConcept } from "@/types/customConcept";
export const SAVED_CUSTOM_CONCEPTS_KEY = "sawly.custom-concepts.v1";
const workspaceKey = (id: string) => `sawly.concept-workspace:${id}`;
function migratePackage(value: unknown, interrupted = false): CustomConceptPackage | null {
  if (!value || typeof value !== "object") return null;
  const legacy = value as Record<string, unknown>; const concepts = Array.isArray(legacy.concepts) ? legacy.concepts.map((item) => {
    if (!item || typeof item !== "object") return item; const concept = item as Record<string, unknown>;
    const legacyStatus = concept.imageStatus === "pending" ? "queued" : concept.imageStatus === "error" ? "failed" : concept.imageStatus;
    const status = interrupted && legacyStatus === "generating" ? "failed" : legacyStatus;
    return { ...concept, imageStatus: status, imageAttempts: Number.isInteger(concept.imageAttempts) ? concept.imageAttempts : status === "ready" ? 1 : 0, imageError: interrupted && legacyStatus === "generating" ? "Image generation was interrupted. Retry when ready." : typeof concept.imageError === "string" ? concept.imageError : null, imageLastAttemptedAt: typeof concept.imageLastAttemptedAt === "string" ? concept.imageLastAttemptedAt : null };
  }) : legacy.concepts;
  const generationStatus = legacy.generationStatus === "complete" ? (concepts as Array<Record<string, unknown>>)?.every((item) => item.imageStatus === "ready") ? "images-ready" : "text-ready" : legacy.generationStatus === "partial" ? "images-partial" : legacy.generationStatus;
  const migrated = { ...legacy, concepts, generationStatus };
  return isCustomConceptPackage(migrated) ? migrated : null;
}
export function storeConceptWorkspace(value: CustomConceptPackage) { window.localStorage.setItem(workspaceKey(value.id), JSON.stringify(value)); }
export function readConceptWorkspace(id: string) { try { const raw = window.localStorage.getItem(workspaceKey(id)) ?? window.sessionStorage.getItem(workspaceKey(id)); const value: unknown = JSON.parse(raw ?? "null"); const migrated = migratePackage(value, true); if (migrated) storeConceptWorkspace(migrated); return migrated; } catch { return null; } }
export function readSavedCustomConcepts(): SavedCustomConcept[] { try { const value: unknown = JSON.parse(window.localStorage.getItem(SAVED_CUSTOM_CONCEPTS_KEY) ?? "[]"); if (!Array.isArray(value)) return []; return value.flatMap((item) => { if (!item || typeof item !== "object") return []; const saved = item as SavedCustomConcept; const pack = migratePackage(saved.package, true); return saved.schemaVersion === 1 && typeof saved.id === "string" && pack ? [{ ...saved, package: pack }] : []; }); } catch { return []; } }
export function saveCustomConceptPackage(pack: CustomConceptPackage, selectedConceptId: string | null, revisionHistory: string[] = []) { const current = readSavedCustomConcepts(); const existing = current.find((item) => item.package.id === pack.id); const value: SavedCustomConcept = { schemaVersion: 1, id: existing?.id ?? crypto.randomUUID(), package: pack, selectedConceptId, revisionHistory, savedAt: new Date().toISOString() }; window.localStorage.setItem(SAVED_CUSTOM_CONCEPTS_KEY, JSON.stringify([value,...current.filter((item) => item.id !== value.id)].slice(0,20))); return value; }
export function deleteSavedCustomConcept(id: string) { window.localStorage.setItem(SAVED_CUSTOM_CONCEPTS_KEY, JSON.stringify(readSavedCustomConcepts().filter((item) => item.id !== id))); }
export function duplicateSavedCustomConcept(id: string) { const source = readSavedCustomConcepts().find((item) => item.id === id); if (!source) return null; const copy = { ...source, id: crypto.randomUUID(), package: { ...source.package, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, savedAt: new Date().toISOString() }; window.localStorage.setItem(SAVED_CUSTOM_CONCEPTS_KEY, JSON.stringify([copy,...readSavedCustomConcepts()])); return copy; }
