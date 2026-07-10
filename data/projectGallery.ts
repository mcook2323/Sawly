export type GalleryView = "lifestyle" | "front" | "side" | "blueprint";

export interface ProjectGalleryItem {
  id: string;
  label: string;
  description: string;
  view: GalleryView;
}

export const OUTDOOR_TABLE_GALLERY_ITEMS: ProjectGalleryItem[] = [
  {
    id: "lifestyle",
    label: "Lifestyle view",
    description: "See the table staged in a warm, relaxed outdoor setting.",
    view: "lifestyle",
  },
  {
    id: "front",
    label: "Front angle",
    description: "Review the full length, height, leg placement, and apron line.",
    view: "front",
  },
  {
    id: "side",
    label: "Side angle",
    description: "Check the table width and side-frame proportions.",
    view: "side",
  },
  {
    id: "blueprint",
    label: "Blueprint view",
    description: "Inspect a clean technical view with live measurements.",
    view: "blueprint",
  },
];
