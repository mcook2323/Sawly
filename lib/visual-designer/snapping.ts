export const SNAP_INCREMENTS = [0.125, 0.25, 0.5] as const;
export type SnapIncrement = (typeof SNAP_INCREMENTS)[number];

export function snapValue(value: number, increment: SnapIncrement = 0.125) {
  if (!Number.isFinite(value)) throw new TypeError("Snap value must be finite.");
  return Number((Math.round(value / increment) * increment).toFixed(3));
}

export function applySnap(value: number, enabled: boolean, increment: SnapIncrement) {
  return enabled ? snapValue(value, increment) : value;
}
