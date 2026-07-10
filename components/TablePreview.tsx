import type { WoodMaterial } from "@/calculations/materialCatalog";

interface TablePreviewProps {
  length: number;
  width: number;
  height: number;
  wood: WoodMaterial;
  variant?: "lifestyle" | "blueprint";
  compact?: boolean;
}

export const TABLE_WOOD_COLORS: Record<
  WoodMaterial,
  { top: string; edge: string; legs: string; rearLegs: string }
> = {
  pine: {
    top: "#c99562",
    edge: "#95663f",
    legs: "#8c603e",
    rearLegs: "#a7764e",
  },
  cedar: {
    top: "#ad674b",
    edge: "#754333",
    legs: "#754735",
    rearLegs: "#915b43",
  },
  treated: {
    top: "#9b9471",
    edge: "#69664e",
    legs: "#716d53",
    rearLegs: "#858064",
  },
};

export function TablePreview({
  length,
  width,
  height,
  wood,
  variant = "lifestyle",
  compact = false,
}: TablePreviewProps) {
  const previewWidth = Math.min(520, Math.max(260, length * 5));
  const previewHeight = Math.min(260, Math.max(140, height * 7));
  const topDepth = Math.min(120, Math.max(60, width * 2));
  const colors =
    variant === "blueprint"
      ? {
          top: "rgba(246, 239, 215, 0.12)",
          edge: "#f6efd7",
          legs: "#f6efd7",
          rearLegs: "#b9d3d0",
        }
      : TABLE_WOOD_COLORS[wood];

  return (
    <div
      className={`${variant === "blueprint" ? "blueprint-grid" : "preview-grid"} flex items-center justify-center overflow-hidden ${
        compact
          ? "h-full min-h-0 px-2 py-1"
          : "min-h-[24rem] px-3 pb-3 pt-14 sm:min-h-[34rem] sm:px-8 sm:pb-8 sm:pt-16"
      }`}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 640 420"
        role="img"
        aria-label={`Outdoor table preview, ${length} inches long by ${width} inches wide by ${height} inches high`}
        className={`${compact ? "max-h-28" : "max-h-[460px]"} drop-shadow-[0_20px_30px_rgba(91,70,49,0.18)]`}
      >
        {variant === "lifestyle" && (
          <g aria-hidden="true" opacity="0.55">
            <rect x="470" y="25" width="120" height="150" rx="4" fill="#f8eed6" />
            <line x1="530" y1="25" x2="530" y2="175" stroke="#cbbca8" strokeWidth="3" />
            <line x1="470" y1="100" x2="590" y2="100" stroke="#cbbca8" strokeWidth="3" />
            <circle cx="535" cy="66" r="24" fill="#f4d99a" opacity="0.7" />
            <path d="M38 265 C15 220, 34 194, 57 232 C52 187, 86 188, 70 242 C100 211, 113 239, 72 270" fill="#879375" />
            <path d="M34 263 L78 263 L71 321 L42 321 Z" fill="#b87960" />
            <line x1="0" y1="345" x2="640" y2="345" stroke="#bba991" strokeWidth="2" />
          </g>
        )}
        <g transform="translate(70 70)">
          <polygon
            points={`0,${topDepth} 90,0 ${previewWidth},0 ${
              previewWidth - 90
            },${topDepth}`}
            fill={colors.top}
            stroke={colors.edge}
            strokeWidth="3"
          />

          <line
            x1="0"
            y1={topDepth}
            x2="0"
            y2={topDepth + previewHeight}
            stroke={colors.legs}
            strokeWidth="10"
          />

          <line
            x1={previewWidth - 90}
            y1={topDepth}
            x2={previewWidth - 90}
            y2={topDepth + previewHeight}
            stroke={colors.legs}
            strokeWidth="10"
          />

          <line
            x1="90"
            y1="0"
            x2="90"
            y2={previewHeight}
            stroke={colors.rearLegs}
            strokeWidth="9"
            opacity="0.7"
          />

          <line
            x1={previewWidth}
            y1="0"
            x2={previewWidth}
            y2={previewHeight}
            stroke={colors.rearLegs}
            strokeWidth="9"
            opacity="0.7"
          />

          <text
            x="0"
            y={topDepth + previewHeight + 35}
            fill={variant === "blueprint" ? "#f6efd7" : "#65594f"}
            fontSize="14"
          >
            Length: {length}&quot;
          </text>

          <text
            x={previewWidth - 120}
            y={topDepth + previewHeight + 35}
            fill={variant === "blueprint" ? "#f6efd7" : "#65594f"}
            fontSize="14"
          >
            Width: {width}&quot;
          </text>

          <text
            x={previewWidth + 20}
            y={topDepth + previewHeight / 2}
            fill={variant === "blueprint" ? "#f6efd7" : "#65594f"}
            fontSize="14"
          >
            Height: {height}&quot;
          </text>
        </g>
      </svg>
    </div>
  );
}
