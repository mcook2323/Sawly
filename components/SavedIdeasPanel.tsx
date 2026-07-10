"use client";

import Link from "next/link";
import type { SavedDesignRequest } from "@/types/ai";
import { Badge, Tag } from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";

export function SavedIdeasPanel({ ideas, onDelete }: { ideas: SavedDesignRequest[]; onDelete: (id: string) => void }) {
  if (ideas.length === 0) return null;
  return (
    <section id="saved-ideas" className="border-b border-[var(--color-border)] bg-[var(--color-canvas-muted)] px-5 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="ds-eyebrow">Ideas to revisit</p><h2 className="ds-subheading mt-2">Saved ideas</h2></div><p className="ds-caption">Stored only in this browser</p></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => <article key={idea.id} className="ds-card p-5"><Badge tone="clay">Future project</Badge><h3 className="mt-4 text-lg font-semibold">{idea.prompt}</h3><div className="mt-4 flex flex-wrap gap-2">{idea.parsed.projectType !== "unknown" && <Tag>{idea.parsed.projectType}</Tag>}{idea.parsed.material && <Tag>{idea.parsed.material}</Tag>}</div><p className="ds-caption mt-4">Saved {new Date(idea.savedAt).toLocaleDateString()}</p><div className="mt-5 flex flex-wrap gap-3"><Link href={`/design?prompt=${encodeURIComponent(idea.prompt)}`} className={buttonClassName("secondary", "min-h-10 px-4 py-2")}>View idea</Link><button type="button" onClick={() => onDelete(idea.id)} className="ds-button ds-button-destructive min-h-10 px-4 py-2">Delete</button></div></article>)}
        </div>
      </div>
    </section>
  );
}
