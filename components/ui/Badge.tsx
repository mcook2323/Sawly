import type { HTMLAttributes } from "react";

type BadgeTone = "success" | "muted" | "clay";

export function Badge({ tone = "muted", className = "", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={`ds-badge ds-badge-${tone} ${className}`} {...props} />;
}

export function Tag({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={`ds-tag ${className}`} {...props} />;
}
