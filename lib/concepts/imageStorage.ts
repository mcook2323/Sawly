import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface ConceptImageStorage { save(id: string, bytes: Uint8Array): Promise<string>; }
export class LocalConceptImageStorage implements ConceptImageStorage {
  async save(id: string, bytes: Uint8Array) { const directory = path.join(process.cwd(), "public", "generated", "concepts"); await mkdir(directory, { recursive: true }); const name = `${id}.png`; await writeFile(path.join(directory, name), bytes); return `/generated/concepts/${name}`; }
}
export function createConceptImageStorage(): ConceptImageStorage { return new LocalConceptImageStorage(); }
