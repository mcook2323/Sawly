import type { WoodMaterial } from "./materialCatalog";
import type {
  CutPiece,
  GeneratedProjectPlan,
  HardwareItem,
} from "./projectPlan";

const LEG_SIZE = 3.5;

const TOP_THICKNESS = 1.5;

const APRON_OFFSET = 7;
const APRON_THICKNESS = 1.5;
const APRON_WIDTH = 3.5;

const TABLETOP_BOARD_WIDTH = 5.5;
const TABLETOP_BOARD_THICKNESS = 1.5;

const EXTERIOR_SCREW_COUNT = 48;

export interface TableInputs {
  length: number; // inches
  width: number; // inches
  height: number; // inches
  wood: WoodMaterial;
  style: "modern" | "farmhouse" | "craftsman" | "rustic";
}

export interface GeneratedTablePlan extends GeneratedProjectPlan {
  projectName: string;
  inputs: TableInputs;
}

export const TABLE_DIMENSION_LIMITS = {
  length: { min: 36, max: 144 },
  width: { min: 24, max: 60 },
  height: { min: 18, max: 42 },
} as const;

export function validateTableInputs(inputs: TableInputs) {
  return (
    Number.isFinite(inputs.length) &&
    inputs.length >= TABLE_DIMENSION_LIMITS.length.min &&
    inputs.length <= TABLE_DIMENSION_LIMITS.length.max &&
    Number.isFinite(inputs.width) &&
    inputs.width >= TABLE_DIMENSION_LIMITS.width.min &&
    inputs.width <= TABLE_DIMENSION_LIMITS.width.max &&
    Number.isFinite(inputs.height) &&
    inputs.height >= TABLE_DIMENSION_LIMITS.height.min &&
    inputs.height <= TABLE_DIMENSION_LIMITS.height.max
  );
}

export function generateTablePlan(
  inputs: TableInputs
): GeneratedTablePlan {
  if (!validateTableInputs(inputs)) {
    throw new RangeError("Outdoor Table dimensions are outside the supported range.");
  }
  const legLength = inputs.height - TOP_THICKNESS;

  const longApronLength = inputs.length - APRON_OFFSET;
  const shortApronLength = inputs.width - APRON_OFFSET;

  const tabletopBoardCount = Math.ceil(
    inputs.width / TABLETOP_BOARD_WIDTH
  );

  return {
    projectType: "outdoor-table",
    projectName: "Outdoor Table",
    material: inputs.wood,
    dimensions: [
      { label: "Length", value: inputs.length, unit: "in" },
      { label: "Width", value: inputs.width, unit: "in" },
      { label: "Height", value: inputs.height, unit: "in" },
    ],

    inputs,

    cutList: [
      {
        name: "Leg",
        quantity: 4,
        thickness: LEG_SIZE,
        width: LEG_SIZE,
        length: legLength,
        material: inputs.wood,
      },

      {
        name: "Long Apron",
        quantity: 2,
        thickness: APRON_THICKNESS,
        width: APRON_WIDTH,
        length: longApronLength,
        material: inputs.wood,
      },

      {
        name: "Short Apron",
        quantity: 2,
        thickness: APRON_THICKNESS,
        width: APRON_WIDTH,
        length: shortApronLength,
        material: inputs.wood,
      },

      {
        name: "Tabletop Board",
        quantity: tabletopBoardCount,
        thickness: TABLETOP_BOARD_THICKNESS,
        width: TABLETOP_BOARD_WIDTH,
        length: inputs.length,
        material: inputs.wood,
      },
    ],

    hardware: [
      {
        name: '2.5" Exterior Wood Screws',
        quantity: EXTERIOR_SCREW_COUNT,
      },

      {
        name: "Exterior Wood Glue",
        quantity: 1,
      },
    ],
  };
}

export type { CutPiece, HardwareItem };
