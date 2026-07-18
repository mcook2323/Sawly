import type { ConstraintWarning, VisualScene, VisualSceneObject } from "../../types/visualDesigner";
import { MIN_VISUAL_DIMENSION } from "./validation";

export interface VisualConstraint { id: string; kind: ConstraintWarning["kind"]; evaluate(scene: VisualScene): ConstraintWarning[]; }

function verticalOrder(scene: VisualScene, upperPattern: RegExp, lowerPattern: RegExp, message: string): ConstraintWarning[] {
  const upper = scene.objects.find((object) => upperPattern.test(`${object.type} ${object.name}`)); const lowers = scene.objects.filter((object) => lowerPattern.test(`${object.type} ${object.name}`));
  if (!upper || !lowers.length) return [];
  const lowerTop = Math.max(...lowers.map((object) => object.position.y + object.dimensions.height / 2));
  return upper.position.y - upper.dimensions.height / 2 < lowerTop ? [{ id: `vertical-order:${upper.id}`, objectId: upper.id, severity: "warning", kind: "vertical-order", message }] : [];
}

export function evaluateVisualConstraints(scene: VisualScene): ConstraintWarning[] {
  const warnings: ConstraintWarning[] = [];
  for (const object of scene.objects) if ([object.dimensions.width, object.dimensions.height, object.dimensions.depth].some((value) => value < MIN_VISUAL_DIMENSION)) warnings.push({ id: `positive:${object.id}`, objectId: object.id, severity: "blocking", kind: "positive-dimensions", message: `${object.name} must keep positive visual dimensions.` });
  warnings.push(...verticalOrder(scene, /tabletop|seat/, /leg|post/, "The top or seat should remain above its supporting legs."));
  warnings.push(...verticalOrder(scene, /roof/, /post/, "The roof should remain above its supporting posts."));
  for (const shelf of scene.objects.filter((object) => object.type === "shelf")) {
    const sides = scene.objects.filter((object) => /left side|right side/i.test(object.name));
    if (sides.length && (shelf.position.y < 0 || shelf.position.y + shelf.dimensions.height / 2 > Math.max(...sides.map((side) => side.dimensions.height)))) warnings.push({ id: `bounds:${shelf.id}`, objectId: shelf.id, severity: "warning", kind: "parent-bounds", message: `${shelf.name} should remain within the cabinet boundaries.` });
  }
  return warnings;
}

export function updateObjectWithConstraints(scene: VisualScene, objectId: string, update: Partial<VisualSceneObject>) {
  const next = { ...scene, objects: scene.objects.map((object) => object.id === objectId ? { ...object, ...update, dimensions: update.dimensions ? { ...object.dimensions, ...update.dimensions } : object.dimensions, position: update.position ? { ...object.position, ...update.position } : object.position, rotation: update.rotation ? { ...object.rotation, ...update.rotation } : object.rotation } : object) };
  return { scene: next, warnings: evaluateVisualConstraints(next) };
}
