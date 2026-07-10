const INTERNAL_NAVIGATION_KEY = "sawly.internal-navigation.v1";
const MAX_MARKER_AGE_MS = 30 * 60 * 1000;

interface InternalNavigationMarker {
  from: string;
  targetPath: string;
  createdAt: number;
}

export function markSawlyNavigation(targetHref: string) {
  try {
    const target = new URL(targetHref, window.location.href);
    if (target.origin !== window.location.origin) return;
    const marker: InternalNavigationMarker = {
      from: window.location.href,
      targetPath: target.pathname,
      createdAt: Date.now(),
    };
    window.sessionStorage.setItem(INTERNAL_NAVIGATION_KEY, JSON.stringify(marker));
  } catch {
    // Navigation should still proceed if storage is unavailable.
  }
}

export function hasUsableSawlyHistory() {
  if (window.history.length <= 1) return false;

  try {
    const raw = window.sessionStorage.getItem(INTERNAL_NAVIGATION_KEY);
    const marker = raw ? (JSON.parse(raw) as Partial<InternalNavigationMarker>) : null;
    if (
      marker &&
      typeof marker.from === "string" &&
      marker.targetPath === window.location.pathname &&
      typeof marker.createdAt === "number" &&
      Date.now() - marker.createdAt < MAX_MARKER_AGE_MS &&
      new URL(marker.from).origin === window.location.origin
    ) {
      return true;
    }
  } catch {
    // Fall through to the referrer check.
  }

  try {
    return Boolean(document.referrer) && new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

export function clearSawlyNavigationMarker() {
  try {
    window.sessionStorage.removeItem(INTERNAL_NAVIGATION_KEY);
  } catch {
    // Storage may be unavailable; clearing is best effort.
  }
}
