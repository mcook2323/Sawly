import type { ProjectEnvironment, UniversalWoodProject } from "./universalProject";

export type ConversationEditType = "dimension-change" | "material-change" | "finish-change" | "component-add" | "component-remove" | "component-move" | "component-resize" | "component-rename" | "style-change" | "constraint-change" | "budget-target" | "difficulty-target" | "safety-target" | "environment-change" | "storage-change";
export type ConversationEditOrigin = "user" | "assistant" | "system";
export interface EditTarget { scope: "project" | "component" | "material"; id?: string; selector?: string; }
export interface ProjectEditBase { id: string; type: ConversationEditType; target: EditTarget; reason: string; confidence: number; metadata: Record<string, string | number | boolean | string[]>; timestamp: string; origin: ConversationEditOrigin; }
export type DimensionAxis = "length" | "width" | "depth" | "height";
export interface DimensionChange extends ProjectEditBase { type: "dimension-change"; axis: DimensionAxis; operation: "set" | "delta" | "maximum"; value: number; unit: "in"; }
export interface MaterialChange extends ProjectEditBase { type: "material-change"; material: string; }
export interface FinishChange extends ProjectEditBase { type: "finish-change"; finish: string; }
export interface ComponentAdd extends ProjectEditBase { type: "component-add"; componentType: string; quantity: number; }
export interface ComponentRemove extends ProjectEditBase { type: "component-remove"; }
export interface ComponentMove extends ProjectEditBase { type: "component-move"; axis: "x" | "y" | "z"; operation: "set" | "delta"; value: number; unit: "in"; }
export interface ComponentResize extends ProjectEditBase { type: "component-resize"; axis: "width" | "height" | "depth"; operation: "set" | "delta"; value: number; unit: "in"; }
export interface ComponentRename extends ProjectEditBase { type: "component-rename"; name: string; }
export interface StyleChange extends ProjectEditBase { type: "style-change"; style: string; }
export interface ConstraintChange extends ProjectEditBase { type: "constraint-change"; constraint: "room-bounds" | "board-count" | "clearance" | "tool-availability"; values: Record<string, number>; }
export interface BudgetTarget extends ProjectEditBase { type: "budget-target"; direction: "lower" | "set"; amount?: number; }
export interface DifficultyTarget extends ProjectEditBase { type: "difficulty-target"; targetDifficulty: "beginner" | "intermediate" | "advanced" | "easier"; }
export interface SafetyTarget extends ProjectEditBase { type: "safety-target"; audience: "toddlers" | "children" | "general"; }
export interface EnvironmentChange extends ProjectEditBase { type: "environment-change"; environment: ProjectEnvironment; }
export interface StorageChange extends ProjectEditBase { type: "storage-change"; storageType: "drawer" | "door" | "shelf" | "cabinet"; operation: "add" | "remove"; quantity: number; }
export type StructuredProjectEdit = DimensionChange | MaterialChange | FinishChange | ComponentAdd | ComponentRemove | ComponentMove | ComponentResize | ComponentRename | StyleChange | ConstraintChange | BudgetTarget | DifficultyTarget | SafetyTarget | EnvironmentChange | StorageChange;

export interface EditorMemory { style: string | null; budget: number | null; budgetDirection: "lower" | null; materials: string[]; roomSize: { width: number; depth: number } | null; safetyAudience: string | null; difficulty: string | null; toolAvailability: string[]; previousEditIds: string[]; }
export interface EditClarification { id: string; question: string; reason: string; pendingRequest: string; options?: string[]; }
export interface ConversationEditRequest { text: string; project: UniversalWoodProject; memory: EditorMemory; selectedComponentId?: string | null; now?: string; }
export interface ConversationEditTranslation { normalizedRequest: string; edits: StructuredProjectEdit[]; clarification: EditClarification | null; memory: EditorMemory; }
export interface EditValidationIssue { editId: string; code: "invalid-value" | "invalid-material" | "missing-target" | "conflict" | "unsafe-edit" | "verified-route-required"; message: string; }
export interface EditValidationResult { valid: boolean; accepted: StructuredProjectEdit[]; issues: EditValidationIssue[]; requiresDeterministicGenerator: boolean; }
export interface EditExplanation { summary: string; changes: string[]; reason: string; tradeoffs: string[]; concerns: string[]; }
export interface ConversationEditResult { status: "applied" | "clarification" | "rejected" | "route-required"; project: UniversalWoodProject; edits: StructuredProjectEdit[]; clarification: EditClarification | null; explanation: EditExplanation; memory: EditorMemory; }
export interface ConversationEditHistoryEntry { id: string; request: string; edits: StructuredProjectEdit[]; before: UniversalWoodProject; after: UniversalWoodProject; explanation: EditExplanation; timestamp: string; origin: ConversationEditOrigin; }
export interface ConversationEditHistory { schemaVersion: 1; initialProject: UniversalWoodProject; past: ConversationEditHistoryEntry[]; future: ConversationEditHistoryEntry[]; memory: EditorMemory; limit: number; }
export interface ConversationEditor { translate(request: ConversationEditRequest): ConversationEditTranslation; }
