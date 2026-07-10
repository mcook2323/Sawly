import type { ProjectCatalogItem, ProjectImages } from "@/types/project";

function projectImages(folder: string, name: string): ProjectImages {
  const asset = (file: string, role: string) => ({
    src: `/projects/${folder}/${file}.svg`,
    alt: `${name} ${role} placeholder`,
    placeholder: true,
    replacementLabel: `${name} — final ${role}`,
  });

  return {
    lifestyleHero: asset("lifestyle-hero", "lifestyle hero"),
    alternateLifestyle: asset("lifestyle-hero", "alternate lifestyle angle"),
    frontView: asset("technical-placeholder", "front view"),
    sideView: asset("technical-placeholder", "side view"),
    blueprintPreview: asset("technical-placeholder", "blueprint preview"),
    cardThumbnail: asset("card-thumbnail", "project-card thumbnail"),
  };
}

export const projects: ProjectCatalogItem[] = [
  {
    id: "outdoor-table",
    name: "Modern Outdoor Table",
    description: "A welcoming outdoor dining table sized precisely for your patio or garden.",
    category: "Outdoor",
    cost: "$90–$240",
    buildTime: "6–8 hours",
    difficulty: "Intermediate",
    available: true,
    href: "/projects/outdoor-table",
    images: projectImages("outdoor-table", "Modern Outdoor Table"),
  },
  {
    id: "outdoor-bench",
    name: "Modern Outdoor Bench",
    description: "A simple slatted bench customized for an entry, porch, or dining table.",
    category: "Outdoor",
    cost: "$55–$170",
    buildTime: "4–6 hours",
    difficulty: "Beginner",
    available: true,
    href: "/projects/outdoor-bench",
    images: projectImages("outdoor-bench", "Modern Outdoor Bench"),
  },
  {
    id: "raised-garden-bed",
    name: "Raised Garden Bed",
    description: "A clean raised bed for vegetables, flowers, and backyard growing.",
    category: "Garden",
    cost: "$60–$120",
    buildTime: "2–3 hours",
    difficulty: "Beginner",
    available: false,
    href: "#",
    images: projectImages("raised-garden-bed", "Raised Garden Bed"),
  },
  {
    id: "garage-workbench",
    name: "Garage Workbench",
    description: "A sturdy customizable work surface for tools, storage, and repairs.",
    category: "Garage",
    cost: "$150–$300",
    buildTime: "5–7 hours",
    difficulty: "Intermediate",
    available: false,
    href: "#",
    images: projectImages("garage-workbench", "Garage Workbench"),
  },
  {
    id: "outdoor-sectional",
    name: "Outdoor Sectional",
    description: "Modular deep seating designed around the size of your outdoor space.",
    category: "Outdoor",
    cost: "$300–$650",
    buildTime: "10–14 hours",
    difficulty: "Intermediate",
    available: false,
    href: "#",
    images: projectImages("outdoor-sectional", "Outdoor Sectional"),
  },
  {
    id: "console-table",
    name: "Console Table",
    description: "A narrow indoor table for an entryway, hallway, or living room wall.",
    category: "Indoor",
    cost: "$75–$180",
    buildTime: "4–6 hours",
    difficulty: "Beginner",
    available: false,
    href: "#",
    images: projectImages("console-table", "Console Table"),
  },
];

export function getProject(id: ProjectCatalogItem["id"]) {
  return projects.find((project) => project.id === id);
}
