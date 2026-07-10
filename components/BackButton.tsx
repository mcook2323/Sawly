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
      className="group inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[#7d7268] transition-colors hover:text-[#657151] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#667154]/40"
    >
      <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">
        ←
      </span>
      Back to projects
    </button>
  );
}
