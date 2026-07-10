import {
  getMaterialLabel,
  type WoodMaterial,
} from "@/calculations/materialCatalog";

export interface BuildStepNote {
  type: "tip" | "caution";
  text: string;
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
  material: WoodMaterial
): BuildStep[] {
  const materialLabel = getMaterialLabel(material);
  const finishing = getFinishingGuidance(material);

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
      instructions:
        "Compare the generated dimensions with your space and actual lumber. Mark each planned cut clearly before turning on a saw.",
      parts: ["Generated cut list", "Tape measure", "Speed square", "Pencil"],
      note: {
        type: "caution",
        text: "Always verify the actual board dimensions and measure twice before cutting.",
      },
    },
    {
      number: 3,
      title: "Cut the legs, aprons, and tabletop boards",
      instructions:
        "Cut all four legs, both long aprons, both short aprons, and the tabletop boards to the finished lengths in the cut list. Label each piece as you finish it.",
      parts: ["Legs", "Long aprons", "Short aprons", "Tabletop boards"],
      note: {
        type: "caution",
        text: "Wear eye and hearing protection and support long boards throughout each cut.",
      },
    },
    {
      number: 4,
      title: "Assemble the leg and apron frame",
      instructions:
        "On a flat surface, attach the long and short aprons between the legs. Apply exterior wood glue at each joint, clamp the pieces, then drive the exterior screws.",
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
      instructions:
        "Arrange the tabletop boards with their best faces up. Keep the ends flush, maintain even spacing, and fasten each board securely to the apron frame.",
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
