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
  wood: "pine" | "cedar" | "treated";
  style: "modern" | "farmhouse";
}

export interface CutPiece {
  name: string;
  quantity: number;
  thickness: number;
  width: number;
  length: number;
  material: TableInputs["wood"];
}

export interface HardwareItem {
  name: string;
  quantity: number;
}

export interface GeneratedTablePlan {
  projectName: string;
  inputs: TableInputs;
  cutList: CutPiece[];
  hardware: HardwareItem[];
}

export function generateTablePlan(
  inputs: TableInputs
): GeneratedTablePlan {
  const legLength = inputs.height - TOP_THICKNESS;

  const longApronLength = inputs.length - APRON_OFFSET;
  const shortApronLength = inputs.width - APRON_OFFSET;

  const tabletopBoardCount = Math.ceil(
    inputs.width / TABLETOP_BOARD_WIDTH
  );

  return {
    projectName: "Outdoor Table",

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
