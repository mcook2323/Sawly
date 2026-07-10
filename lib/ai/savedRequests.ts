import type { SavedDesignRequest } from "@/types/ai";

export const SAVED_DESIGN_REQUESTS_KEY = "sawly.design-requests.v1";

function valid(value: unknown): value is SavedDesignRequest {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SavedDesignRequest>;
  return (
    typeof item.id === "string" &&
    typeof item.prompt === "string" &&
    item.prompt.trim().length > 0 &&
    typeof item.savedAt === "string" &&
    !Number.isNaN(Date.parse(item.savedAt)) &&
    !!item.parsed &&
    typeof item.parsed.raw === "string" &&
    typeof item.parsed.normalized === "string" &&
    typeof item.parsed.projectType === "string" &&
    Array.isArray(item.parsed.keywords)
  );
}

export function readSavedDesignRequests(): SavedDesignRequest[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(SAVED_DESIGN_REQUESTS_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    const unique = new Map<string, SavedDesignRequest>();
    value.filter(valid).forEach((item) => {
      const normalized = normalizePrompt(item.prompt);
      if (!unique.has(normalized)) unique.set(normalized, item);
    });
    return [...unique.values()];
  } catch {
    return [];
  }
}

export function writeSavedDesignRequests(requests: SavedDesignRequest[]) {
  window.localStorage.setItem(SAVED_DESIGN_REQUESTS_KEY, JSON.stringify(requests));
}

export function normalizePrompt(prompt: string) {
  return prompt.trim().toLowerCase().replace(/\s+/g, " ");
}

export function saveDesignRequest(request: Omit<SavedDesignRequest, "id" | "savedAt">) {
  const current = readSavedDesignRequests();
  const duplicate = current.find((item) => normalizePrompt(item.prompt) === normalizePrompt(request.prompt));
  if (duplicate) return { request: duplicate, created: false } as const;
  const saved = { ...request, id: crypto.randomUUID(), savedAt: new Date().toISOString() };
  writeSavedDesignRequests([saved, ...current].slice(0, 20));
  return { request: saved, created: true } as const;
}
