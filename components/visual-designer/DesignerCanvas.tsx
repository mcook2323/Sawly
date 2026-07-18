"use client";
import { memo, useMemo, useRef } from "react";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { Grid, OrbitControls, OrthographicCamera, PerspectiveCamera, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import type { TransformMode, VisualMode, VisualScene, VisualSceneObject } from "@/types/visualDesigner";
import { cameraPosition } from "@/lib/visual-designer/camera";
import { geometryScale } from "@/lib/visual-designer/geometryFactory";
import { materialAppearance } from "@/lib/visual-designer/materialFactory";
import { DimensionOverlay } from "./DimensionOverlay";
import { SelectionOutline } from "./SelectionOutline";

interface DesignerCanvasProps { scene: VisualScene; selectedId: string | null; transformMode: TransformMode; zoom: number; snapEnabled: boolean; snapIncrement: number; highlightedIds: string[]; onSelect: (id: string | null) => void; onTransform: (id: string, update: Partial<VisualSceneObject>) => void; }

const SceneObject = memo(function SceneObject({ object, mode, selected, edited, transformMode, showDimensions, snapEnabled, snapIncrement, onSelect, onTransform }: { object: VisualSceneObject; mode: VisualMode; selected: boolean; edited: boolean; transformMode: TransformMode; showDimensions: boolean; snapEnabled: boolean; snapIncrement: number; onSelect: (id: string) => void; onTransform: DesignerCanvasProps["onTransform"] }) {
  const mesh = useRef<THREE.Mesh>(null); const appearance = useMemo(() => materialAppearance(object.material, object.finish, mode), [mode, object.finish, object.material]); const scale = geometryScale(object);
  const visual = <mesh ref={mesh} name={object.name} position={[object.position.x, object.position.y, object.position.z]} rotation={[object.rotation.x, object.rotation.y, object.rotation.z]} scale={[object.scale.x, object.scale.y, object.scale.z]} visible={object.visible} onClick={(event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); onSelect(object.id); }}><boxGeometry args={scale} /><meshStandardMaterial {...appearance} emissive={edited ? "#6b311f" : "#000000"} emissiveIntensity={edited ? 0.16 : 0} /><SelectionOutline selected={selected} edited={edited} /><DimensionOverlay object={object} selected={selected || edited} visible={showDimensions || edited} /></mesh>;
  if (!selected || transformMode === "select" || object.locked || !object.editable) return visual;
  const modeName = transformMode === "move" ? "translate" : transformMode === "resize" ? "scale" : "rotate";
  return <TransformControls mode={modeName} translationSnap={snapEnabled ? snapIncrement : null} rotationSnap={snapEnabled ? Math.PI / 12 : null} scaleSnap={snapEnabled ? snapIncrement : null} onMouseUp={() => { const current = mesh.current; if (!current) return; if (modeName === "scale") { const dimensions = { width: Math.max(0.125, object.dimensions.width * current.scale.x), height: Math.max(0.125, object.dimensions.height * current.scale.y), depth: Math.max(0.125, object.dimensions.depth * current.scale.z), unit: "in" as const }; current.scale.set(1, 1, 1); onTransform(object.id, { dimensions, scale: { x: 1, y: 1, z: 1 } }); } else if (modeName === "translate") onTransform(object.id, { position: { x: current.position.x, y: current.position.y, z: current.position.z } }); else onTransform(object.id, { rotation: { x: current.rotation.x, y: current.rotation.y, z: current.rotation.z } }); }}>{visual}</TransformControls>;
});

export function DesignerCanvas({ scene, selectedId, transformMode, zoom, snapEnabled, snapIncrement, highlightedIds, onSelect, onTransform }: DesignerCanvasProps) {
  const position = cameraPosition(scene.camera.view, scene); const cameraPositionValue: [number, number, number] = [position.x / zoom, position.y / zoom, position.z / zoom]; const target: [number, number, number] = [scene.camera.target.x, scene.camera.target.y, scene.camera.target.z];
  return <Canvas dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: "high-performance" }} onPointerMissed={() => onSelect(null)} aria-label={`Interactive 3D model of ${scene.projectName}`}>
    <color attach="background" args={[scene.mode === "blueprint" ? "#eef3ef" : scene.mode === "lifestyle" ? "#eee5d8" : "#e4dfd6"]} />
    <ambientLight intensity={scene.mode === "lifestyle" ? 1.3 : 1.05} /><directionalLight position={[80, 120, 60]} intensity={2.1} castShadow /><directionalLight position={[-60, 50, -40]} intensity={0.65} />
    {scene.camera.orthographic ? <OrthographicCamera makeDefault position={cameraPositionValue} zoom={zoom * 5} near={0.1} far={5000} /> : <PerspectiveCamera makeDefault position={cameraPositionValue} fov={40} near={0.1} far={5000} />}
    {scene.mode !== "lifestyle" && <Grid args={[600, 600]} cellSize={6} sectionSize={12} fadeDistance={500} cellColor={scene.mode === "blueprint" ? "#b8c9c0" : "#c3b9a8"} sectionColor="#769083" infiniteGrid />}
    <group>{scene.objects.map((object) => <SceneObject key={object.id} object={object} mode={scene.mode} selected={selectedId === object.id} edited={highlightedIds.includes("*") || highlightedIds.includes(object.componentId)} transformMode={transformMode} showDimensions={scene.showDimensions} snapEnabled={snapEnabled} snapIncrement={snapIncrement} onSelect={onSelect} onTransform={onTransform} />)}</group>
    <OrbitControls makeDefault target={target} enableDamping dampingFactor={0.08} enableZoom={false} enablePan mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN }} minPolarAngle={0.05} maxPolarAngle={Math.PI / 2.02} />
  </Canvas>;
}
