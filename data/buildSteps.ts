import {
  getMaterialLabel,
  type WoodMaterial,
} from "@/calculations/materialCatalog";
import type { GeneratedBenchPlan } from "@/calculations/bench";
import type { GeneratedTablePlan } from "@/calculations/table";

export interface BuildStepNote {
  type: "tip" | "caution";
  text: string;
}

export function getOutdoorBenchBuildSteps(plan: GeneratedBenchPlan): BuildStep[] {
  const material = getMaterialLabel(plan.material);
  const part = (name: string) => plan.cutList.find((piece) => piece.name === name)!;
  const leg = part("Leg");
  const longApron = part("Long Apron");
  const shortApron = part("Short Apron");
  const seat = part("Seat Board");
  const finishing = getFinishingGuidance(plan.material);
  return [
    { number: 1, title: "Inspect and organize the lumber", instructions: `Lay out the ${material.toLowerCase()} and reject badly twisted, split, or damaged boards. Group the best faces for the seat.`, parts: ["Shopping list lumber", "Tape measure", "Pencil"], note: { type: "tip", text: "Mark every piece with its cut-list name before cutting." } },
    { number: 2, title: "Verify the configured measurements", instructions: `Confirm the finished bench will be ${plan.inputs.length}\" long, ${plan.inputs.depth}\" deep, and ${plan.inputs.seatHeight}\" high. Compare actual lumber dimensions with the plan.`, parts: ["Generated plan", "Tape measure", "Speed square"], note: { type: "caution", text: "Nominal lumber sizes may differ from actual dimensions; measure the boards you purchased." } },
    { number: 3, title: "Cut and label every part", instructions: `Cut 4 legs to ${leg.length}\", 2 long aprons to ${longApron.length}\", 2 short aprons to ${shortApron.length}\", and ${seat.quantity} seat boards to ${seat.length}\".`, parts: ["Legs", "Long Aprons", "Short Aprons", "Seat Boards"], note: { type: "caution", text: "Support long stock and wear eye and hearing protection." } },
    { number: 4, title: "Assemble the two end frames", instructions: `Position one ${shortApron.length}\" short apron between each pair of legs. Keep the apron tops aligned, apply exterior glue, clamp, and fasten with exterior screws.`, parts: ["4 Legs", "2 Short Aprons", "Exterior Wood Glue", "Exterior Screws"] },
    { number: 5, title: "Join the end frames", instructions: `Connect the end frames with the two ${longApron.length}\" long aprons. Clamp on a flat surface and drive the specified exterior screws only after the top edges are flush.`, parts: ["2 End Frames", "2 Long Aprons", "Exterior Wood Glue", "Exterior Screws"] },
    { number: 6, title: "Square and verify the frame", instructions: "Measure both frame diagonals and adjust until they match. Check that all four legs sit flat before the glue cures.", parts: ["Bench Frame", "Tape Measure", "Clamps"], note: { type: "caution", text: "Do not install the seat on a racked or rocking frame." } },
    { number: 7, title: "Install the seat boards", instructions: `Arrange all ${seat.quantity} seat boards with even drainage gaps and flush ends. Pre-drill where needed, then fasten each board into the apron frame.`, parts: [`${seat.quantity} Seat Boards`, "Exterior Screws", "Equal Spacers"], note: { type: "tip", text: "Use identical spacers to keep the slat layout consistent." } },
    { number: 8, title: "Sand and ease exposed edges", instructions: "Sand the seat, frame, legs, cut ends, and corners. Remove splinters and sharp edges without rounding fitted joints excessively.", parts: ["Assembled Bench", "Sandpaper or Sander"], note: { type: "caution", text: "Wear suitable dust protection and remove dust before finishing." } },
    { number: 9, title: "Apply an outdoor finish", instructions: finishing.instructions, parts: [`${material} Bench`, "Exterior-rated Finish"], note: finishing.note },
    { number: 10, title: "Complete the stability and safety check", instructions: "After the finish cures, place the bench on a level surface. Check for rocking, loose fasteners, sharp edges, or movement before sitting on it.", parts: ["Finished Bench", "Driver for Final Adjustments"], note: { type: "caution", text: "This DIY plan is not structural engineering certification; use appropriate judgment and stop using a bench that loosens or moves." } },
  ];
}

export interface BuildStep {
  number: number;
  title: string;
  instructions: string;
  parts: string[];
  note?: BuildStepNote;
}

function getFinishingGuidance(material: WoodMaterial) {
  if (material === "cedar") {
    return {
      instructions:
        "Apply a penetrating exterior oil or a UV-resistant clear finish to every face and end grain. Follow the finish label for drying time and additional coats.",
      note: {
        type: "tip" as const,
        text: "Test the finish on a cedar offcut first so you can confirm the final color.",
      },
    };
  }

  if (material === "treated") {
    return {
      instructions:
        "Let the pressure-treated lumber dry as directed by its supplier, then apply an exterior finish labeled for treated wood to every face and end grain.",
      note: {
        type: "caution" as const,
        text: "Do not seal damp pressure-treated lumber; trapped moisture can cause an uneven finish.",
      },
    };
  }

  return {
    instructions:
      "Apply an exterior-rated primer and paint, or an exterior stain and sealer, to every pine surface and exposed end grain. Follow the product label between coats.",
    note: {
      type: "tip" as const,
      text: "Pine absorbs finish unevenly, so test your finish on an offcut before coating the table.",
    },
  };
}

export function getOutdoorTableBuildSteps(
  plan: GeneratedTablePlan
): BuildStep[] {
  const materialLabel = getMaterialLabel(plan.material);
  const finishing = getFinishingGuidance(plan.material);
  const part = (name: string) => plan.cutList.find((piece) => piece.name === name)!;
  const leg = part("Leg");
  const longApron = part("Long Apron");
  const shortApron = part("Short Apron");
  const tabletop = part("Tabletop Board");

  return [
    {
      number: 1,
      title: "Gather materials and tools",
      instructions: `Lay out the ${materialLabel.toLowerCase()}, hardware, and required tools. Check every board for severe twists, splits, or damage before you begin.`,
      parts: ["Shopping list lumber", "Exterior screws", "Wood glue", "Required tools"],
      note: {
        type: "tip",
        text: "Group matching boards together so the tabletop has a consistent color and grain pattern.",
      },
    },
    {
      number: 2,
      title: "Review measurements and verify the plan",
      instructions: `Confirm the finished table will be ${plan.inputs.length}\" long, ${plan.inputs.width}\" wide, and ${plan.inputs.height}\" high. Compare actual lumber dimensions with the plan.`,
      parts: ["Generated cut list", "Tape measure", "Speed square", "Pencil"],
      note: {
        type: "caution",
        text: "Always verify the actual board dimensions and measure twice before cutting.",
      },
    },
    {
      number: 3,
      title: "Cut the legs, aprons, and tabletop boards",
      instructions: `Cut 4 legs to ${leg.length}\", 2 long aprons to ${longApron.length}\", 2 short aprons to ${shortApron.length}\", and ${tabletop.quantity} tabletop boards to ${tabletop.length}\". Label each piece.`,
      parts: ["Legs", "Long aprons", "Short aprons", "Tabletop boards"],
      note: {
        type: "caution",
        text: "Wear eye and hearing protection and support long boards throughout each cut.",
      },
    },
    {
      number: 4,
      title: "Assemble the leg and apron frame",
      instructions: `On a flat surface, attach the ${shortApron.length}\" short aprons and ${longApron.length}\" long aprons between the legs. Align the apron tops, apply exterior glue, clamp, then drive exterior screws.`,
      parts: ["4 legs", "2 long aprons", "2 short aprons", "Exterior screws", "Exterior wood glue"],
      note: {
        type: "tip",
        text: "Assemble one end frame at a time before joining both ends with the long aprons.",
      },
    },
    {
      number: 5,
      title: "Square and reinforce the frame",
      instructions:
        "Measure diagonally from corner to corner in both directions. Adjust the frame until both diagonal measurements match, then tighten the clamps and complete the fastening.",
      parts: ["Assembled leg-and-apron frame", "Exterior screws", "Clamps"],
      note: {
        type: "caution",
        text: "A frame that is not square will make the tabletop harder to align and can cause the finished table to wobble.",
      },
    },
    {
      number: 6,
      title: "Install the tabletop boards",
      instructions: `Arrange all ${tabletop.quantity} tabletop boards with their best faces up. Keep the ${tabletop.length}\" ends flush, maintain even drainage spacing, and fasten each board to the apron frame.`,
      parts: ["Tabletop boards", "Squared frame", "Exterior screws"],
      note: {
        type: "tip",
        text: "Use equal-size spacers between boards so rainwater can drain and the layout stays consistent.",
      },
    },
    {
      number: 7,
      title: "Sand all surfaces and edges",
      instructions:
        "Sand the tabletop, frame, legs, cut ends, and exposed edges until they feel smooth. Ease sharp corners without changing the fitted joint surfaces.",
      parts: ["Assembled table", "Sandpaper or sander"],
      note: {
        type: "caution",
        text: "Wear suitable dust protection and remove all sanding dust before applying finish.",
      },
    },
    {
      number: 8,
      title: "Apply the appropriate outdoor finish",
      instructions: finishing.instructions,
      parts: [`${materialLabel} table`, "Exterior-rated finish", "Applicator and cleanup supplies"],
      note: finishing.note,
    },
    {
      number: 9,
      title: "Perform a final stability and safety check",
      instructions:
        "Place the cured table on a level surface. Check for rocking, confirm every fastener is secure, and inspect all edges and surfaces before regular use.",
      parts: ["Finished table", "Driver or hand tools for final adjustments"],
      note: {
        type: "caution",
        text: "Do not use the table until the finish has fully cured according to the product instructions.",
      },
    },
  ];
}
