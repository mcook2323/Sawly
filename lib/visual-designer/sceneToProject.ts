import type { UniversalWoodProject } from "../../types/universalProject";
import type { VisualScene } from "../../types/visualDesigner";
import { validateScene } from "./validation";

export function sceneToConceptProject(original: UniversalWoodProject, scene: VisualScene): UniversalWoodProject {
  if (original.verificationStatus === "verified-generator" || original.source.kind === "verified-generator") throw new Error("Verified geometry cannot be manually overridden. Use the deterministic generator.");
  const validation = validateScene(scene); if (!validation.valid) throw new TypeError(validation.errors.join(" "));
  const visible = scene.objects.filter((object) => object.visible);
  const bounds = visible.reduce((result, object) => ({ width: Math.max(result.width, Math.abs(object.position.x) * 2 + object.dimensions.width), height: Math.max(result.height, object.position.y + object.dimensions.height / 2), depth: Math.max(result.depth, Math.abs(object.position.z) * 2 + object.dimensions.depth) }), { width: 0.125, height: 0.125, depth: 0.125 });
  const byComponent = new Map(scene.objects.map((object) => [object.componentId, object]));
  const primary = scene.objects[0];
  return { ...original, dimensions: { length: { value: bounds.width, unit: "in" }, width: { value: bounds.depth, unit: "in" }, height: { value: bounds.height, unit: "in" } }, components: original.components.map((component) => { const object = byComponent.get(component.id); return object ? { ...component, name: object.name, dimensions: { length: { value: object.dimensions.width, unit: "in" }, width: { value: object.dimensions.depth, unit: "in" }, height: { value: object.dimensions.height, unit: "in" } } } : component; }), materials: original.materials.map((material, index) => index === 0 && primary ? { ...material, name: primary.material.replaceAll("-", " "), species: primary.material, finish: primary.finish } : material), metadata: { ...original.metadata, tags: [...new Set([...original.metadata.tags, "visually-edited-concept"])] } };
}
