export type VerifiedProjectKind = "outdoor-table" | "outdoor-bench";
export const PROJECT_SNAP_POINTS: Record<VerifiedProjectKind, number[]> = { "outdoor-table": [60, 72, 84, 96], "outdoor-bench": [48, 60, 72, 84] };
const seatingLengths: Record<VerifiedProjectKind, Partial<Record<number, number>>> = { "outdoor-table": { 4: 60, 6: 72, 8: 84, 10: 96 }, "outdoor-bench": { 4: 72, 6: 96 } };
export function suggestedLengthForSeating(project: VerifiedProjectKind, seats: number, min: number, max: number) { const length = seatingLengths[project][seats]; return length !== undefined && length >= min && length <= max ? length : null; }
export function seatingCapacity(project: VerifiedProjectKind, length: number) { if (project === "outdoor-bench") return length >= 96 ? 6 : length >= 72 ? 4 : 2; return length >= 96 ? 10 : length >= 84 ? 8 : length >= 72 ? 6 : 4; }
