import { matchProjectTemplate } from "./matcher";
import type { DesignProfile, ParsedDesignRequest } from "@/types/ai";

export type DesignRequestRoute = "verified-template" | "custom-concept" | "ambiguous";

const CLEARLY_UNSUPPORTED_PATTERNS = [
  /\b(?:outdoor\s+)?kitchen\b/,
  /\bpergola\b/,
  /\b(?:built[- ]?in\s+)?(?:bookcase|bookshel(?:f|ves))\b/,
  /\bgarage\s+(?:cabinet|cabinetry|cabinets)\b/,
  /\bmudroom\s+bench\b/,
  /\boutdoor\s+bar\b/,
  /\bwork\s?bench\b/,
  /\b(?:raised\s+)?garden\s+bed\b/,
];

export function isClearlyUnsupportedRequest(request: ParsedDesignRequest) {
  return CLEARLY_UNSUPPORTED_PATTERNS.some((pattern) => pattern.test(request.normalized));
}

export function classifyDesignRequest(request: ParsedDesignRequest): DesignRequestRoute {
  // Named unsupported categories take priority so "mudroom bench" cannot be
  // mistaken for the verified outdoor bench solely because it contains "bench".
  if (isClearlyUnsupportedRequest(request)) return "custom-concept";
  if (matchProjectTemplate(request)) return "verified-template";
  return "ambiguous";
}

export function classifyDesignProfile(profile: DesignProfile): DesignRequestRoute {
  if (profile.projectTypeExplicitlyOther || isClearlyUnsupportedRequest(profile.originalRequest)) return "custom-concept";
  return classifyDesignRequest({
    ...profile.originalRequest,
    projectType: profile.projectType,
    material: profile.material,
    dimensions: profile.dimensions,
    capacity: profile.capacity,
    style: profile.style,
    keywords: [...profile.keywords, ...(profile.environment ? [profile.environment] : [])],
  });
}
