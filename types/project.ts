export type CatalogCategory = "Outdoor" | "Indoor" | "Garage" | "Garden" | "Storage";
export type CatalogProjectId =
  | "outdoor-table"
  | "outdoor-bench"
  | "raised-garden-bed"
  | "garage-workbench"
  | "outdoor-sectional"
  | "console-table";

export type ProjectImageRole =
  | "lifestyleHero"
  | "alternateLifestyle"
  | "frontView"
  | "sideView"
  | "blueprintPreview"
  | "cardThumbnail";

export interface ProjectImageAsset {
  src: string;
  alt: string;
  placeholder: boolean;
  replacementLabel: string;
}

export type ProjectImages = Record<ProjectImageRole, ProjectImageAsset>;

export interface ProjectCatalogItem {
  id: CatalogProjectId;
  name: string;
  description: string;
  category: CatalogCategory;
  cost: string;
  buildTime: string;
  difficulty: string;
  available: boolean;
  href: string;
  images: ProjectImages;
}
