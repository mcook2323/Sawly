import {
  getMaterialLabel,
  type WoodMaterial,
} from "@/calculations/materialCatalog";
import type { GalleryView } from "@/data/projectGallery";
import { TABLE_WOOD_COLORS, TablePreview } from "@/components/TablePreview";
import { ProjectImage } from "@/components/ProjectImage";
import { getProject } from "@/data/projects";

interface OutdoorTableGalleryVisualProps {
  view: GalleryView;
  length: number;
  width: number;
  height: number;
  wood: WoodMaterial;
  thumbnail?: boolean;
}

export function OutdoorTableGalleryVisual({
  view,
  length,
  width,
  height,
  wood,
  thumbnail = false,
}: OutdoorTableGalleryVisualProps) {
  const project = getProject("outdoor-table");
  if (view === "lifestyle" && project) {
    return <ProjectImage asset={project.images.lifestyleHero} sizes={thumbnail ? "25vw" : "100vw"} className={thumbnail ? "h-full" : "aspect-[16/9] min-h-[24rem]"} />;
  }
  if (view === "blueprint") {
    return (
      <TablePreview
        length={length}
        width={width}
        height={height}
        wood={wood}
        variant={view}
        compact={thumbnail}
      />
    );
  }

  const colors = TABLE_WOOD_COLORS[wood];
  const measurement = view === "front" ? length : width;
  const tableWidth = Math.min(500, Math.max(250, measurement * (view === "front" ? 3.5 : 7)));
  const tableHeight = Math.min(230, Math.max(140, height * 6));
  const x = (640 - tableWidth) / 2;
  const topY = 105;
  const bottomY = topY + tableHeight;
  const legInset = view === "front" ? 38 : 28;

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-[#eee5d8] ${
        thumbnail ? "h-full min-h-0" : "min-h-[24rem] sm:min-h-[34rem]"
      }`}
    >
      <svg
        viewBox="0 0 640 420"
        role="img"
        aria-label={`${view === "front" ? "Front" : "Side"} elevation of the table`}
        className="h-full w-full max-w-4xl"
      >
        <rect width="640" height="420" fill="#eee5d8" />
        <circle cx="530" cy="72" r="38" fill="#f4d99a" opacity="0.55" />
        <line x1="40" y1="350" x2="600" y2="350" stroke="#cbbb9f" strokeWidth="2" />
        <rect
          x={x}
          y={topY}
          width={tableWidth}
          height="26"
          rx="3"
          fill={colors.top}
          stroke={colors.edge}
          strokeWidth="3"
        />
        <rect
          x={x + 18}
          y={topY + 27}
          width={tableWidth - 36}
          height="28"
          fill={colors.edge}
          opacity="0.9"
        />
        <rect
          x={x + legInset}
          y={topY + 44}
          width="18"
          height={tableHeight - 44}
          fill={colors.legs}
        />
        <rect
          x={x + tableWidth - legInset - 18}
          y={topY + 44}
          width="18"
          height={tableHeight - 44}
          fill={colors.legs}
        />
        {!thumbnail && (
          <>
            <line x1={x} y1={bottomY + 34} x2={x + tableWidth} y2={bottomY + 34} stroke="#817469" strokeWidth="2" />
            <line x1={x} y1={bottomY + 27} x2={x} y2={bottomY + 41} stroke="#817469" strokeWidth="2" />
            <line x1={x + tableWidth} y1={bottomY + 27} x2={x + tableWidth} y2={bottomY + 41} stroke="#817469" strokeWidth="2" />
            <text x="320" y={bottomY + 57} textAnchor="middle" fill="#65594f" fontSize="14">
              {view === "front" ? "Length" : "Width"}: {measurement}&quot;
            </text>
            <text x={x + tableWidth + 24} y={topY + tableHeight / 2} fill="#65594f" fontSize="14">
              {height}&quot; H
            </text>
          </>
        )}
      </svg>

      {!thumbnail && (
        <span className="absolute bottom-5 right-5 rounded-full border border-white/70 bg-[#fffaf1]/85 px-3 py-1.5 text-xs font-semibold text-[#665b51] shadow-sm backdrop-blur">
          {getMaterialLabel(wood)}
        </span>
      )}
    </div>
  );
}
