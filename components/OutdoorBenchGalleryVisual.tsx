import { getMaterialLabel, type WoodMaterial } from "@/calculations/materialCatalog";
import { ProjectImage } from "@/components/ProjectImage";
import { TABLE_WOOD_COLORS } from "@/components/TablePreview";
import { getProject } from "@/data/projects";
import type { GalleryView } from "@/data/projectGallery";

interface Props { view: GalleryView; length: number; depth: number; seatHeight: number; wood: WoodMaterial; thumbnail?: boolean; }

export function OutdoorBenchGalleryVisual({ view, length, depth, seatHeight, wood, thumbnail = false }: Props) {
  const project = getProject("outdoor-bench");
  if (view === "lifestyle" && project) return <ProjectImage asset={project.images.lifestyleHero} sizes={thumbnail ? "25vw" : "100vw"} className={thumbnail ? "h-full" : "aspect-[16/9] min-h-[24rem]"} />;
  const colors = TABLE_WOOD_COLORS[wood];
  const measure = view === "side" ? depth : length;
  const visualWidth = Math.min(500, Math.max(230, measure * (view === "side" ? 12 : 5)));
  const x = (640 - visualWidth) / 2;
  const y = 145;
  const legHeight = Math.min(170, Math.max(100, seatHeight * 7));
  const blueprint = view === "blueprint";
  return (
    <div className={`${blueprint ? "blueprint-grid" : "bg-[#eee5d8]"} relative flex items-center justify-center overflow-hidden ${thumbnail ? "h-full" : "min-h-[24rem] sm:min-h-[34rem]"}`}>
      <svg viewBox="0 0 640 420" role="img" aria-label={`${view} view of configured outdoor bench`} className="h-full w-full max-w-4xl transition-all duration-300 ease-out">
        <rect x={x} y={y} width={visualWidth} height="28" rx="3" fill={blueprint ? "rgba(246,239,215,.12)" : colors.top} stroke={blueprint ? "#f6efd7" : colors.edge} strokeWidth="3" />
        {[0.18, 0.38, 0.58, 0.78].map((position) => <line key={position} x1={x + visualWidth * position} y1={y} x2={x + visualWidth * position} y2={y + 28} stroke={blueprint ? "#b9d3d0" : colors.edge} />)}
        <rect x={x + 18} y={y + 30} width={visualWidth - 36} height="28" fill={blueprint ? "none" : colors.edge} stroke={blueprint ? "#f6efd7" : colors.edge} strokeWidth="3" />
        <rect x={x + 35} y={y + 48} width="18" height={legHeight - 45} fill={blueprint ? "none" : colors.legs} stroke={blueprint ? "#f6efd7" : colors.legs} strokeWidth="3" />
        <rect x={x + visualWidth - 53} y={y + 48} width="18" height={legHeight - 45} fill={blueprint ? "none" : colors.legs} stroke={blueprint ? "#f6efd7" : colors.legs} strokeWidth="3" />
        {!thumbnail && <><text x="320" y={y + legHeight + 35} textAnchor="middle" fill={blueprint ? "#f6efd7" : "#65594f"} fontSize="14">{view === "side" ? "Depth" : "Length"}: {measure}&quot;</text><text x={x + visualWidth + 18} y={y + legHeight / 2} fill={blueprint ? "#f6efd7" : "#65594f"} fontSize="14">{seatHeight}&quot; H</text></>}
      </svg>
      {!thumbnail && <span className="absolute bottom-5 right-5 rounded-full bg-[#fffdf9]/90 px-3 py-1.5 text-xs font-semibold">{getMaterialLabel(wood)}</span>}
    </div>
  );
}
