"use client";
import { Html } from "@react-three/drei";
import type { VisualSceneObject } from "@/types/visualDesigner";

export function DimensionOverlay({ object, selected, visible }: { object: VisualSceneObject; selected: boolean; visible: boolean }) {
  if (!visible || (!selected && object.metadata.source === "generic-adapter")) return null;
  return <Html position={[0, object.dimensions.height / 2 + 3, 0]} center style={{ pointerEvents: "none" }}><span className="whitespace-nowrap rounded-full border border-[#9aaea3] bg-white/95 px-2 py-1 text-[10px] font-semibold text-[#24483d] shadow-sm">{object.dimensions.width} × {object.dimensions.height} × {object.dimensions.depth} in</span></Html>;
}
