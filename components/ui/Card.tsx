import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ interactive = false, className = "", ...props }: CardProps) {
  return <div className={`ds-card ${interactive ? "ds-card-interactive" : ""} ${className}`} {...props} />;
}
