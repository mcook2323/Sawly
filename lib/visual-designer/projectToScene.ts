import type { UniversalComponent, UniversalDimensions, UniversalWoodProject } from "../../types/universalProject";
import type { InferredVisualValue, VisualComponentType, VisualDimensions, VisualScene, VisualSceneObject } from "../../types/visualDesigner";
import { visualFinishFromProject, visualMaterialFromProject } from "./materialFactory";
import { validateScene } from "./validation";

const conceptualWarning = "Concept model — not a verified construction plan.";
const riskWarning = "This project will require additional engineering and/or local code verification before build plans can be generated.";
const v = (x = 0, y = 0, z = 0) => ({ x, y, z });
const inches = (measure: UniversalDimensions[keyof Omit<UniversalDimensions, "custom">]) => measure?.unit === "ft" ? measure.value * 12 : measure?.unit === "mm" ? measure.value / 25.4 : measure?.unit === "cm" ? measure.value / 2.54 : measure?.value;

function dimension(project: UniversalWoodProject, key: "length" | "width" | "depth" | "height", fallback: number, inferred: InferredVisualValue[]) {
  const value = inches(project.dimensions[key]);
  if (value && value > 0) return value;
  inferred.push({ field: key, value: fallback, reason: "Safe visual default; the source project did not provide this dimension." });
  return fallback;
}

function componentType(component: UniversalComponent): VisualComponentType {
  const value = `${component.name} ${component.role}`.toLowerCase();
  for (const [pattern, type] of [[/tabletop|top board/, "tabletop"], [/seat board|seat/, "seat"], [/backrest|back rest/, "backrest"], [/roof/, "roof-panel"], [/wall/, "wall-panel"], [/shelf/, "shelf"], [/drawer/, "drawer"], [/door/, "door"], [/platform|floor/, "platform"], [/step|stair/, "step"], [/leg/, "leg"], [/post/, "post"], [/beam|header/, "beam"], [/rail|apron/, "rail"], [/brace/, "brace"], [/panel/, "panel"], [/board/, "board"]] as Array<[RegExp, VisualComponentType]>) if (pattern.test(value)) return type;
  return "generic-box";
}

function baseObject(project: UniversalWoodProject, componentId: string, id: string, name: string, type: VisualComponentType, dimensions: VisualDimensions, position = v(), inferred: InferredVisualValue[] = []): VisualSceneObject {
  const verified = project.verificationStatus === "verified-generator" && project.source.kind === "verified-generator";
  const component = project.components.find((item) => item.id === componentId);
  const material = project.materials.find((item) => component?.materialIds.includes(item.id)) ?? project.materials[0];
  return { id, componentId, name, type, parentId: null, position, rotation: v(), scale: v(1, 1, 1), dimensions, material: visualMaterialFromProject(material), finish: visualFinishFromProject(material?.finish), visible: true, locked: verified, selectable: true, editable: !verified, status: verified ? "verified" : "conceptual", metadata: { inferred, source: verified ? "verified-adapter" : "generic-adapter", role: component?.role } };
}

function tableObjects(project: UniversalWoodProject): VisualSceneObject[] {
  const inferred: InferredVisualValue[] = []; const width = dimension(project, "length", 72, inferred); const depth = dimension(project, "width", 36, inferred); const height = dimension(project, "height", 30, inferred);
  const topId = project.components.find((item) => /tabletop/i.test(item.name))?.id ?? project.components[0]?.id ?? "concept-root";
  const legId = project.components.find((item) => /leg/i.test(item.name))?.id ?? topId;
  const top = baseObject(project, topId, `${topId}:surface`, "Tabletop", "tabletop", { width, height: 1.5, depth, unit: "in" }, v(0, height - 0.75, 0), inferred);
  const inset = 3.5; const legHeight = Math.max(0.125, height - 1.5);
  const legs = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], index) => baseObject(project, legId, `${legId}:${index + 1}`, `Leg ${index + 1}`, "leg", { width: 3.5, height: legHeight, depth: 3.5, unit: "in" }, v(x * (width / 2 - inset), legHeight / 2, z * (depth / 2 - inset))));
  return [top, ...legs];
}

function benchObjects(project: UniversalWoodProject): VisualSceneObject[] {
  const inferred: InferredVisualValue[] = []; const width = dimension(project, "length", 60, inferred); const depth = dimension(project, "depth", 18, inferred); const height = dimension(project, "height", 18, inferred);
  const seatId = project.components.find((item) => /seat/i.test(item.name))?.id ?? project.components[0]?.id ?? "concept-root"; const legId = project.components.find((item) => /leg/i.test(item.name))?.id ?? seatId;
  const seat = baseObject(project, seatId, `${seatId}:surface`, "Seat", "seat", { width, height: 1.5, depth, unit: "in" }, v(0, height - 0.75, 0), inferred);
  const legHeight = Math.max(0.125, height - 1.5); const legs = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], index) => baseObject(project, legId, `${legId}:${index + 1}`, `Leg ${index + 1}`, "leg", { width: 3.5, height: legHeight, depth: 3.5, unit: "in" }, v(x * (width / 2 - 3.5), legHeight / 2, z * (depth / 2 - 2.5))));
  return [seat, ...legs];
}

function archetypeObjects(project: UniversalWoodProject): VisualSceneObject[] {
  const inferred: InferredVisualValue[] = []; const width = dimension(project, "length", /cabinet|shelv|workbench/.test(project.projectType) ? 60 : 96, inferred); const depth = dimension(project, "depth", dimension(project, "width", /pergola|playhouse|garden/.test(project.projectType) ? 72 : 20, inferred), inferred); const height = dimension(project, "height", /pergola|playhouse/.test(project.projectType) ? 96 : /cabinet|shelv/.test(project.projectType) ? 72 : 36, inferred);
  const root = project.components[0]?.id ?? "concept-root"; const make = (suffix: string, name: string, type: VisualComponentType, dims: [number, number, number], pos: [number, number, number]) => baseObject(project, root, `${root}:${suffix}`, name, type, { width: dims[0], height: dims[1], depth: dims[2], unit: "in" }, v(...pos), [...(suffix === "primary" ? inferred : []), { field: "geometry", value: suffix, reason: `Conceptual ${project.projectType} archetype; no verified component geometry was supplied.` }]);
  if (/pergola/.test(project.projectType)) return [...[[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,z], i) => make(`post-${i+1}`, `Post ${i+1}`, "post", [5.5,height,5.5], [x*(width/2-3),height/2,z*(depth/2-3)])), make("roof-1", "Overhead beams", "beam", [width,5.5,5.5], [0,height-2.75,-depth/2+3]), make("roof-2", "Overhead beams 2", "beam", [width,5.5,5.5], [0,height-2.75,depth/2-3])];
  if (/cabinet|shelv|book/.test(project.projectType)) return [make("left", "Left side", "panel", [0.75,height,depth], [-width/2+0.375,height/2,0]), make("right", "Right side", "panel", [0.75,height,depth], [width/2-0.375,height/2,0]), make("top", "Top", "panel", [width,0.75,depth], [0,height-0.375,0]), make("bottom", "Bottom", "panel", [width,0.75,depth], [0,0.375,0]), ...[1,2,3].map((n) => make(`shelf-${n}`, `Shelf ${n}`, "shelf", [width-1.5,0.75,depth-0.5], [0,n*height/4,0]))];
  if (/garden/.test(project.projectType)) return [make("front", "Front wall", "board", [width,12,1.5], [0,6,-depth/2]), make("back", "Back wall", "board", [width,12,1.5], [0,6,depth/2]), make("left", "Left wall", "board", [1.5,12,depth], [-width/2,6,0]), make("right", "Right wall", "board", [1.5,12,depth], [width/2,6,0])];
  if (/playhouse/.test(project.projectType)) return [make("platform", "Raised platform", "platform", [width,5.5,depth], [0,24,0]), ...[[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,z],i)=>make(`post-${i+1}`,`Post ${i+1}`,"post",[5.5,height,5.5],[x*(width/2-3),height/2,z*(depth/2-3)])), make("roof", "Roof", "roof-panel", [width+8,2,depth+8], [0,height+8,0])];
  if (/workbench/.test(project.projectType)) return tableObjects({ ...project, dimensions: { length: { value: width, unit: "in" }, width: { value: depth, unit: "in" }, height: { value: height, unit: "in" } } });
  if (project.components.length > 1) return project.components.map((component, index) => { const componentWidth = inches(component.dimensions?.length) ?? Math.max(6, width / project.components.length); const componentHeight = inches(component.dimensions?.height) ?? Math.max(1.5, height / 2); const componentDepth = inches(component.dimensions?.depth) ?? inches(component.dimensions?.width) ?? depth; return baseObject(project, component.id, component.id, component.name, componentType(component), { width: componentWidth, height: componentHeight, depth: componentDepth, unit: "in" }, v((index - (project.components.length - 1) / 2) * componentWidth, componentHeight / 2, 0), [{ field: "position", value: index, reason: "Components were arranged for concept visibility because source positions were unavailable." }]); });
  return [make("primary", project.name, "generic-box", [width,height,depth], [0,height/2,0])];
}

export function projectToScene(project: UniversalWoodProject): VisualScene {
  const verified = project.verificationStatus === "verified-generator" && project.source.kind === "verified-generator";
  const adapter = verified && project.projectType === "outdoor-table" ? "verified-table" : verified && project.projectType === "outdoor-bench" ? "verified-bench" : "generic";
  let objects = adapter === "verified-table" || (!verified && /table/.test(project.projectType) && !/workbench/.test(project.projectType)) ? tableObjects(project) : adapter === "verified-bench" || (!verified && /bench/.test(project.projectType)) ? benchObjects(project) : archetypeObjects(project);
  const represented = new Set(objects.map((object) => object.componentId)); const additions = project.components.filter((component) => /conversation-added/i.test(component.role) && !represented.has(component.id)).map((component, index) => { const width = inches(component.dimensions?.length) ?? 18; const height = inches(component.dimensions?.height) ?? 6; const depth = inches(component.dimensions?.depth) ?? inches(component.dimensions?.width) ?? 12; return baseObject(project, component.id, component.id, component.name, componentType(component), { width, height, depth, unit: "in" }, v(0, 12 + index * (height + 2), 0), [{ field: "position", value: index, reason: "Conversation-added component uses a conceptual display position until a deterministic layout exists." }]); });
  objects = [...objects, ...additions].map((object) => { const transform = project.visualization.componentTransforms?.[object.componentId]; const edited = project.visualization.lastEdit?.componentIds.includes("*") || project.visualization.lastEdit?.componentIds.includes(object.componentId); return { ...object, ...(transform?.position ? { position: transform.position } : {}), ...(transform?.rotation ? { rotation: transform.rotation } : {}), metadata: { ...object.metadata, ...(edited ? { editStatus: project.visualization.lastEdit?.status ?? "modified" } : {}) } }; });
  const warnings = [...project.warnings.map((warning) => warning.message), ...(!verified ? [conceptualWarning] : []), ...(project.riskTier === "code-sensitive" && !project.warnings.some((warning) => warning.message === riskWarning) ? [riskWarning] : [])];
  const scene: VisualScene = { schemaVersion: 1, id: `scene:${project.id}`, projectId: project.id, projectName: project.name, projectType: project.projectType, riskTier: project.riskTier, verificationStatus: project.verificationStatus, unit: "in", objects, rootIds: objects.filter((object) => !object.parentId).map((object) => object.id), mode: "lifestyle", showDimensions: false, camera: { view: "perspective", orthographic: false, target: v(0, 24, 0), zoom: 1 }, warnings: [...new Set(warnings)], metadata: { adapter, conceptual: !verified, sourceProjectSchemaVersion: project.schemaVersion } };
  const validation = validateScene(scene); if (!validation.valid) throw new TypeError(validation.errors.join(" "));
  return scene;
}

export const projectToVerifiedTableScene = (project: UniversalWoodProject) => { if (project.projectType !== "outdoor-table" || project.verificationStatus !== "verified-generator") throw new TypeError("Verified Table adapter requires a verified outdoor-table project."); return projectToScene(project); };
export const projectToVerifiedBenchScene = (project: UniversalWoodProject) => { if (project.projectType !== "outdoor-bench" || project.verificationStatus !== "verified-generator") throw new TypeError("Verified Bench adapter requires a verified outdoor-bench project."); return projectToScene(project); };
