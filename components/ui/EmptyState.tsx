import type { ReactNode } from "react";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="ds-empty"><h3 className="ds-subheading">{title}</h3><p className="ds-body mx-auto mt-3 max-w-xl">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}
