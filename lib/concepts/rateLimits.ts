import { MemoryRateLimiter } from "@/lib/ai/server/rateLimiter";
export const conceptRateLimiter = new MemoryRateLimiter(60_000, 3, Number(process.env.SAWLY_DAILY_CONCEPT_LIMIT || 10), 3_000);
export const imageRateLimiter = new MemoryRateLimiter(60_000, 6, Number(process.env.SAWLY_DAILY_IMAGE_LIMIT || 30), 2_000);
const activeConceptSessions = new Set<string>(); const activeImageSessions = new Set<string>();
export async function withSessionJob<T>(type: "concept"|"image", session: string, job: () => Promise<T>) { const set = type === "concept" ? activeConceptSessions : activeImageSessions; if (set.has(session)) throw new Error("job-active"); set.add(session); try { return await job(); } finally { set.delete(session); } }
