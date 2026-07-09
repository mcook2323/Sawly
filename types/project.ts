export type ProjectCategory =
  | "outdoor-furniture"
  | "garage"
  | "garden"
  | "home";

export type ProjectType =
  | "outdoor-table";

export interface ProjectTemplate {
  id: ProjectType;
  name: string;
  category: ProjectCategory;
  description: string;
  isAvailable: boolean;
}