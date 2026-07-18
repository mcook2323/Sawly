export function studioWheelZoomDelta(event: Pick<WheelEvent, "ctrlKey" | "metaKey" | "deltaY">) {
  if (!event.ctrlKey && !event.metaKey) return null;
  return event.deltaY > 0 ? -0.08 : 0.08;
}

export function isDeliberateStudioPan(startX: number, startY: number, currentX: number, currentY: number) {
  return Math.hypot(currentX - startX, currentY - startY) >= 6;
}
