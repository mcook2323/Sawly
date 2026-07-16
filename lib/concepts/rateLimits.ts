import { MemoryRateLimiter } from "@/lib/ai/server/rateLimiter";
export const conceptRateLimiter = new MemoryRateLimiter(60_000, 3, Number(process.env.SAWLY_DAILY_CONCEPT_LIMIT || 10), 3_000);
export const imageRateLimiter = new MemoryRateLimiter(60_000, 6, Number(process.env.SAWLY_DAILY_IMAGE_LIMIT || 30), 2_000);
const activeConceptSessions = new Set<string>();
export async function withConceptSessionJob<T>(session: string, job: () => Promise<T>) { if (activeConceptSessions.has(session)) throw new Error("job-active"); activeConceptSessions.add(session); try { return await job(); } finally { activeConceptSessions.delete(session); } }
