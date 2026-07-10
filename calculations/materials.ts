import type { CutPiece, HardwareItem } from "./projectPlan";
import {
  getMaterialProductLabel,
  MATERIAL_PRICE_MULTIPLIERS,
  type WoodMaterial,
} from "./materialCatalog";

const STOCK_LENGTHS_INCHES = [96, 120, 144];
const PLANNED_WASTE_RATE = 0.15;

export interface CostRange {
  minCents: number;
  maxCents: number;
}

export interface ShoppingLumberItem {
  name: string;
  quantity: number;
  material: WoodMaterial;
  nominalSize: string;
  productType: "Board" | "Post";
  dimensions: string;
  stockLengthInches: number;
  stockLengthFeet: number;
  stockLengthLabel: string;
  totalCutLengthInches: number;
  estimatedWastePercent: number;
  estimatedUnitPriceRangeCents: CostRange;
  estimatedLineCostRangeCents: CostRange;
}

export interface ShoppingHardwareItem extends HardwareItem {
  estimatedUnitPriceRangeCents: CostRange;
  estimatedLineCostRangeCents: CostRange;
}

export interface ShoppingToolItem {
  name: string;
  required: boolean;
}

export interface ShoppingList {
  lumber: ShoppingLumberItem[];
  hardware: ShoppingHardwareItem[];
  tools: ShoppingToolItem[];
  estimatedWastePercent: number;
  estimatedCostRangeCents: CostRange;
}

const DEFAULT_TOOLS: ShoppingToolItem[] = [
  {
    name: "Saw",
    required: true,
  },
  {
    name: "Drill / driver",
    required: true,
  },
  {
    name: "Tape measure",
    required: true,
  },
  {
    name: "Speed square",
    required: true,
  },
  {
    name: "Clamps",
    required: true,
  },
  {
    name: "Safety glasses",
    required: true,
  },
];

function formatFeet(inches: number) {
  return `${inches / 12}ft`;
}

function getNominalSize(thickness: number, width: number) {
  if (thickness === 1.5 && width === 3.5) {
    return "2 x 4";
  }

  if (thickness === 1.5 && width === 5.5) {
    return "2 x 6";
  }

  if (thickness === 3.5 && width === 3.5) {
    return "4 x 4";
  }

  return `${thickness} x ${width}`;
}

function getProductType(nominalSize: string): "Board" | "Post" {
  return nominalSize === "4 x 4" ? "Post" : "Board";
}

function formatProductName(
  nominalSize: string,
  stockLengthInches: number,
  material: WoodMaterial
) {
  const compactSize = nominalSize.replaceAll(" ", "");
  const stockLengthFeet = stockLengthInches / 12;
  const productType = getProductType(nominalSize);
  const materialName = getMaterialProductLabel(material);

  return `${compactSize}x${stockLengthFeet} ${materialName} ${productType}`;
}

function multiplyCostRange(costRange: CostRange, quantity: number): CostRange {
  return {
    minCents: costRange.minCents * quantity,
    maxCents: costRange.maxCents * quantity,
  };
}

function addCostRanges(costRanges: CostRange[]): CostRange {
  return costRanges.reduce(
    (total, costRange) => ({
      minCents: total.minCents + costRange.minCents,
      maxCents: total.maxCents + costRange.maxCents,
    }),
    {
      minCents: 0,
      maxCents: 0,
    }
  );
}

function getLumberUnitPriceRange(
  nominalSize: string,
  stockLengthInches: number,
  material: WoodMaterial
): CostRange {
  const baseEightFootPrices: Record<string, CostRange> = {
    "2 x 4": {
      minCents: 350,
      maxCents: 650,
    },
    "2 x 6": {
      minCents: 650,
      maxCents: 1100,
    },
    "4 x 4": {
      minCents: 1500,
      maxCents: 2200,
    },
  };
  const basePrice = baseEightFootPrices[nominalSize] ?? {
    minCents: 500,
    maxCents: 1000,
  };
  const lengthMultiplier = stockLengthInches / 96;
  const materialMultiplier = MATERIAL_PRICE_MULTIPLIERS[material];

  return {
    minCents: Math.round(
      basePrice.minCents * lengthMultiplier * materialMultiplier
    ),
    maxCents: Math.round(
      basePrice.maxCents * lengthMultiplier * materialMultiplier
    ),
  };
}

function getHardwareUnitPriceRange(name: string): CostRange {
  if (name.includes("Screws")) {
    return {
      minCents: 800,
      maxCents: 1400,
    };
  }

  if (name.includes("Glue")) {
    return {
      minCents: 500,
      maxCents: 900,
    };
  }

  return {
    minCents: 300,
    maxCents: 800,
  };
}

export function chooseStockLength(requiredLength: number, totalCutLength: number) {
  const usableStockLengths = STOCK_LENGTHS_INCHES.filter(
    (stockLength) => stockLength >= requiredLength
  );

  const stockLengths =
    usableStockLengths.length > 0
      ? usableStockLengths
      : [Math.ceil(requiredLength / 12) * 12];

  return stockLengths.reduce((bestLength, stockLength) => {
    const bestQuantity = Math.ceil(totalCutLength / bestLength);
    const currentQuantity = Math.ceil(totalCutLength / stockLength);
    const bestWaste = bestQuantity * bestLength - totalCutLength;
    const currentWaste = currentQuantity * stockLength - totalCutLength;

    if (currentWaste < bestWaste) {
      return stockLength;
    }

    if (currentWaste === bestWaste && stockLength < bestLength) {
      return stockLength;
    }

    return bestLength;
  }, stockLengths[0]);
}

export function generateShoppingList(
  cutList: CutPiece[],
  hardware: HardwareItem[]
): ShoppingList {
  const lumberGroups = new Map<string, CutPiece[]>();

  cutList.forEach((piece) => {
    const key = [
      piece.material,
      piece.thickness,
      piece.width,
    ].join("-");

    lumberGroups.set(key, [...(lumberGroups.get(key) ?? []), piece]);
  });

  const lumber = Array.from(lumberGroups.values()).map((pieces) => {
    const firstPiece = pieces[0];
    const totalCutLengthInches = pieces.reduce(
      (total, piece) => total + piece.length * piece.quantity,
      0
    );
    const longestCutLength = Math.max(
      ...pieces.map((piece) => piece.length)
    );
    const plannedLength = totalCutLengthInches * (1 + PLANNED_WASTE_RATE);
    const stockLengthInches = chooseStockLength(
      longestCutLength,
      plannedLength
    );
    const stockLengthFeet = stockLengthInches / 12;
    const quantity = Math.ceil(plannedLength / stockLengthInches);
    const purchasedLength = quantity * stockLengthInches;
    const estimatedWastePercent =
      totalCutLengthInches > 0
        ? Math.round(
            ((purchasedLength - totalCutLengthInches) /
              totalCutLengthInches) *
              100
          )
        : 0;
    const nominalSize = getNominalSize(
      firstPiece.thickness,
      firstPiece.width
    );
    const stockLengthLabel = formatFeet(stockLengthInches);
    const estimatedUnitPriceRangeCents = getLumberUnitPriceRange(
      nominalSize,
      stockLengthInches,
      firstPiece.material
    );

    return {
      name: formatProductName(
        nominalSize,
        stockLengthInches,
        firstPiece.material
      ),
      quantity,
      material: firstPiece.material,
      nominalSize,
      productType: getProductType(nominalSize),
      dimensions: `${nominalSize} x ${stockLengthLabel}`,
      stockLengthInches,
      stockLengthFeet,
      stockLengthLabel,
      totalCutLengthInches,
      estimatedWastePercent,
      estimatedUnitPriceRangeCents,
      estimatedLineCostRangeCents: multiplyCostRange(
        estimatedUnitPriceRangeCents,
        quantity
      ),
    };
  });

  const totalCutLength = lumber.reduce(
    (total, item) => total + item.totalCutLengthInches,
    0
  );
  const totalPurchasedLength = lumber.reduce(
    (total, item) => total + item.quantity * item.stockLengthInches,
    0
  );
  const estimatedWastePercent =
    totalCutLength > 0
      ? Math.round(
          ((totalPurchasedLength - totalCutLength) / totalCutLength) *
            100
        )
      : 0;
  const shoppingHardware = hardware.map((item) => {
    const estimatedUnitPriceRangeCents = getHardwareUnitPriceRange(
      item.name
    );

    return {
      ...item,
      estimatedUnitPriceRangeCents,
      estimatedLineCostRangeCents: multiplyCostRange(
        estimatedUnitPriceRangeCents,
        1
      ),
    };
  });
  const estimatedCostRangeCents = addCostRanges([
    ...lumber.map((item) => item.estimatedLineCostRangeCents),
    ...shoppingHardware.map((item) => item.estimatedLineCostRangeCents),
  ]);

  return {
    lumber,
    hardware: shoppingHardware,
    tools: DEFAULT_TOOLS,
    estimatedWastePercent,
    estimatedCostRangeCents,
  };
}
