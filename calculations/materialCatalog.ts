import type { TableInputs } from "./table";

export type WoodMaterial = TableInputs["wood"];

export interface MaterialOption {
  value: WoodMaterial;
  label: string;
  description: string;
  priceNote: string;
}

export const MATERIAL_OPTIONS: MaterialOption[] = [
  {
    value: "pine",
    label: "Pine",
    description: "Easy to work with and simple to finish.",
    priceNote: "Most affordable",
  },
  {
    value: "cedar",
    label: "Cedar",
    description: "Warm color with natural outdoor durability.",
    priceNote: "Premium range",
  },
  {
    value: "treated",
    label: "Pressure-treated lumber",
    description: "Built for outdoor exposure and everyday use.",
    priceNote: "Mid-range",
  },
];

export const MATERIAL_PRICE_MULTIPLIERS: Record<WoodMaterial, number> = {
  pine: 1,
  cedar: 1.9,
  treated: 1.35,
};

export function getMaterialLabel(material: WoodMaterial) {
  return (
    MATERIAL_OPTIONS.find((option) => option.value === material)?.label ??
    material
  );
}

export function getMaterialProductLabel(material: WoodMaterial) {
  return material === "treated" ? "Pressure-treated" : getMaterialLabel(material);
}
