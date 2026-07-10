"use client";

import { useRouter } from "next/navigation";
import {
  clearSawlyNavigationMarker,
  hasUsableSawlyHistory,
} from "@/lib/internalNavigation";

interface BackButtonProps {
  fallbackHref?: string;
}

export function BackButton({ fallbackHref = "/#catalog" }: BackButtonProps) {
  const router = useRouter();

  function handleBack() {
    const canGoBack = hasUsableSawlyHistory();
    clearSawlyNavigationMarker();

    if (canGoBack) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="ds-button-ghost group inline-flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm font-medium transition-colors"
    >
      <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">
        ←
      </span>
      Back to projects
    </button>
  );
}
