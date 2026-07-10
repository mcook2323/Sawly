import type { WoodMaterial } from "@/calculations/materialCatalog";
import type { CatalogProjectId } from "@/types/project";

export type AIProjectType = "table" | "bench" | "workbench" | "kitchen" | "pergola" | "bookshelf" | "garden-bed" | "unknown";

export interface ParsedDesignRequest {
  raw: string;
  normalized: string;
  projectType: AIProjectType;
  material: WoodMaterial | null;
  dimensions: { length?: number; width?: number; depth?: number; height?: number };
  style: string | null;
  capacity: number | null;
  keywords: string[];
}

export interface TemplateMatch {
  projectId: CatalogProjectId;
  confidence: number;
  reasons: string[];
  prefill: {
    material?: WoodMaterial;
    dimensions: Record<string, number>;
  };
}

export interface DesignResolution {
  request: ParsedDesignRequest;
  match: TemplateMatch | null;
  status: "template-match" | "unavailable";
}

export interface SavedDesignRequest {
  id: string;
  prompt: string;
  parsed: ParsedDesignRequest;
  savedAt: string;
}

export interface DesignProvider {
  readonly id: string;
  resolve(prompt: string): Promise<DesignResolution>;
}
