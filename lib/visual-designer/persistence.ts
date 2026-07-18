import type { VisualDraftEnvelope, VisualDraftPersistence, VisualScene } from "../../types/visualDesigner";
import { validateScene } from "./validation";

export const VISUAL_DRAFT_STORAGE_KEY = "sawly.visual-drafts.v1";
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function parseDrafts(raw: string | null): VisualDraftEnvelope[] { if (!raw) return []; try { const value: unknown = JSON.parse(raw); if (!Array.isArray(value)) return []; return value.filter((item): item is VisualDraftEnvelope => Boolean(item && typeof item === "object" && (item as VisualDraftEnvelope).schemaVersion === 1 && (item as VisualDraftEnvelope).kind === "sawly-visual-draft" && validateScene((item as VisualDraftEnvelope).scene).valid)); } catch { return []; } }

export class LocalVisualDraftPersistence implements VisualDraftPersistence {
  constructor(private storage: StorageLike) {}
  save(scene: VisualScene) { if (!validateScene(scene).valid) throw new TypeError("Cannot persist an invalid visual scene."); const drafts = parseDrafts(this.storage.getItem(VISUAL_DRAFT_STORAGE_KEY)).filter((draft) => draft.projectId !== scene.projectId); drafts.push({ schemaVersion: 1, kind: "sawly-visual-draft", projectId: scene.projectId, savedAt: new Date().toISOString(), scene }); this.storage.setItem(VISUAL_DRAFT_STORAGE_KEY, JSON.stringify(drafts.slice(-20))); }
  load(projectId: string) { return [...parseDrafts(this.storage.getItem(VISUAL_DRAFT_STORAGE_KEY))].reverse().find((draft) => draft.projectId === projectId)?.scene ?? null; }
  remove(projectId: string) { const drafts = parseDrafts(this.storage.getItem(VISUAL_DRAFT_STORAGE_KEY)).filter((draft) => draft.projectId !== projectId); if (drafts.length) this.storage.setItem(VISUAL_DRAFT_STORAGE_KEY, JSON.stringify(drafts)); else this.storage.removeItem(VISUAL_DRAFT_STORAGE_KEY); }
}
