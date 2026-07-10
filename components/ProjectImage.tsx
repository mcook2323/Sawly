import Image from "next/image";
import type { ProjectImageAsset } from "@/types/project";

interface ProjectImageProps {
  asset: ProjectImageAsset;
  sizes: string;
  priority?: boolean;
  className?: string;
}

export function ProjectImage({
  asset,
  sizes,
  priority = false,
  className = "",
}: ProjectImageProps) {
  return (
    <div className={`relative overflow-hidden bg-[#e8ddcc] ${className}`}>
      <Image
        src={asset.src}
        alt={asset.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
      {asset.placeholder && (
        <span className="absolute bottom-3 left-3 rounded-full border border-white/70 bg-[#fffdf9]/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#74685e] backdrop-blur">
          Image placeholder
        </span>
      )}
    </div>
  );
}
