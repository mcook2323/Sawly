import { matchProjectTemplate } from "./matcher";
import type { ConfidenceBand, DesignProfile, GuidedDesignResolution, RankedTemplateMatch } from "@/types/ai";

export function confidenceBand(score: number): ConfidenceBand { return score >= 0.8 ? "high" : score >= 0.5 ? "medium" : "low"; }

export function scoreDesignProfile(profile: DesignProfile): GuidedDesignResolution {
  const candidates: RankedTemplateMatch[] = [];
  const direct = matchProjectTemplate({ ...profile.originalRequest, projectType: profile.projectType, material: profile.material, dimensions: profile.dimensions, capacity: profile.capacity, style: profile.style, keywords: [...profile.keywords, ...(profile.environment ? [profile.environment] : [])] });
  if (direct) {
    let score = direct.confidence;
    if (profile.environment === "outdoor") score += 0.04;
    if (profile.material) score += 0.02;
    if (Object.keys(profile.dimensions).length > 0 || profile.capacity) score += 0.02;
    score = Math.min(0.99, score);
    candidates.push({ ...direct, score, confidence: score, band: confidenceBand(score) });
  }
  // Ambiguous outdoor seating can reasonably lead to either supported template.
  if (!direct && !profile.projectTypeExplicitlyOther && profile.environment === "outdoor" && /seat|dining|gather/i.test(profile.intendedUse ?? "")) {
    for (const type of ["table", "bench"] as const) {
      const match = matchProjectTemplate({ ...profile.originalRequest, projectType: type, keywords: [...profile.keywords, "outdoor"] });
      if (match) candidates.push({ ...match, score: 0.58, confidence: 0.58, band: "medium" });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const confidence = candidates[0]?.score ?? Math.min(0.45, profile.completeness / 200);
  const band = confidenceBand(confidence);
  return { profile, matches: band === "high" ? candidates.slice(0, 1) : candidates.slice(0, 3), confidence, band, explanation: band === "high" ? "Your project type, setting, and preferences align with a supported template." : band === "medium" ? "Your answers could fit more than one supported starting point. Compare the options before continuing." : "Sawly does not yet have a verified template that fits this project closely enough." };
}
