"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { markSawlyNavigation } from "@/lib/internalNavigation";

type Props = ComponentProps<typeof Link>;

export function TrackedProjectLink({ onClick, href, ...props }: Props) {
  return (
    <Link
      {...props}
      href={href}
      onClick={(event) => {
        if (
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          markSawlyNavigation(typeof href === "string" ? href : href.pathname ?? "");
        }
        onClick?.(event);
      }}
    />
  );
}
