import type { VisualSceneObject } from "../../types/visualDesigner";

export function geometryKey(object: VisualSceneObject) { return `${object.type}:${object.dimensions.width}:${object.dimensions.height}:${object.dimensions.depth}`; }
export function geometryScale(object: VisualSceneObject) { return [object.dimensions.width, object.dimensions.height, object.dimensions.depth] as const; }
