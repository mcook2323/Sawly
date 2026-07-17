import type { WoodMaterial } from "./materialCatalog";
import type { GeneratedProjectPlan } from "./projectPlan";

// Actual lumber dimensions in inches. The bench uses simple butt-jointed
// aprons and a slatted 2x4 seat; it is a DIY plan, not an engineered structure.
const LEG_SIZE = 3.5;
const SEAT_BOARD_THICKNESS = 1.5;
const SEAT_BOARD_WIDTH = 3.5;
const APRON_THICKNESS = 1.5;
const APRON_WIDTH = 3.5;
const LEG_INSET_TOTAL = 7;

export const BENCH_DIMENSION_LIMITS = {
  length: { min: 36, max: 96 },
  depth: { min: 16, max: 24 },
  seatHeight: { min: 16, max: 20 },
} as const;

export interface BenchInputs {
  length: number;
  depth: number;
  seatHeight: number;
  wood: WoodMaterial;
  style?: "modern" | "park" | "farmhouse" | "minimal";
}

export interface GeneratedBenchPlan extends GeneratedProjectPlan {
  inputs: BenchInputs;
}

export function validateBenchInputs(inputs: BenchInputs) {
  return (
    Number.isFinite(inputs.length) &&
    inputs.length >= BENCH_DIMENSION_LIMITS.length.min &&
    inputs.length <= BENCH_DIMENSION_LIMITS.length.max &&
    Number.isFinite(inputs.depth) &&
    inputs.depth >= BENCH_DIMENSION_LIMITS.depth.min &&
    inputs.depth <= BENCH_DIMENSION_LIMITS.depth.max &&
    Number.isFinite(inputs.seatHeight) &&
    inputs.seatHeight >= BENCH_DIMENSION_LIMITS.seatHeight.min &&
    inputs.seatHeight <= BENCH_DIMENSION_LIMITS.seatHeight.max &&
    inputs.length - LEG_INSET_TOTAL > 0 &&
    inputs.depth - LEG_INSET_TOTAL > 0
  );
}

export function generateBenchPlan(inputs: BenchInputs): GeneratedBenchPlan {
  if (!validateBenchInputs(inputs)) {
    throw new RangeError("Outdoor Bench dimensions are outside the supported range.");
  }

  const legLength = inputs.seatHeight - SEAT_BOARD_THICKNESS;
  const longApronLength = inputs.length - LEG_INSET_TOTAL;
  const shortApronLength = inputs.depth - LEG_INSET_TOTAL;
  const style = inputs.style ?? "modern";
  const slatGap = style === "minimal" ? 0.375 : style === "park" ? 0.75 : style === "farmhouse" ? 0.5 : 0.625;
  const seatBoardCount = Math.ceil((inputs.depth + slatGap) / (SEAT_BOARD_WIDTH + slatGap));

  return {
    projectType: "outdoor-bench",
    projectName: "Modern Outdoor Bench",
    material: inputs.wood,
    dimensions: [
      { label: "Length", value: inputs.length, unit: "in" },
      { label: "Depth", value: inputs.depth, unit: "in" },
      { label: "Seat height", value: inputs.seatHeight, unit: "in" },
    ],
    inputs,
    cutList: [
      { name: "Leg", quantity: 4, thickness: LEG_SIZE, width: LEG_SIZE, length: legLength, material: inputs.wood },
      { name: "Long Apron", quantity: 2, thickness: APRON_THICKNESS, width: APRON_WIDTH, length: longApronLength, material: inputs.wood },
      { name: "Short Apron", quantity: 2, thickness: APRON_THICKNESS, width: APRON_WIDTH, length: shortApronLength, material: inputs.wood },
      { name: "Seat Board", quantity: seatBoardCount, thickness: SEAT_BOARD_THICKNESS, width: SEAT_BOARD_WIDTH, length: inputs.length, material: inputs.wood },
    ],
    hardware: [
      { name: '2.5" Exterior Wood Screws', quantity: style === "park" ? 48 : 40 },
      { name: "Exterior Wood Glue", quantity: 1 },
    ],
  };
}
