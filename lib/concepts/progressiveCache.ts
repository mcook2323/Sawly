import type { CustomConceptPackage } from "@/types/customConcept";

interface Cached<T> { value: T; expiresAt: number; }

export class ProgressiveGenerationCache {
  private concepts = new Map<string, Cached<CustomConceptPackage>>();
  private images = new Map<string, Cached<string>>();
  private inFlightConcepts = new Map<string, Promise<CustomConceptPackage>>();
  private inFlightImages = new Map<string, Promise<string>>();

  constructor(private ttlMs = Number(process.env.SAWLY_CONCEPT_CACHE_TTL_MS || 300_000)) {}

  getConcept(key: string, now = Date.now()) { const hit = this.concepts.get(key); if (!hit || hit.expiresAt <= now) { this.concepts.delete(key); return null; } return hit.value; }
  getImage(key: string, now = Date.now()) { const hit = this.images.get(key); if (!hit || hit.expiresAt <= now) { this.images.delete(key); return null; } return hit.value; }
  hasConceptInFlight(key: string) { return this.inFlightConcepts.has(key); }
  hasImageInFlight(key: string) { return this.inFlightImages.has(key); }

  async concept(key: string, job: () => Promise<CustomConceptPackage>) {
    const cached = this.getConcept(key); if (cached) return { value: cached, reused: true };
    const existing = this.inFlightConcepts.get(key); if (existing) return { value: await existing, reused: true };
    const promise = job(); this.inFlightConcepts.set(key, promise);
    try { const value = await promise; this.concepts.set(key, { value, expiresAt: Date.now() + this.ttlMs }); return { value, reused: false }; }
    finally { this.inFlightConcepts.delete(key); }
  }

  async image(key: string, job: () => Promise<string>) {
    const cached = this.getImage(key); if (cached) return { value: cached, reused: true };
    const existing = this.inFlightImages.get(key); if (existing) return { value: await existing, reused: true };
    const promise = job(); this.inFlightImages.set(key, promise);
    try { const value = await promise; this.images.set(key, { value, expiresAt: Date.now() + this.ttlMs }); return { value, reused: false }; }
    finally { this.inFlightImages.delete(key); }
  }
}

export const progressiveGenerationCache = new ProgressiveGenerationCache();
