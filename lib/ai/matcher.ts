import { BENCH_DIMENSION_LIMITS } from "../../calculations/bench";
import { TABLE_DIMENSION_LIMITS } from "../../calculations/table";
import type { ParsedDesignRequest, TemplateMatch } from "@/types/ai";

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }

export function matchProjectTemplate(request: ParsedDesignRequest): TemplateMatch | null {
  const outdoor = request.keywords.some((word) => ["outdoor", "patio", "garden", "deck"].includes(word));
  if (request.projectType === "table" && (outdoor || !request.keywords.includes("indoor"))) {
    const length = clamp(request.dimensions.length ?? (request.capacity ? request.capacity * 12 : 72), TABLE_DIMENSION_LIMITS.length.min, TABLE_DIMENSION_LIMITS.length.max);
    return {
      projectId: "outdoor-table", confidence: outdoor ? 0.94 : 0.82,
      reasons: ["Table project", ...(outdoor ? ["Outdoor use"] : []), ...(request.material ? ["Supported material"] : [])],
      prefill: { material: request.material ?? undefined, dimensions: { length, width: clamp(request.dimensions.width ?? 36, TABLE_DIMENSION_LIMITS.width.min, TABLE_DIMENSION_LIMITS.width.max), height: clamp(request.dimensions.height ?? 30, TABLE_DIMENSION_LIMITS.height.min, TABLE_DIMENSION_LIMITS.height.max) } },
    };
  }
  if (request.projectType === "bench" && !request.keywords.includes("mudroom")) {
    return {
      projectId: "outdoor-bench", confidence: outdoor ? 0.93 : 0.78,
      reasons: ["Bench project", ...(outdoor ? ["Outdoor use"] : []), ...(request.material ? ["Supported material"] : [])],
      prefill: { material: request.material ?? undefined, dimensions: { length: clamp(request.dimensions.length ?? 60, BENCH_DIMENSION_LIMITS.length.min, BENCH_DIMENSION_LIMITS.length.max), depth: clamp(request.dimensions.depth ?? request.dimensions.width ?? 18, BENCH_DIMENSION_LIMITS.depth.min, BENCH_DIMENSION_LIMITS.depth.max), seatHeight: clamp(request.dimensions.height ?? 18, BENCH_DIMENSION_LIMITS.seatHeight.min, BENCH_DIMENSION_LIMITS.seatHeight.max) } },
    };
  }
  return null;
}
